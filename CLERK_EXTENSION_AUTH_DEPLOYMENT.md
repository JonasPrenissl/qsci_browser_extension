# Clerk Extension Authentication - Deployment Guide

## Problem Solved

Previously, the extension showed this error after Clerk authentication:
```json
{
  "errors": [{
    "message": "Invalid URL scheme",
    "long_message": "Please provide a URL with one of the following schemes: https, http",
    "code": "invalid_url_scheme",
    "meta": {"param_name": "redirect_url"}
  }]
}
```

**Root Cause**: Clerk cannot use `chrome-extension://` URLs as redirect targets. Browser extension URLs don't use HTTPS/HTTP schemes.

**Solution**: Web-based authentication proxy that uses valid HTTPS URLs.

## How It Works Now

### Authentication Flow

```
┌─────────────┐
│  Extension  │
│   Popup     │
└──────┬──────┘
       │ 1. User clicks "Login"
       │
       ▼
┌──────────────────────────────────────┐
│  Opens new tab:                      │
│  https://www.q-sci.org/extension-login│
└──────┬───────────────────────────────┘
       │ 2. Clerk authentication UI loads
       │
       ▼
┌──────────────────────────────────────┐
│  User enters credentials             │
│  Clerk handles OAuth, email, etc.    │
└──────┬───────────────────────────────┘
       │ 3. After successful auth
       │
       ▼
┌──────────────────────────────────────────────┐
│  Clerk redirects to:                         │
│  https://www.q-sci.org/extension-auth-success│
└──────┬───────────────────────────────────────┘
       │ 4. Page gets session token
       │    and subscription status
       │
       ▼
┌──────────────────────────────────────┐
│  Sends token to extension via:       │
│  window.opener.postMessage()         │
└──────┬───────────────────────────────┘
       │ 5. Extension receives token
       │
       ▼
┌──────────────────────────────────────┐
│  Extension stores token              │
│  Tab auto-closes                     │
│  User is logged in!                  │
└──────────────────────────────────────┘
```

### Key Benefits

✅ **All URLs are HTTPS** → Clerk is happy  
✅ **No chrome-extension:// URLs** → No "Invalid URL scheme" error  
✅ **Seamless user experience** → Tab opens, authenticates, closes automatically  
✅ **Works with all OAuth providers** → Google, Apple, GitHub, etc. all work perfectly

## Deployment Steps

### 1. Deploy Website Pages

The `website/` directory contains two HTML files that must be deployed to your website:

```
website/
  ├── extension-login.html          → Deploy to: /extension-login
  └── extension-auth-success.html   → Deploy to: /extension-auth-success
```

#### Option A: Vercel Deployment (Recommended)

If you're using Vercel for your website:

1. Add the website files to your Vercel project
2. Configure routes in `vercel.json`:

```json
{
  "routes": [
    {
      "src": "/extension-login",
      "dest": "/website/extension-login.html"
    },
    {
      "src": "/extension-auth-success",
      "dest": "/website/extension-auth-success.html"
    }
  ]
}
```

3. Deploy:
```bash
vercel --prod
```

#### Option B: Static File Hosting

Simply upload the files to your web server:

```bash
# Copy files to your web server
scp website/extension-login.html user@server:/var/www/html/extension-login.html
scp website/extension-auth-success.html user@server:/var/www/html/extension-auth-success.html
```

Configure your web server to serve them:
- `/extension-login` → `extension-login.html`
- `/extension-auth-success` → `extension-auth-success.html`

#### Option C: Backend Integration

Add routes to your existing backend:

```javascript
// Express.js example
app.get('/extension-login', (req, res) => {
  res.sendFile(__dirname + '/website/extension-login.html');
});

app.get('/extension-auth-success', (req, res) => {
  res.sendFile(__dirname + '/website/extension-auth-success.html');
});
```

### 2. Configure Clerk Dashboard

1. Go to https://dashboard.clerk.com
2. Select your application
3. Navigate to **Paths** → **Allowed Redirect URLs**
4. Add these URLs:
   ```
   https://www.q-sci.org/extension-auth-success
   https://www.q-sci.org/extension-login
   ```

5. Save changes

### 3. Update Clerk Keys (Production)

For production deployment, update the Clerk publishable key in both HTML files:

**In `extension-login.html`:**
```javascript
// Line ~176
data-clerk-publishable-key="YOUR_PRODUCTION_KEY_HERE"

// Line ~205
const clerk = new Clerk('YOUR_PRODUCTION_KEY_HERE');
```

**In `extension-auth-success.html`:**
```javascript
// Line ~129
data-clerk-publishable-key="YOUR_PRODUCTION_KEY_HERE"

// Line ~158
const clerk = new Clerk('YOUR_PRODUCTION_KEY_HERE');
```

Replace `YOUR_PRODUCTION_KEY_HERE` with your production key from Clerk dashboard (starts with `pk_live_`).

### 4. Test the Deployment

1. **Test the login page:**
   ```bash
   curl -I https://www.q-sci.org/extension-login
   # Should return 200 OK
   ```

2. **Test the success page:**
   ```bash
   curl -I https://www.q-sci.org/extension-auth-success
   # Should return 200 OK
   ```

3. **Test with extension:**
   - Load the extension in Chrome
   - Click the login button
   - Verify new tab opens to your website
   - Complete authentication
   - Verify tab closes and extension shows you as logged in

### 5. Verify Extension Configuration

The extension's `auth.js` should already be configured to use the website URL:

```javascript
// In auth.js, line ~11
const CLERK_AUTH_URL = 'https://www.q-sci.org/extension-login';
```

If you're using a different domain, update this URL.

## Configuration Reference

### Environment Variables (Backend)

If you haven't already, ensure these are set:

```env
OPENAI_API_KEY=sk-proj-your-key-here
CLERK_SECRET_KEY=sk_live_your-key-here
```

### Clerk Configuration

**Required in Clerk Dashboard:**

1. **Publishable Key**: Used in HTML files
   - Development: `pk_test_...`
   - Production: `pk_live_...`

2. **Allowed Redirect URLs**:
   ```
   https://www.q-sci.org/extension-login
   https://www.q-sci.org/extension-auth-success
   ```

3. **Allowed Origins** (if CORS issues occur):
   ```
   https://www.q-sci.org
   chrome-extension://*  (for postMessage)
   ```

## Troubleshooting

### Issue: "Invalid URL scheme" error still appears

**Solution**: 
- Verify both HTML files are deployed and accessible
- Check Clerk dashboard has the HTTPS URLs in allowed redirects
- Ensure no `chrome-extension://` URLs are in Clerk configuration

### Issue: Login page doesn't open

**Solution**:
- Check browser console for errors
- Verify popup blocker isn't blocking the new tab
- Ensure `CLERK_AUTH_URL` in `auth.js` is correct

### Issue: Tab doesn't close after login

**Solution**:
- Check browser console on the success page
- Verify `window.opener` is available
- Ensure popup blocker allows window.close()

### Issue: Extension doesn't receive token

**Solution**:
- Check that `window.opener.postMessage()` is being called
- Verify extension has a message listener (in `auth.js`)
- Check browser console for postMessage errors

## Security Considerations

### Production Recommendations

1. **Use production Clerk keys** (`pk_live_...`)
2. **Enable HTTPS only** - No HTTP in production
3. **Restrict postMessage origins** - Update to specific domains:
   ```javascript
   // Instead of '*', use:
   window.opener.postMessage(data, 'https://www.q-sci.org');
   ```
4. **Set CORS headers** - Restrict API access to your domain
5. **Monitor Clerk logs** - Watch for unusual authentication patterns

### Data Privacy

- Session tokens are transmitted via `postMessage` (browser API)
- Tokens are stored in `chrome.storage.local` (encrypted by Chrome)
- Subscription status fetched from your backend API
- No sensitive data logged to console in production

## Rollback Plan

If issues occur, you can temporarily revert to the old local authentication:

1. In `auth.js`, change:
   ```javascript
   const CLERK_AUTH_URL = chrome.runtime.getURL('clerk-auth.html');
   ```

2. This will use the local popup again (but may show the "Invalid URL scheme" error)

## Next Steps After Deployment

1. ✅ Deploy HTML files to website
2. ✅ Configure Clerk dashboard with redirect URLs
3. ✅ Update production Clerk keys in HTML files
4. ✅ Test authentication flow end-to-end
5. ✅ Monitor for any errors in first 24 hours
6. ✅ Update extension documentation with new flow

## Support Resources

- **Extension Logs**: Press F12 in extension popup
- **Website Logs**: Press F12 on login/success pages
- **Clerk Dashboard**: https://dashboard.clerk.com
- **Clerk Documentation**: https://clerk.com/docs

## Summary

The new authentication flow solves the "Invalid URL scheme" error by:
- Moving authentication to a website (HTTPS URLs)
- Using Clerk's standard redirect flow
- Passing tokens back to extension via postMessage
- Maintaining seamless user experience

No changes needed to the extension code - just deploy the two HTML files to your website! 🚀
