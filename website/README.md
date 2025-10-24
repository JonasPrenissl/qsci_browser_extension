# Q-SCI Browser Extension - Website Authentication Pages

## Overview

This directory contains the website authentication pages required for the Q-SCI browser extension to work with Clerk authentication.

## Why Website Pages?

Clerk authentication requires HTTPS URLs for redirect URLs. Browser extensions use `chrome-extension://` URLs which are not supported by Clerk, causing the error:

```
{"errors":[{"message":"Invalid URL scheme","long_message":"Please provide a URL with one of the following schemes: https, http","code":"invalid_url_scheme","meta":{"param_name":"redirect_url"}}]}
```

## Solution: Web-Based Authentication Proxy

Instead of authenticating directly in the extension popup, we use a web-based authentication flow:

1. **Extension opens website** → `https://www.q-sci.org/extension-login`
2. **User authenticates** → Clerk handles login on the website (HTTPS URLs work!)
3. **Clerk redirects** → `https://www.q-sci.org/extension-auth-success`
4. **Token sent to extension** → Success page sends token via `postMessage`
5. **Extension stores token** → Used for subsequent API calls

## Files

### extension-login.html
- **Purpose**: Clerk login page for extension users
- **URL**: `https://www.q-sci.org/extension-login`
- **Features**:
  - Mounts Clerk sign-in component
  - Redirects to success page after authentication
  - Handles sign-in and sign-up flows

### extension-auth-success.html
- **Purpose**: Authentication success callback page
- **URL**: `https://www.q-sci.org/extension-auth-success`
- **Features**:
  - Receives Clerk session after successful authentication
  - Fetches subscription status from backend API
  - Sends auth token to extension via `postMessage`
  - Auto-closes after successful token transfer

## Deployment

These HTML files must be deployed to your website (e.g., `https://www.q-sci.org/`) and accessible at the following URLs:

- `https://www.q-sci.org/extension-login`
- `https://www.q-sci.org/extension-auth-success`

### Deployment Options

#### Option 1: Static File Hosting (Vercel, Netlify, etc.)
```bash
# Deploy these files to your static hosting
website/
  ├── extension-login.html
  └── extension-auth-success.html
```

Configure your hosting to serve:
- `/extension-login` → `extension-login.html`
- `/extension-auth-success` → `extension-auth-success.html`

#### Option 2: Server-Side Routing
Add routes to your backend server:
```javascript
app.get('/extension-login', (req, res) => {
  res.sendFile('extension-login.html');
});

app.get('/extension-auth-success', (req, res) => {
  res.sendFile('extension-auth-success.html');
});
```

## Clerk Configuration

Ensure these redirect URLs are added to your Clerk dashboard:

1. Go to https://dashboard.clerk.com
2. Select your application
3. Navigate to **Paths** or **Allowed Origins**
4. Add the following URLs:
   - `https://www.q-sci.org/extension-auth-success`
   - `https://www.q-sci.org/extension-login`

## Configuration Variables

Both HTML files contain the Clerk publishable key. Update this in both files:

```javascript
// In both extension-login.html and extension-auth-success.html
const CLERK_PUBLISHABLE_KEY = 'pk_test_b3B0aW1hbC1qZW5uZXQtMzUuY2xlcmsuYWNjb3VudHMuZGV2JA';
```

For production, replace with your production key (`pk_live_...`).

## Testing Locally

1. Deploy the files to your local server or hosting
2. Update the extension's `auth.js` if needed to point to your local URLs
3. Load the extension in Chrome
4. Click the login button
5. Verify that:
   - Login page opens in a new tab
   - Authentication completes successfully
   - Success page auto-closes
   - Extension shows you as logged in

## Security Notes

- The `postMessage` communication uses `'*'` as the target origin for maximum compatibility
- In production, consider restricting this to specific origins for better security
- Session tokens are transmitted via `postMessage` and stored in chrome.storage.local
- Always use HTTPS in production to protect token transmission

## Troubleshooting

### Login page doesn't load
- Verify the HTML files are deployed and accessible at the correct URLs
- Check browser console for errors
- Ensure Clerk publishable key is correct

### Token not received by extension
- Check that the success page can communicate via `postMessage`
- Verify that window.opener is available (popup should open the login page)
- Check browser console on both pages for error messages

### "Invalid URL scheme" error still appears
- Ensure all redirect URLs in Clerk configuration are HTTPS
- Verify that no `chrome-extension://` URLs are being used
- Check that both HTML files use the correct redirect URLs

## Related Files

- `/auth.js` - Extension authentication module (updated to use website URLs)
- `/popup.js` - Extension popup (calls authentication functions)
- `/manifest.json` - Extension manifest (no changes needed)

## Support

For issues or questions, check:
- Extension console logs (F12 in popup)
- Website page console logs (F12 on login/success pages)
- Network tab to see API calls
- Clerk dashboard for authentication logs
