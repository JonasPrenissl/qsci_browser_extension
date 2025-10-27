# Quick Deployment Guide - Clerk Authentication with Browser Extension

## Overview

This guide shows how to deploy the Clerk authentication redirect pages so that the Q-SCI browser extension can authenticate users without encountering the "Invalid URL scheme" error.

## Prerequisites

- ✅ A web server or hosting service (e.g., Vercel, Netlify, your own server)
- ✅ Domain name (e.g., `www.q-sci.org` or `q-sci.org`)
- ✅ Clerk account with publishable key
- ✅ SSL certificate (HTTPS required)

## Step 1: Prepare Files

You need to deploy these two HTML files from the `website/` folder:

1. `website/extension-login.html` → Login page
2. `website/extension-auth-success.html` → Success callback page

## Step 2: Deploy to Web Server

### Option A: Deploy to Vercel (Recommended)

1. Install Vercel CLI (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. Create a `vercel.json` configuration file in your project root:
   ```json
   {
     "rewrites": [
       { "source": "/extension-login", "destination": "/website/extension-login.html" },
       { "source": "/extension-auth-success", "destination": "/website/extension-auth-success.html" }
     ]
   }
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

4. Your pages will be available at:
   - `https://your-domain.vercel.app/extension-login`
   - `https://your-domain.vercel.app/extension-auth-success`

### Option B: Deploy to Netlify

1. Create a `_redirects` file in your project root:
   ```
   /extension-login /website/extension-login.html 200
   /extension-auth-success /website/extension-auth-success.html 200
   ```

2. Deploy via Netlify CLI or drag-and-drop to Netlify dashboard

3. Your pages will be available at:
   - `https://your-site.netlify.app/extension-login`
   - `https://your-site.netlify.app/extension-auth-success`

### Option C: Deploy to Custom Server

1. Upload files to your web server:
   ```bash
   # SSH into your server
   scp website/extension-login.html user@your-server:/var/www/html/extension-login.html
   scp website/extension-auth-success.html user@your-server:/var/www/html/extension-auth-success.html
   ```

2. Configure your web server (Apache/Nginx) to serve these files:

   **Apache (.htaccess):**
   ```apache
   RewriteEngine On
   RewriteRule ^extension-login$ /extension-login.html [L]
   RewriteRule ^extension-auth-success$ /extension-auth-success.html [L]
   ```

   **Nginx:**
   ```nginx
   location /extension-login {
     try_files /extension-login.html =404;
   }
   location /extension-auth-success {
     try_files /extension-auth-success.html =404;
   }
   ```

3. Your pages will be available at:
   - `https://www.q-sci.org/extension-login`
   - `https://www.q-sci.org/extension-auth-success`

## Step 3: Update Clerk Configuration

The HTML files already reference the correct URLs, but verify:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **Paths** or **Settings > Paths**
4. Add these URLs to allowed redirect URLs:
   - `https://www.q-sci.org/extension-auth-success`
   - `https://www.q-sci.org/extension-login`

## Step 4: Update Extension Configuration (if needed)

**Note:** The default configuration uses `https://www.q-sci.org/extension-login`.

If you're using a **different domain**, you'll need to update the authentication URL:

1. Open `src/auth.js` (this is the correct file - **not** the `auth.js` in the root directory which uses the old approach)

2. Find and update the `CLERK_AUTH_URL` constant:
   ```javascript
   // Change this line if using a different domain
   const CLERK_AUTH_URL = 'https://YOUR-DOMAIN.com/extension-login';
   ```

3. Rebuild the extension:
   ```bash
   npm run build
   ```

**For production deployment on www.q-sci.org:** No changes needed! The extension is already configured for this domain.

## Step 5: Update Clerk Keys for Production

**Important:** Replace test keys with production keys!

1. Get your production Clerk key from [Clerk Dashboard](https://dashboard.clerk.com) → API Keys
   - Should start with `pk_live_...` (not `pk_test_...`)

2. Update the publishable key in these files:
   - `website/extension-login.html` - Look for the Clerk SDK script tag and the Clerk initialization
   - `website/extension-auth-success.html` - Look for the Clerk SDK script tag and the Clerk initialization
   - `clerk-config.js` - Update the publishableKey property

   Search for `pk_test_` and replace all occurrences with your production key `pk_live_...`

3. Rebuild the extension:
   ```bash
   npm run build
   ```

4. Reload the extension in Chrome

## Step 6: Test the Flow

1. **Load extension** in Chrome (`chrome://extensions/`)
2. **Click extension icon**
3. **Click "Login with Clerk"**
4. **Verify**:
   - ✅ New window opens with your login page
   - ✅ Clerk login form appears
   - ✅ Can sign in or sign up
   - ✅ After auth, redirects to success page
   - ✅ Success page shows "Authentication successful!"
   - ✅ Window closes automatically (or shows close button)
   - ✅ Extension shows you as logged in
   - ✅ Email and subscription status displayed

## Verification Checklist

Before going live, verify:

- [ ] Both HTML files deployed and accessible via HTTPS
- [ ] URLs match what's configured in `src/auth.js`
- [ ] Clerk dashboard has redirect URLs configured
- [ ] Production Clerk keys used (not test keys)
- [ ] SSL certificate valid (HTTPS working)
- [ ] Test authentication flow works end-to-end
- [ ] Extension stores token and shows user as logged in
- [ ] No console errors in extension or web pages

## Quick Test Commands

```bash
# Verify configuration
npm run verify

# Test locally first (optional)
npm run test-server
# Then visit http://localhost:3000/extension-login

# Build extension
npm run build
```

## Troubleshooting

### Pages return 404
- Check that files are uploaded to the correct path
- Verify web server configuration (rewrites/redirects)
- Check domain DNS settings

### "Invalid URL scheme" error still appears
- Verify URLs in Clerk dashboard are HTTPS (not chrome-extension://)
- Check that `src/auth.js` uses web URL (not extension URL)
- Ensure extension has been rebuilt after changes

### Token not received by extension
- Check browser console on both pages (F12)
- Verify `window.opener` is available (page opened via `window.open()`)
- Check that message type is exactly `'CLERK_AUTH_SUCCESS'`
- Ensure pop-ups are not blocked

### Authentication works but subscription status is wrong
- Check that backend API is running at `https://www.q-sci.org/api`
- Verify API endpoint `/auth/subscription-status` exists
- Check Clerk user metadata includes subscription info
- Review backend logs for errors

## Production Deployment Checklist

For a production-ready deployment:

- [ ] Deploy HTML files to production domain with HTTPS
- [ ] Configure Clerk with production keys (`pk_live_...`)
- [ ] Add redirect URLs to Clerk dashboard
- [ ] Update extension configuration if using custom domain
- [ ] Rebuild extension with production settings
- [ ] Test authentication flow thoroughly
- [ ] Monitor Clerk dashboard for authentication logs
- [ ] Set up backend API for subscription status
- [ ] Test with real users before public release

## Support

If you encounter issues:
- See [TESTING_AUTH_REDIRECT.md](TESTING_AUTH_REDIRECT.md) for detailed testing
- Check [AUTH_REDIRECT_SOLUTION.md](AUTH_REDIRECT_SOLUTION.md) for architecture
- Review browser console logs (F12)
- Check Clerk dashboard logs

## Summary

```
┌──────────────────────────────────────────────────────────────┐
│  DEPLOYMENT SUMMARY                                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Deploy HTML files to web server with HTTPS              │
│     ├─ extension-login.html → /extension-login              │
│     └─ extension-auth-success.html → /extension-auth-success│
│                                                              │
│  2. Configure Clerk dashboard                               │
│     └─ Add redirect URLs                                    │
│                                                              │
│  3. Update production keys                                  │
│     ├─ HTML files (both pages)                              │
│     └─ clerk-config.js                                       │
│                                                              │
│  4. Rebuild and test                                        │
│     ├─ npm run build                                        │
│     └─ Test authentication flow                             │
│                                                              │
│  ✅ Result: Seamless authentication without URL errors!     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```
