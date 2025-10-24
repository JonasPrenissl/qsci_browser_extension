# Clerk Satellite Mode Configuration Fix

## Issue
The authentication popup window was displaying the following error:
```
Fehler beim Initialisieren der Authentifizierung. Bitte versuchen Sie es erneut.
(ClerkJS: Missing domain and proxyUrl. A satellite application needs to specify a domain or a proxyUrl.)
```

## Root Cause
The Q-SCI Browser Extension was **incorrectly configured as a Satellite App** when it should be configured as a **Main App**. 

### What is a Satellite App?
In Clerk's architecture:
- **Main App**: The primary standalone application where authentication is managed
- **Satellite App**: A subdomain or separate deployment that shares authentication with a main app (e.g., `app.example.com` sharing auth with `example.com`)

When `isSatellite: true` is set, Clerk **requires** both `domain` and `proxyUrl` to know how to communicate with the main authentication domain. However, this browser extension is **not a satellite app** - it's a standalone application.

## Solution
**REMOVED** the satellite configuration entirely, as this extension is a standalone main app, not a satellite.

### Before (Incorrect - Satellite Configuration)
```javascript
await clerk.load({
  isSatellite: true,                    // ❌ REMOVED - Not a satellite app
  domain: 'www.q-sci.org',              // ❌ REMOVED - Only for satellites
  proxyUrl: 'https://www.q-sci.org',    // ❌ REMOVED - Only for satellites
  signInUrl: AUTH_CALLBACK_URL,         // ❌ REMOVED - Only for satellites
  signUpUrl: AUTH_CALLBACK_URL,         // ❌ REMOVED - Only for satellites
  signInFallbackRedirectUrl: AUTH_CALLBACK_URL,
  signUpFallbackRedirectUrl: AUTH_CALLBACK_URL,
  // ... other configuration
});
```

### After (Correct - Main App Configuration)
```javascript
await clerk.load({
  // IMPORTANT: This is a main app configuration, NOT a satellite app.
  // We do NOT set isSatellite, domain, or proxyUrl as this extension is standalone.
  signInFallbackRedirectUrl: AUTH_CALLBACK_URL,
  signUpFallbackRedirectUrl: AUTH_CALLBACK_URL,
  signInForceRedirectUrl: AUTH_CALLBACK_URL,
  signUpForceRedirectUrl: AUTH_CALLBACK_URL,
  afterSignInUrl: AUTH_CALLBACK_URL,
  afterSignUpUrl: AUTH_CALLBACK_URL,
  redirectUrl: AUTH_CALLBACK_URL
});
```

## Files Modified
1. **src/auth.js** - Main authentication module (bundled to dist/js/bundle-auth.js)
2. **src/clerk-auth-main.js** - Standalone Clerk authentication script
3. **dist/js/bundle-auth.js** - Rebuilt bundle containing the fix

## Technical Details

### What We Kept
- All redirect URL configurations for OAuth compatibility (Google, Apple, etc.)
- PostMessage-based authentication flow for extension-to-popup communication
- Valid HTTPS callback URLs to satisfy OAuth provider requirements

### What We Removed
- `isSatellite: true` - Not needed for standalone apps
- `domain: 'www.q-sci.org'` - Only needed for satellite apps
- `proxyUrl: 'https://www.q-sci.org'` - Only needed for satellite apps
- `signInUrl` and `signUpUrl` - Only needed when using satellite configuration

### Why This Fix Works
- Browser extensions are **standalone applications**, not satellites
- Clerk doesn't need to know about a "main domain" because this IS the main app
- OAuth redirect URLs are still properly configured via the redirect parameters
- The extension handles authentication in its own context without requiring a parent domain

## Testing
After making this fix, the authentication flow should work properly:

1. **Build the extension**:
   ```bash
   npm run build
   ```
   ✅ Bundle should build successfully

2. **Load the extension in Chrome**:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension directory

3. **Test authentication**:
   - Click the extension icon to open popup
   - Click "Mit Clerk anmelden" / "Login with Clerk" button
   - Authentication window should open **without the satellite error**
   - Complete the sign-in flow
   - Window should close and popup should show user status

## Verification
✅ Satellite configuration removed from both source files
✅ Bundle rebuilt with correct configuration  
✅ No `isSatellite`, `domain`, or `proxyUrl` in clerk.load() call
✅ Redirect URLs preserved for OAuth compatibility

## Decision Rationale

### When to Use Satellite Configuration
Use `isSatellite: true` with `domain` and `proxyUrl` when:
- You have a main app at `example.com`
- AND a subdomain or separate app at `app.example.com`
- AND they need to share authentication

### When NOT to Use Satellite Configuration (This Case)
Do NOT use satellite configuration when:
- You have a **standalone application** (like a browser extension)
- The application manages its own authentication independently
- There is no "main app" to connect to

## References
- [Clerk Satellite Domains Documentation](https://clerk.com/docs/deployments/satellite-domains)
- [Clerk JavaScript SDK](https://clerk.com/docs/references/javascript/overview)

## Security Summary
No security vulnerabilities introduced:
- Removed unnecessary configuration that was causing errors
- All OAuth redirect URLs still properly configured with HTTPS
- Authentication flow remains secure via postMessage
- No dynamic code execution or user input handling in modified code
