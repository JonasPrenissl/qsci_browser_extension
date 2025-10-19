# OAuth Redirect URL Fix Summary

## Problem
Users were experiencing an "Invalid URL scheme" error when authenticating with OAuth providers (Google, Apple, etc.) through Clerk. The error appeared on the OAuth callback page:

```
URL: clerk.shared.lcl.dev/v1/oauth_callback?code=c580etc
Error: {"errors":[{"message":"Invalid URL scheme","long_message":"Please provide a URL with one of the following schemes: https, http","code":"invalid_url_scheme","meta":{"param_name":"redirect_url"}}]}
```

## Root Cause
After a user authenticates with an OAuth provider (e.g., Google), the provider redirects to Clerk's OAuth callback endpoint. Clerk then needs to redirect back to the application. In a browser extension context:

1. The default redirect URL would be based on `window.location.href` 
2. In a browser extension, this returns a `chrome-extension://...` URL
3. OAuth providers and Clerk require valid HTTPS/HTTP URLs
4. The `chrome-extension://` URL fails validation, causing the error

While some redirect URLs were being set, they were not comprehensive enough to cover all OAuth flow scenarios, especially the specific redirect parameters used during the OAuth callback phase.

## Solution
Set **all available redirect URL parameters** in both `clerk.load()` and `mountSignIn()` to ensure every OAuth flow scenario has a valid HTTPS redirect URL:

### Changes to `clerk.load()`
```javascript
await clerk.load({
  signInFallbackRedirectUrl: AUTH_CALLBACK_URL,    // ✓ Already existed
  signUpFallbackRedirectUrl: AUTH_CALLBACK_URL,    // ✓ Already existed
  signInForceRedirectUrl: AUTH_CALLBACK_URL,       // ✓ Already existed
  signUpForceRedirectUrl: AUTH_CALLBACK_URL,       // ✓ Already existed
  redirectUrl: AUTH_CALLBACK_URL                   // ✨ NEW - Added for OAuth
});
```

### Changes to `mountSignIn()`
```javascript
clerk.mountSignIn(clerkContainer, {
  redirectUrl: AUTH_CALLBACK_URL,                  // ✓ Already existed
  afterSignInUrl: AUTH_CALLBACK_URL,               // ✓ Already existed
  afterSignUpUrl: AUTH_CALLBACK_URL,               // ✓ Already existed
  signInForceRedirectUrl: AUTH_CALLBACK_URL,       // ✨ NEW - For OAuth sign-in
  signUpForceRedirectUrl: AUTH_CALLBACK_URL,       // ✨ NEW - For OAuth sign-up
  signInFallbackRedirectUrl: AUTH_CALLBACK_URL,    // ✨ NEW - Fallback for sign-in
  signUpFallbackRedirectUrl: AUTH_CALLBACK_URL,    // ✨ NEW - Fallback for sign-up
  appearance: { ... }
});
```

Where: `AUTH_CALLBACK_URL = 'https://www.q-sci.org/auth-callback'`

## Why This Works

### Comprehensive Coverage
By setting all redirect URL parameters, we ensure that regardless of which authentication flow path the user takes (email/password, Google OAuth, Apple OAuth, sign-in vs sign-up), Clerk always has a valid HTTPS redirect URL to use.

### OAuth Flow with Fix
```
1. User clicks "Sign in with Google"
2. Redirects to Google OAuth
3. User authenticates with Google  
4. Google redirects to: clerk.shared.lcl.dev/v1/oauth_callback?code=...
5. Clerk looks for redirect_url parameters:
   - Checks: signInForceRedirectUrl ✓ (now set to https://www.q-sci.org/auth-callback)
   - Finds valid HTTPS URL
   - Successfully redirects ✅
6. Extension detects authentication via session polling
7. User is logged in successfully
```

### Previous OAuth Flow (Before Fix)
```
1. User clicks "Sign in with Google"
2. Redirects to Google OAuth
3. User authenticates with Google
4. Google redirects to: clerk.shared.lcl.dev/v1/oauth_callback?code=...
5. Clerk looks for redirect_url parameters:
   - Checks: signInForceRedirectUrl (not set)
   - Checks: afterSignInUrl (was set, but may not be used in OAuth callback)
   - Falls back to default: chrome-extension://... ❌
   - Validation fails: "Invalid URL scheme" error
```

## Technical Details

### Why Multiple Redirect URLs?
Clerk uses different redirect URL parameters for different stages of authentication:

Parameter | When Used | Priority
----------|-----------|----------
`signInForceRedirectUrl` | OAuth callback for sign-in | Highest (overrides all)
`signUpForceRedirectUrl` | OAuth callback for sign-up | Highest (overrides all)
`afterSignInUrl` | After sign-in completes | Medium
`afterSignUpUrl` | After sign-up completes | Medium
`redirectUrl` | General redirect | Medium
`signInFallbackRedirectUrl` | When no sign-in redirect set | Lowest (fallback)
`signUpFallbackRedirectUrl` | When no sign-up redirect set | Lowest (fallback)

The "Force" variants are particularly important for OAuth flows because they take precedence during the OAuth callback phase.

### Why the Redirect URL Doesn't Actually Need to Exist
The extension doesn't actually navigate to `https://www.q-sci.org/auth-callback`. Instead:

1. The URL is used only for OAuth provider validation
2. After OAuth callback, the Clerk authentication window is still open
3. The extension uses **session polling** to detect when authentication completes
4. Once detected, it extracts user data and communicates via `postMessage` or `chrome.storage`
5. The auth window closes automatically

The HTTPS URL just needs to be valid and approved in Clerk's configuration - it doesn't need to serve any actual content.

## Files Modified

### Source Files
- `src/auth.js` - Main authentication module (gets bundled)
- `src/clerk-auth-main.js` - Standalone authentication script (for consistency)

### Generated Files
- `dist/js/bundle-auth.js` - Bundled authentication code (auto-generated)
- `dist/js/bundle-auth.js.map` - Source map for debugging

### Documentation
- `OAUTH_FIX_VERIFICATION.md` - Verification guide for testing
- `FIX_SUMMARY_OAUTH_REDIRECT.md` - This document

## Build Process
```bash
npm run build
```

This command runs `node build.js`, which uses esbuild to bundle `src/auth.js` into `dist/js/bundle-auth.js`.

## Testing
See `OAUTH_FIX_VERIFICATION.md` for detailed testing instructions.

### Quick Test
1. Load extension in Chrome
2. Click extension icon → "Login with Clerk"
3. Click "Sign in with Google" (or other OAuth provider)
4. Complete authentication
5. Verify:
   - ✅ No "Invalid URL scheme" error
   - ✅ Window closes automatically
   - ✅ User is logged in successfully

## Expected Impact
- ✅ Fixes OAuth authentication with Google
- ✅ Fixes OAuth authentication with Apple
- ✅ Fixes OAuth authentication with any other configured provider
- ✅ Maintains compatibility with email/password authentication
- ✅ No breaking changes to existing authentication flows

## Related Issues
- Original issue: "Invalid URL scheme" error on OAuth callback page
- Previous attempts: See `AUTHENTICATION_FIXES.md` and `CLERK_AUTH_FIXES_SUMMARY.md`
- This fix extends the previous work by adding comprehensive OAuth redirect URL coverage

## Clerk Configuration Requirements
Ensure in your Clerk Dashboard:
1. **Allowed redirect URLs** includes: `https://www.q-sci.org/auth-callback`
2. OAuth providers (Google, Apple, etc.) are properly configured
3. Browser extension permissions include `https://www.q-sci.org/*`

## Browser Extension Manifest
The `manifest.json` already includes necessary permissions:
```json
{
  "host_permissions": [
    "https://q-sci.org/*",
    "https://www.q-sci.org/*",
    "https://optimal-jennet-35.clerk.accounts.dev/*",
    "https://*.clerk.accounts.dev/*"
  ]
}
```

## Debugging Tips
If the error still occurs:

1. **Check Console Logs**
   ```javascript
   // Look for these messages:
   "Q-SCI Clerk Auth: Mounting sign-in component..."
   "Q-SCI Clerk Auth: Session detected, user signed in"
   ```

2. **Verify Redirect URLs in Network Tab**
   - Open Developer Tools → Network
   - Filter for "oauth_callback"
   - Check redirect_url parameter in requests

3. **Check Clerk Dashboard**
   - Verify allowed redirect URLs include `https://www.q-sci.org/auth-callback`
   - Check if OAuth providers are active

4. **Inspect Bundle**
   ```bash
   grep -n "signInForceRedirectUrl" dist/js/bundle-auth.js
   # Should show the redirect URL is set to AUTH_CALLBACK_URL
   ```

## Next Steps
1. Test the fix with various OAuth providers (Google, Apple, etc.)
2. Monitor for any remaining authentication issues
3. Update Clerk dashboard if redirect URL is not already allowed
4. Consider adding automated tests for OAuth flows

## References
- [Clerk Redirect URLs Documentation](https://clerk.com/docs/authentication/configuration/redirect-urls)
- [OAuth 2.0 Redirect URIs](https://tools.ietf.org/html/rfc6749#section-3.1.2)
- [Chrome Extension Identity API](https://developer.chrome.com/docs/extensions/reference/identity/)
