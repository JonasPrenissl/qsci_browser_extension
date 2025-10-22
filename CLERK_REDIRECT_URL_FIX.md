# Clerk Redirect URL and JSON Parsing Fixes

## Issues Fixed

### 1. Deprecated `redirectUrl` Prop Warning
**Error**: `Clerk: The prop "redirectUrl" is deprecated and should be replaced with the new "fallbackRedirectUrl" or "forceRedirectUrl" props instead.`

**Root Cause**: The Clerk SDK deprecated the `redirectUrl` prop in favor of more specific redirect URL options.

**Solution**: 
- Removed `redirectUrl` from `clerk.load()` configuration in `src/auth.js`
- Removed `redirectUrl` from `clerk.mountSignIn()` configuration in `src/auth.js`
- Now using only the non-deprecated props:
  - `signInFallbackRedirectUrl`
  - `signUpFallbackRedirectUrl`
  - `signInForceRedirectUrl`
  - `signUpForceRedirectUrl`
  - `afterSignInUrl`
  - `afterSignUpUrl`

### 2. Redirect URL Not in allowedRedirectOrigins
**Error**: `Clerk: Redirect URL https://www.q-sci.org/auth-callback is not on one of the allowedRedirectOrigins, falling back to the default redirect URL.`

**Root Cause**: This warning appeared due to the deprecated `redirectUrl` prop being used. The new fallback/force redirect URL props handle this correctly.

**Solution**: By removing the deprecated prop and using only the new props, Clerk now properly handles the redirect URLs without warnings.

### 3. JSON Parsing Errors
**Error**: `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

**Root Cause**: The backend API endpoint `/api/auth/subscription-status` was returning HTML error pages instead of JSON in some error cases, but the code was attempting to parse the response as JSON without checking the content-type header.

**Solution**: Added content-type validation before parsing JSON responses:
```javascript
const contentType = response.headers.get('content-type');
if (contentType && contentType.includes('application/json')) {
  const data = await response.json();
  // ... process data
} else {
  console.warn('Backend returned non-JSON response');
  // ... use fallback behavior
}
```

This fix was applied to:
- `src/auth.js` - `handleSignInSuccess()` function
- `auth.js` - `verifyAndRefreshAuth()` function
- `auth.js` - `refreshSubscriptionStatus()` function

### 4. Undefined `textToEvaluate` Variable
**Error**: `ReferenceError: textToEvaluate is not defined`

**Root Cause**: In `popup.js`, the variable `textToEvaluate` was referenced in a `console.log()` statement before it was declared with `const`.

**Solution**: Moved the variable declaration before its first usage:
```javascript
// Before:
console.log('Q-SCI Debug Popup: Text length:', textToEvaluate.length);
// ... later ...
const textToEvaluate = requestData.text || '';

// After:
const textToEvaluate = requestData.text || '';
console.log('Q-SCI Debug Popup: Text length:', textToEvaluate.length);
```

## Files Modified

1. **src/auth.js** - Source file for authentication (gets bundled)
   - Removed deprecated `redirectUrl` prop from `clerk.load()`
   - Removed deprecated `redirectUrl` prop from `clerk.mountSignIn()`
   - Added content-type validation for subscription status API

2. **auth.js** - Main authentication module
   - Added content-type validation for subscription status API calls
   - Improved error logging with response status codes

3. **popup.js** - Extension popup UI
   - Fixed undefined `textToEvaluate` reference

4. **dist/js/bundle-auth.js** - Bundled authentication code
   - Rebuilt with all the above fixes

## Testing

To verify these fixes:

1. **Clerk Warnings**: Check the browser console - no more warnings about deprecated `redirectUrl` prop
2. **JSON Parsing**: Subscription status errors now gracefully fallback to cached data instead of crashing with JSON parsing errors
3. **textToEvaluate**: No more ReferenceError when analyzing papers in the popup

## Backward Compatibility

All changes are backward compatible:
- The new Clerk redirect URL props are supported in Clerk SDK 5.0+
- Content-type validation only adds defensive error handling
- The textToEvaluate fix doesn't change functionality, just fixes the error

## Related Issues

- Clerk deprecation documentation: https://clerk.com/docs/guides/custom-redirects#redirect-url-props
- Extension uses Chrome Extension Manifest V3
- Authentication flow uses postMessage for communication between windows
