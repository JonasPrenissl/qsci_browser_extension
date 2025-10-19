# Quick Test Guide for OAuth Fix

## What Was Fixed
The "Invalid URL scheme" error that appeared after OAuth login (Google, Apple, etc.) has been fixed by adding comprehensive redirect URL configuration to the Clerk authentication flow.

## Quick Test (5 minutes)

### Prerequisites
1. Chrome browser with the extension loaded
2. Clerk account configured with at least one OAuth provider (Google recommended)

### Test Steps

#### 1. Load the Extension
```bash
1. Open Chrome and go to chrome://extensions
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select this extension directory
```

#### 2. Test OAuth Login
```bash
1. Click the Q-SCI extension icon in Chrome toolbar
2. Click "Login with Clerk" button
3. In the popup, click "Sign in with Google" (or your OAuth provider)
4. Complete Google authentication
```

#### 3. Verify Success
You should see:
- ✅ **NO** "Invalid URL scheme" error page
- ✅ Success message: "Success! Closing window..."
- ✅ Window closes automatically after ~1.5 seconds
- ✅ Main popup shows your email and subscription status
- ✅ Analyze buttons are enabled

#### 4. Check Console (Optional)
```bash
1. Right-click extension icon → Inspect popup
2. Go to Console tab
3. Look for these success messages:
   - "Q-SCI Clerk Auth: Session detected, user signed in"
   - "Q-SCI Clerk Auth: Processing sign-in..."
4. Verify NO "Invalid URL scheme" errors
```

## If It Still Fails

### Check Clerk Dashboard
1. Go to your Clerk Dashboard
2. Navigate to: **Settings** → **Authentication** → **Allowed redirect URLs**
3. Ensure this URL is listed: `https://www.q-sci.org/auth-callback`
4. If not, add it and save

### Check Browser Console
1. Open the auth popup (Login with Clerk)
2. Right-click → Inspect
3. Check Console tab for any errors
4. Check Network tab for failed requests

### Check Manifest
Verify the extension's `manifest.json` includes:
```json
{
  "host_permissions": [
    "https://q-sci.org/*",
    "https://www.q-sci.org/*"
  ]
}
```

## Expected Behavior vs Previous Behavior

### Before Fix ❌
```
1. Click "Sign in with Google"
2. Complete Google authentication
3. Redirected to: clerk.shared.lcl.dev/v1/oauth_callback?code=...
4. ERROR: "Invalid URL scheme" displayed
5. User stuck on error page
```

### After Fix ✅
```
1. Click "Sign in with Google"
2. Complete Google authentication
3. Redirected to: clerk.shared.lcl.dev/v1/oauth_callback?code=...
4. Clerk successfully processes callback
5. Redirected to auth window
6. Extension detects authentication
7. Success message and auto-close
8. User is logged in
```

## What Changed in the Code

### Before (Incomplete)
```javascript
clerk.mountSignIn(container, {
  redirectUrl: AUTH_CALLBACK_URL,
  afterSignInUrl: AUTH_CALLBACK_URL,
  afterSignUpUrl: AUTH_CALLBACK_URL
});
```

### After (Comprehensive)
```javascript
clerk.mountSignIn(container, {
  redirectUrl: AUTH_CALLBACK_URL,
  afterSignInUrl: AUTH_CALLBACK_URL,
  afterSignUpUrl: AUTH_CALLBACK_URL,
  signInForceRedirectUrl: AUTH_CALLBACK_URL,     // NEW - Critical for OAuth
  signUpForceRedirectUrl: AUTH_CALLBACK_URL,     // NEW - Critical for OAuth
  signInFallbackRedirectUrl: AUTH_CALLBACK_URL,  // NEW - Safety net
  signUpFallbackRedirectUrl: AUTH_CALLBACK_URL   // NEW - Safety net
});
```

## Files That Were Changed
- ✅ `src/auth.js` - Main authentication logic
- ✅ `src/clerk-auth-main.js` - Standalone auth script
- ✅ `dist/js/bundle-auth.js` - Bundled version (auto-generated)

## Need More Details?
- Full verification guide: `OAUTH_FIX_VERIFICATION.md`
- Technical details: `FIX_SUMMARY_OAUTH_REDIRECT.md`

## Still Having Issues?
1. Check that OAuth provider is configured in Clerk Dashboard
2. Verify redirect URL is allowed in Clerk settings
3. Clear browser cache and reload extension
4. Check browser console for specific error messages
5. Try with a different OAuth provider (if multiple are configured)

## Success Indicators
- ✅ OAuth authentication completes without errors
- ✅ No "Invalid URL scheme" messages
- ✅ User data is stored correctly
- ✅ Extension UI updates to show logged-in state
- ✅ Daily usage limits are displayed correctly

## Next Steps After Verification
Once you've verified the fix works:
1. The PR is ready to merge
2. Deploy the extension update
3. Users will no longer experience OAuth callback errors
