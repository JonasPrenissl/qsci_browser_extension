# OAuth Callback Fix Verification Guide

## Issue Description
After logging in with OAuth providers (Google, Apple, etc.), the Clerk OAuth callback page (`clerk.shared.lcl.dev/v1/oauth_callback?code=...`) was showing an "Invalid URL scheme" error:
```json
{
  "errors": [{
    "message": "Invalid URL scheme",
    "long_message": "Please provide a URL with one of the following schemes: https, http",
    "code": "invalid_url_scheme",
    "meta": {
      "param_name": "redirect_url"
    }
  }],
  "clerk_trace_id": "..."
}
```

## Root Cause
When using OAuth providers in a browser extension, Clerk's OAuth callback flow needs valid HTTPS redirect URLs. The previous configuration didn't set enough redirect URL parameters, causing Clerk to default to `chrome-extension://` URLs which are invalid for OAuth flows.

## Fix Applied
Added comprehensive redirect URL configuration to both `clerk.load()` and `mountSignIn()` calls:

### In `clerk.load()`:
```javascript
await clerk.load({
  signInFallbackRedirectUrl: AUTH_CALLBACK_URL,
  signUpFallbackRedirectUrl: AUTH_CALLBACK_URL,
  signInForceRedirectUrl: AUTH_CALLBACK_URL,
  signUpForceRedirectUrl: AUTH_CALLBACK_URL,
  redirectUrl: AUTH_CALLBACK_URL  // NEW: Added for OAuth callback scenarios
});
```

### In `mountSignIn()`:
```javascript
clerk.mountSignIn(clerkContainer, {
  redirectUrl: AUTH_CALLBACK_URL,
  afterSignInUrl: AUTH_CALLBACK_URL,
  afterSignUpUrl: AUTH_CALLBACK_URL,
  signInForceRedirectUrl: AUTH_CALLBACK_URL,       // NEW
  signUpForceRedirectUrl: AUTH_CALLBACK_URL,       // NEW
  signInFallbackRedirectUrl: AUTH_CALLBACK_URL,    // NEW
  signUpFallbackRedirectUrl: AUTH_CALLBACK_URL,    // NEW
  appearance: { ... }
});
```

Where `AUTH_CALLBACK_URL = 'https://www.q-sci.org/auth-callback'` (a valid HTTPS URL).

## How to Verify the Fix

### Prerequisites
1. Load the extension in Chrome (`chrome://extensions`, Developer mode, Load unpacked)
2. Ensure you have Clerk configured with at least one OAuth provider (Google, Apple, etc.)
3. Open the browser console (F12) to monitor for errors

### Test Steps

#### Test 1: OAuth Sign-In (Google)
1. Click the extension icon to open the popup
2. Click "Login with Clerk" button
3. In the Clerk sign-in form, click "Sign in with Google"
4. Complete Google authentication
5. **Expected Result**: 
   - ✅ No "Invalid URL scheme" error appears
   - ✅ User is redirected back to the extension successfully
   - ✅ Success message appears: "Success! Closing window..."
   - ✅ Window closes automatically after 1.5 seconds
   - ✅ Main popup shows user email and subscription status

#### Test 2: OAuth Sign-In (Apple) - if configured
1. Click the extension icon to open the popup
2. Click "Login with Clerk" button
3. In the Clerk sign-in form, click "Sign in with Apple"
4. Complete Apple authentication
5. **Expected Result**: Same as Test 1

#### Test 3: OAuth Sign-Up (Google)
1. Click the extension icon to open the popup
2. Click "Login with Clerk" button
3. In the Clerk form, switch to sign-up if not already there
4. Click "Sign up with Google"
5. Complete Google authentication and any additional sign-up steps
6. **Expected Result**: Same as Test 1

#### Test 4: Console Error Check
1. Open the browser console (F12)
2. Complete any OAuth authentication flow (Tests 1-3)
3. **Expected Result**: 
   - ✅ No "Invalid URL scheme" errors in console
   - ✅ No errors with `redirect_url` parameter
   - ✅ Only successful authentication messages appear

### What to Look For

#### ✅ Success Indicators:
- OAuth callback page loads without errors
- User is successfully redirected back to the extension
- Console shows: `Q-SCI Clerk Auth: Session detected, user signed in`
- Console shows: `Q-SCI Clerk Auth: Processing sign-in...`
- Success message appears and window auto-closes
- Main popup shows authenticated state

#### ❌ Failure Indicators:
- Error page appears on `clerk.shared.lcl.dev/v1/oauth_callback`
- Console shows "Invalid URL scheme" error
- Console shows errors with `redirect_url` parameter
- User gets stuck on OAuth callback page
- Window doesn't close automatically

## Technical Details

### Why Multiple Redirect URLs?
Clerk uses different redirect URL parameters for different scenarios:
- **`redirectUrl`**: General redirect after authentication
- **`afterSignInUrl`**: Redirect after sign-in completion
- **`afterSignUpUrl`**: Redirect after sign-up completion
- **`signInForceRedirectUrl`**: Forces redirect for sign-in, overriding other settings
- **`signUpForceRedirectUrl`**: Forces redirect for sign-up, overriding other settings
- **`signInFallbackRedirectUrl`**: Fallback redirect for sign-in if no other URL is set
- **`signUpFallbackRedirectUrl`**: Fallback redirect for sign-up if no other URL is set

By setting all of these to a valid HTTPS URL, we ensure OAuth flows always have a valid redirect URL to use.

### OAuth Flow Diagram
```
1. User clicks "Sign in with Google"
   ↓
2. Extension redirects to Google OAuth
   ↓
3. User authenticates with Google
   ↓
4. Google redirects to Clerk OAuth callback
   (clerk.shared.lcl.dev/v1/oauth_callback?code=...)
   ↓
5. Clerk needs to redirect back to application
   → Looks for redirect_url parameter
   → Uses one of: signInForceRedirectUrl, afterSignInUrl, 
                  redirectUrl, signInFallbackRedirectUrl
   → If none set or invalid: ERROR ❌
   → If valid HTTPS URL set: SUCCESS ✅
   ↓
6. Redirects to https://www.q-sci.org/auth-callback
   ↓
7. Extension detects authentication via session polling
   ↓
8. User is logged in successfully
```

## Files Changed
- `src/auth.js` - Main authentication logic (gets bundled)
- `src/clerk-auth-main.js` - Standalone authentication logic (for consistency)
- `dist/js/bundle-auth.js` - Generated bundle (auto-built from src/auth.js)
- `dist/js/bundle-auth.js.map` - Source map for debugging

## Build Command
To rebuild after any changes:
```bash
npm run build
```

## Related Documentation
- [Clerk Redirect URL Documentation](https://clerk.com/docs/authentication/configuration/redirect-urls)
- [OAuth in Browser Extensions](https://developer.chrome.com/docs/extensions/reference/identity/)
- Previous fix attempts: See `AUTHENTICATION_FIXES.md` and `CLERK_AUTH_FIXES_SUMMARY.md`
