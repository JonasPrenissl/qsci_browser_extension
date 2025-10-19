# Clerk Authentication Fixes

## Issues Fixed

### 1. Clerk Window Centering
**Problem**: The Clerk authentication component was not centered properly in the popup window, making it look asymmetric.

**Solution**: 
- Added CSS flexbox centering to `#clerk-container` in `clerk-auth.html`
- Added additional centering for the Clerk component's direct child div
- Updated the Clerk mounting configuration to include `margin: '0 auto'` for the card element

**Files Changed**:
- `clerk-auth.html` - Updated CSS for #clerk-container
- `src/clerk-auth-main.js` - Updated Clerk mounting configuration

### 2. Invalid URL Scheme Error
**Problem**: After login, Clerk was showing an error: `{"errors":[{"message":"Invalid URL scheme","long_message":"Please provide a URL with one of the following schemes: https, http","code":"invalid_url_scheme","meta":{"param_name":"redirect_url"}}]}`

**Root Cause**: Clerk was attempting to use redirect URLs, which would default to `chrome-extension://` URLs that are not valid HTTP(S) URLs for Clerk's redirect system.

**Solution**:
- Explicitly set `redirectUrl: undefined`, `afterSignInUrl: undefined`, and `afterSignUpUrl: undefined` in the Clerk mounting configuration
- This prevents Clerk from trying to redirect after authentication
- The extension uses postMessage communication instead of redirects, so this is the correct approach

**Files Changed**:
- `src/clerk-auth-main.js` - Updated Clerk mounting configuration

### 3. Popup Window Auto-Close
**Problem**: The popup window should close automatically after successful authentication.

**Solution**:
- Ensured both authentication paths (window.opener and chrome.storage) close the window after 1.5 seconds
- Changed the success message to "Success! Closing window..." to indicate the action
- Reduced delay from 2 seconds to 1.5 seconds for better UX

**Files Changed**:
- `src/clerk-auth-main.js` - Updated handleSignInSuccess function

### 4. Authentication State Communication
**Problem**: Need to ensure the browser extension properly receives and stores authentication state and subscription status.

**Solution**:
- Fixed property naming consistency: changed `subscription_status` to `subscriptionStatus` throughout
- Verified postMessage communication sends all required data: token, email, userId, clerkSessionId, subscriptionStatus
- Verified chrome.storage fallback for cases where postMessage isn't available
- Confirmed subscription status is extracted from `user.publicMetadata.subscription_status` in Clerk

**Files Changed**:
- `auth.js` - Fixed return value property name for consistency

## Testing Instructions

To test the authentication flow:

1. **Load the extension**:
   - Navigate to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension directory

2. **Test Clerk Login**:
   - Click the extension icon to open the popup
   - Click "Login with Clerk" button
   - A popup window should open with centered Clerk sign-in form
   - Complete the authentication
   - Window should show "Success! Closing window..." and auto-close after 1.5 seconds
   - Main popup should show user email and subscription status

3. **Verify Subscription Status**:
   - In Clerk Dashboard, set user's Public Metadata to:
     ```json
     {
       "subscription_status": "free"
     }
     ```
     or
     ```json
     {
       "subscription_status": "subscribed"
     }
     ```
   - Login and verify the correct subscription badge is shown
   - Free users should see "10 analyses per day" limit
   - Subscribed users should see "100 analyses per day" limit

4. **Verify No Errors**:
   - Open browser console (F12)
   - Login through Clerk
   - Check that there are no "Invalid URL scheme" errors
   - Verify successful authentication messages in console

## Expected Behavior

1. ✅ Clerk sign-in form is centered in the popup window
2. ✅ No "Invalid URL scheme" errors appear
3. ✅ Popup window closes automatically after successful authentication
4. ✅ Main popup shows user email and correct subscription status
5. ✅ Usage limits are correctly applied (10 for free, 100 for subscribed)

## Technical Details

### Clerk Configuration
- Publishable Key: `pk_test_b3B0aW1hbC1qZW5uZXQtMzUuY2xlcmsuYWNjb3VudHMuZGV2JA`
- Authentication Method: postMessage communication (no redirects)
- Metadata Location: `user.publicMetadata.subscription_status`

### Storage Keys
- `qsci_auth_token` - Clerk session token
- `qsci_user_email` - User's email address
- `qsci_user_id` - Clerk user ID
- `qsci_clerk_session_id` - Clerk session ID
- `qsci_subscription_status` - User's subscription status ('free', 'subscribed', or 'past_due')

### Subscription Status Values
- `'free'` - Free tier users (default)
- `'subscribed'` - Active paid subscription
- `'past_due'` - Payment issue but still has limited access

## Files Modified

1. `clerk-auth.html` - Improved centering CSS
2. `src/clerk-auth-main.js` - Fixed redirect URL issue, auto-close, and centering
3. `auth.js` - Fixed property naming consistency
4. `dist/js/bundle-auth.js` - Auto-generated from build script

## Build Command

```bash
npm run build
```

This rebuilds the bundled authentication JavaScript from the source files.
