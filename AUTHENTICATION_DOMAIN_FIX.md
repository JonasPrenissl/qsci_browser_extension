# Authentication Domain Fix

## Problem
The authentication popup window was showing the error:
```
Fehler beim Initialisieren der Authentifizierung. Bitte versuchen Sie es erneut.
(ClerkJS: Missing domain and proxyUrl. A satellite application needs to specify a domain or a proxyUrl.)
```

## Root Cause
When using ClerkJS in satellite mode (`isSatellite: true`), Clerk requires either a `domain` or `proxyUrl` parameter to be specified. The satellite mode is necessary for browser extensions to prevent chrome-extension:// URL issues in OAuth flows.

## Solution
Added the `domain` parameter to the Clerk initialization configuration in `src/auth.js`:

```javascript
await clerk.load({
  isSatellite: true,
  domain: 'www.q-sci.org',  // <- Added this line
  signInUrl: AUTH_CALLBACK_URL,
  // ... other configuration
});
```

## Technical Details

### Why Satellite Mode?
- Browser extensions use `chrome-extension://` URLs
- OAuth providers (Google, Apple, etc.) require HTTPS redirect URLs
- Satellite mode tells Clerk to use the specified domain for OAuth callbacks instead of `window.location.href`

### Why Domain Parameter?
- When `isSatellite: true` is set, Clerk needs to know which domain the satellite is associated with
- The domain parameter tells Clerk where the main application is hosted
- This enables proper OAuth flow completion

### Files Modified
1. `src/auth.js` - Added domain parameter to clerk.load()
2. `src/clerk-auth-main.js` - Added domain parameter for consistency
3. `dist/js/bundle-auth.js` - Rebuilt bundle with the fix

## Verification
After this fix:
1. The authentication popup window should initialize without errors
2. Users can authenticate using Clerk's sign-in component
3. OAuth flows (Google, Apple, etc.) work correctly

## References
- Clerk Satellite Mode Documentation: https://clerk.com/docs/deployments/satellite-domains
- Issue: "ClerkJS: Missing domain and proxyUrl" error in popup window
