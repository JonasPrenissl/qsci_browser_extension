# Clerk Satellite Mode Configuration Fix

## Issue
The authentication popup window was displaying the following error:
```
Fehler beim Initialisieren der Authentifizierung. Bitte versuchen Sie es erneut.
(ClerkJS: Missing domain and proxyUrl. A satellite application needs to specify a domain or a proxyUrl.)
```

## Root Cause
Clerk's satellite mode requires **both** `domain` and `proxyUrl` parameters to be specified when using `isSatellite: true`. The previous configuration only included the `domain` parameter, which was insufficient.

## Solution
Added the `proxyUrl` parameter alongside the existing `domain` parameter in the Clerk initialization:

### Before
```javascript
await clerk.load({
  isSatellite: true,
  domain: 'www.q-sci.org',
  signInUrl: AUTH_CALLBACK_URL,
  // ... other configuration
});
```

### After
```javascript
await clerk.load({
  isSatellite: true,
  domain: 'www.q-sci.org',           // Domain without protocol
  proxyUrl: 'https://www.q-sci.org', // Full URL with HTTPS
  signInUrl: AUTH_CALLBACK_URL,
  // ... other configuration
});
```

## Files Modified
1. **src/auth.js** - Main authentication module (bundled to dist/js/bundle-auth.js)
2. **src/clerk-auth-main.js** - Standalone Clerk authentication script
3. **dist/js/bundle-auth.js** - Rebuilt bundle containing the fix
4. **AUTHENTICATION_DOMAIN_FIX.md** - Updated documentation

## Technical Details

### Why Both Parameters Are Required
- **domain** (string without protocol): Tells Clerk which domain the satellite application is associated with
- **proxyUrl** (string with HTTPS): Specifies the full URL used for OAuth redirect handling
- Both are required by Clerk when `isSatellite: true` is set

### Satellite Mode Purpose
- Browser extensions use `chrome-extension://` URLs
- OAuth providers require HTTPS redirect URLs
- Satellite mode tells Clerk to use the specified domain instead of `window.location.href`
- This enables proper OAuth flow completion

## Testing
1. Run configuration test:
   ```bash
   node test-clerk-config.js
   ```
   ✅ All tests passed

2. Build verification:
   ```bash
   npm run build
   ```
   ✅ Bundle contains both domain and proxyUrl

3. Manual testing:
   - Load extension in Chrome
   - Click extension icon to open popup
   - Click "Login with Clerk" button
   - Authentication window should open without errors

## Verification Checklist
- [x] Both domain and proxyUrl parameters added
- [x] Configuration consistent across all Clerk initialization points
- [x] Bundle rebuilt with changes
- [x] Configuration test passes
- [x] Documentation updated

## References
- [Clerk Satellite Domains Documentation](https://clerk.com/docs/deployments/satellite-domains)
- [Clerk JavaScript SDK](https://clerk.com/docs/references/javascript/overview)

## Security Summary
No security vulnerabilities introduced:
- Configuration parameters are hardcoded constants
- HTTPS protocol enforced in proxyUrl
- No dynamic code execution
- No user input handling in modified code
