# Testing Clerk Authentication Redirect Flow

## Problem Statement

Clerk authentication requires HTTP/HTTPS redirect URLs, but browser extensions use `chrome-extension://` URLs which are not supported. This causes the error:

```
{"errors":[{"message":"Invalid URL scheme",...}]}
```

## Solution

The extension uses an **intermediate HTTP/HTTPS redirect page** to bridge the gap between Clerk and the extension:

1. **Extension** → Opens `https://www.q-sci.org/extension-login` (web page)
2. **User** → Authenticates with Clerk on the web page
3. **Clerk** → Redirects to `https://www.q-sci.org/extension-auth-success` (web page)
4. **Success Page** → Sends auth token back to extension via `window.opener.postMessage()`
5. **Extension** → Stores token and shows user as logged in

## Files Involved

### Extension Files
- `auth.js` - Contains the authentication logic and `window.open()` call
- `popup.js` - Calls `AuthService.login()` when user clicks login button

### Website Files (in `website/` folder)
- `extension-login.html` - Clerk login page
- `extension-auth-success.html` - Success callback page that sends token to extension

## Testing Options

### Option 1: Test with Production URLs (Recommended)

The extension is already configured to use production URLs:
```javascript
const CLERK_AUTH_URL = 'https://www.q-sci.org/extension-login';
```

**Prerequisites:**
1. Deploy `website/extension-login.html` to `https://www.q-sci.org/extension-login`
2. Deploy `website/extension-auth-success.html` to `https://www.q-sci.org/extension-auth-success`

**Testing Steps:**
1. Load the extension in Chrome (`chrome://extensions/`)
2. Click the extension icon
3. Click "Login with Clerk"
4. A new window should open with the login page
5. Complete authentication
6. The success page should automatically send the token to the extension
7. The window should close automatically
8. The extension should show you as logged in

### Option 2: Test with Local Server (For Development)

If you want to test locally before deploying:

**Step 1: Start the test server**
```bash
node test-server.js
```

This will start a server at `http://localhost:3000/` serving:
- `http://localhost:3000/extension-login`
- `http://localhost:3000/extension-auth-success`

**Step 2: Update the extension for local testing**

Edit `src/auth.js` and change:
```javascript
const CLERK_AUTH_URL = 'http://localhost:3000/extension-login';
```

**Step 3: Rebuild the extension**
```bash
npm run build
```

**Step 4: Reload the extension**
- Go to `chrome://extensions/`
- Click the reload icon on the Q-SCI extension

**Step 5: Test the flow**
1. Click the extension icon
2. Click "Login with Clerk"
3. The login page should open at `http://localhost:3000/extension-login`
4. Complete authentication
5. Verify the token is sent back to the extension

**Step 6: Restore production configuration**

After testing, restore the production URL in `src/auth.js`:
```javascript
const CLERK_AUTH_URL = 'https://www.q-sci.org/extension-login';
```

And rebuild:
```bash
npm run build
```

## Verification Checklist

After testing, verify:

- [ ] Login page opens in a new window (not a tab)
- [ ] Clerk login form is displayed correctly
- [ ] After authentication, success page loads
- [ ] Success page shows "Authentication successful!" message
- [ ] Success page automatically closes (or shows "Close Window" button)
- [ ] Extension popup shows user as logged in
- [ ] User email is displayed in the popup
- [ ] Subscription status is shown correctly
- [ ] Usage counter is displayed

## Common Issues

### Issue 1: "Invalid URL scheme" error still appears

**Cause:** Clerk is still trying to use a `chrome-extension://` URL

**Solution:** 
- Verify that all redirect URLs in Clerk dashboard are HTTP/HTTPS
- Check that `auth.js` uses the correct web URL, not a chrome-extension:// URL
- Ensure Clerk configuration in both HTML files matches your Clerk dashboard

### Issue 2: Login page doesn't open

**Cause:** Pop-up blocker or URL not accessible

**Solution:**
- Allow pop-ups for the extension
- Verify the URL in `auth.js` is correct and accessible
- Check browser console for errors (F12 in popup)

### Issue 3: Token not received by extension

**Cause:** `postMessage` communication failed

**Solution:**
- Verify that the login page is opened via `window.open()` (creates `window.opener` reference)
- Check that the success page has access to `window.opener`
- Look for `postMessage` errors in both page consoles
- Ensure the message type is exactly `'CLERK_AUTH_SUCCESS'`

### Issue 4: Window doesn't close automatically

**Cause:** `window.close()` may be blocked in some browsers

**Solution:**
- This is normal behavior in some browsers for security
- A "Close Window" button should appear automatically
- The token should still be sent correctly even if the window doesn't close

## Debugging

### Extension Console
Open the extension popup and press F12 to see console logs:
```
Q-SCI Auth: Opening Clerk authentication pop-up...
Q-SCI Auth: Received authentication success from Clerk
Q-SCI Auth: Auth data received: {hasToken: true, hasEmail: true, ...}
Q-SCI Auth: Storing received auth data...
Q-SCI Auth: Auth data stored successfully
```

### Login Page Console
Open the login page and press F12:
```
Q-SCI Extension Login: Page loaded
Q-SCI Extension Login: Waiting for Clerk SDK...
Q-SCI Extension Login: Clerk SDK loaded
Q-SCI Extension Login: Initializing Clerk...
Q-SCI Extension Login: Mounting sign-in component...
```

### Success Page Console
Open the success page and press F12:
```
Q-SCI Auth Success: Page loaded
Q-SCI Auth Success: Waiting for Clerk SDK...
Q-SCI Auth Success: User authenticated: user_xxxxx
Q-SCI Auth Success: Sending auth data to extension via postMessage
```

## Production Deployment

For production deployment:

1. **Deploy the HTML files** to your web server
   - Upload `website/extension-login.html` → `https://www.q-sci.org/extension-login`
   - Upload `website/extension-auth-success.html` → `https://www.q-sci.org/extension-auth-success`

2. **Configure Clerk Dashboard**
   - Go to https://dashboard.clerk.com
   - Add redirect URLs:
     - `https://www.q-sci.org/extension-auth-success`
     - `https://www.q-sci.org/extension-login`

3. **Update Clerk keys**
   - Replace test keys (`pk_test_...`) with production keys (`pk_live_...`)
   - Update in both HTML files and `clerk-config.js`
   - Rebuild: `npm run build`

4. **Test the production flow**
   - Load the extension
   - Test login flow
   - Verify everything works as expected

## Architecture Diagram

```
┌─────────────────┐
│   Extension     │
│    Popup        │
│                 │
│  [Login Btn] ──────┐
└─────────────────┘  │
                     │ window.open()
                     ▼
            ┌────────────────────────┐
            │  extension-login.html  │
            │  (HTTPS Web Page)      │
            │                        │
            │  [Clerk Login Form]    │
            └────────────────────────┘
                     │
                     │ User authenticates
                     ▼
            ┌────────────────────────────┐
            │ extension-auth-success.html│
            │  (HTTPS Web Page)          │
            │                            │
            │  1. Get session token      │
            │  2. Fetch subscription     │
            │  3. postMessage to opener  │
            └────────────────────────────┘
                     │
                     │ window.opener.postMessage()
                     ▼
            ┌─────────────────┐
            │   Extension     │
            │    Popup        │
            │                 │
            │  Stores token   │
            │  Shows user     │
            └─────────────────┘
```

## Security Notes

- All communication happens over HTTPS (in production)
- Session tokens are transmitted via `postMessage`
- Tokens are stored in `chrome.storage.local` (encrypted by Chrome)
- No passwords are ever stored
- All authentication is handled by Clerk

## Support

If you encounter issues:
1. Check the debugging section above
2. Review browser console logs
3. Verify all URLs are accessible
4. Ensure Clerk configuration is correct
5. Check that pop-ups are allowed

## Related Documentation

- [AUTHENTICATION.md](AUTHENTICATION.md) - Full authentication system details
- [CLERK_SETUP.md](CLERK_SETUP.md) - Clerk configuration guide
- [website/README.md](website/README.md) - Website pages documentation
