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
Added both the `domain` and `proxyUrl` parameters to the Clerk initialization configuration in `src/auth.js`:

```javascript
await clerk.load({
  isSatellite: true,
  domain: 'www.q-sci.org',          // <- Domain without protocol
  proxyUrl: 'https://www.q-sci.org', // <- Full URL with HTTPS protocol
  signInUrl: AUTH_CALLBACK_URL,
  // ... other configuration
});
```

**Note:** While the initial fix only added `domain`, testing revealed that Clerk requires **both** `domain` and `proxyUrl` when using satellite mode. The `domain` should be the domain name without protocol, while `proxyUrl` should be the full URL with HTTPS.

## Technical Details

### Why Satellite Mode?
- Browser extensions use `chrome-extension://` URLs
- OAuth providers (Google, Apple, etc.) require HTTPS redirect URLs
- Satellite mode tells Clerk to use the specified domain for OAuth callbacks instead of `window.location.href`

### Why Domain and ProxyUrl Parameters?
- When `isSatellite: true` is set, Clerk requires **both** `domain` and `proxyUrl` to be specified
- The `domain` parameter (without protocol) tells Clerk which domain the satellite is associated with
- The `proxyUrl` parameter (with HTTPS protocol) specifies the full URL for OAuth redirect handling
- Both parameters are necessary for proper OAuth flow completion and to prevent the "Missing domain and proxyUrl" error

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
