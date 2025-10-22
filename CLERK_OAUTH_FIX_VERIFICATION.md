# Clerk OAuth Redirect URL Fix - Verification Guide

## Issue Fixed
After successful authentication with Clerk (especially when using OAuth providers like Google, Apple, etc.), an error was appearing in the popup window:

```json
{
  "errors": [
    {
      "message": "Invalid URL scheme",
      "long_message": "Please provide a URL with one of the following schemes: https, http",
      "code": "invalid_url_scheme",
      "meta": {
        "param_name": "redirect_url"
      }
    }
  ],
  "clerk_trace_id": "..."
}
```

## Root Cause
During OAuth authentication flows:
1. User clicks "Sign in with Google" (or other OAuth provider)
2. Clerk redirects to the OAuth provider
3. OAuth provider redirects back to Clerk's callback URL
4. Clerk needs to redirect back to the application with the authentication result

The problem was that Clerk was detecting the browser extension's `chrome-extension://` URL scheme and trying to use it as a redirect URL, which OAuth providers and Clerk's API reject (they only accept `https://` or `http://` URLs).

## Solution Implemented

### 1. Added `isSatellite: true` Configuration
```javascript
await clerk.load({
  isSatellite: true,  // Tells Clerk this is a satellite/popup window
  // ... other redirect URLs
});
```

The `isSatellite` option explicitly tells Clerk that this authentication window is a "satellite" (popup/child window) of the main application. This prevents Clerk from using `window.location.href` (which would be `chrome-extension://...`) as a redirect URL.

### 2. Comprehensive Redirect URL Configuration
Added all possible redirect URL parameters to both `clerk.load()` and `clerk.mountSignIn()`:
- `redirectUrl`
- `afterSignInUrl`
- `afterSignUpUrl`
- `signInForceRedirectUrl`
- `signUpForceRedirectUrl`
- `signInFallbackRedirectUrl`
- `signUpFallbackRedirectUrl`

All are set to: `https://www.q-sci.org/auth-callback`

### 3. Additional Configuration
- `routing: 'hash'` - Use hash-based routing instead of path-based
- `transferable: false` - Indicate this is a non-transferable popup context

## Files Modified
1. `src/auth.js` - ES6 module version used by the build process
2. `src/clerk-auth-main.js` - Standalone version (kept in sync)
3. `dist/js/bundle-auth.js` - Generated bundle (updated by build)

## How to Verify the Fix

### 1. Build the Extension
```bash
npm install
npm run build
```

### 2. Run Tests
```bash
node test-clerk-config.js
```
All tests should pass.

### 3. Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the extension directory
5. The extension should load without errors

### 4. Test Authentication Flow
1. Click the Q-SCI extension icon
2. Click "Login with Clerk"
3. **Try OAuth authentication** (e.g., "Sign in with Google")
4. Complete the OAuth flow
5. **Verify**: After successful authentication:
   - ✅ No error message should appear in the popup
   - ✅ User should be logged in
   - ✅ Email should be displayed
   - ✅ Popup should close automatically after 1.5 seconds

### 5. Test Regular Email/Password Authentication
1. If not logged in, click "Login with Clerk"
2. Use email/password authentication
3. **Verify**: Works without errors

### 6. Reopen Extension
1. Close and reopen the popup
2. **Verify**: User remains logged in (as mentioned in the issue)

## Why This Fix Works

### Before the Fix
```
User → OAuth Provider → Clerk Callback → ❌ chrome-extension://... (INVALID)
                                          ↓
                                      Error: "Invalid URL scheme"
```

### After the Fix
```
User → OAuth Provider → Clerk Callback → ✅ https://www.q-sci.org/auth-callback (VALID)
                                          ↓
                                      Success! (uses postMessage to send auth data)
```

The authentication window uses `postMessage` to communicate with the extension popup, so the redirect URL is never actually followed—it only needs to pass Clerk's validation during the OAuth flow.

## Technical Details

### Why `isSatellite: true` is Critical
Without this option, Clerk's SDK calls `window.location.href` internally during OAuth flows to determine the redirect URL. In a browser extension, this returns `chrome-extension://abcd1234.../clerk-auth.html`, which:
1. Is not a valid HTTPS/HTTP URL
2. Causes Clerk's API to reject the request with "Invalid URL scheme"

With `isSatellite: true`, Clerk knows this is a popup window and uses the explicitly configured redirect URLs instead.

### OAuth Flow Complexity
OAuth providers (Google, Apple, etc.) require HTTPS callback URLs. The flow is:
1. Extension opens `clerk-auth.html` in popup
2. User clicks "Sign in with Google"
3. Clerk redirects to `accounts.google.com`
4. Google authenticates user
5. Google redirects to Clerk's OAuth callback: `clerk.shared.lcl.dev/v1/oauth_callback`
6. Clerk's callback needs a valid HTTPS URL to redirect to
7. **Without fix**: Tries to use `chrome-extension://...` → ❌ Error
8. **With fix**: Uses `https://www.q-sci.org/auth-callback` → ✅ Success

## Backward Compatibility
This fix does not affect:
- Existing logged-in users (they remain logged in)
- Email/password authentication flows
- The postMessage-based communication between popup and extension
- Any other extension functionality

## Additional Notes
- The `https://www.q-sci.org/auth-callback` URL doesn't need to exist as an actual page
- Authentication data is passed via `postMessage`, not via the redirect
- The redirect URL only needs to be valid for Clerk's API validation
- Both test (`pk_test_...`) and production (`pk_live_...`) Clerk keys work with this fix

## If Issues Persist
If the error still appears:
1. Clear browser cache and extension storage
2. Rebuild the extension: `npm run build`
3. Remove and reload the extension in Chrome
4. Check browser console for any new errors
5. Verify all redirect URLs in Clerk Dashboard match the configured URL
