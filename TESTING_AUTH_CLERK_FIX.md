# Testing Plan for Clerk Authentication Fixes

## Changes Made

### 1. Fixed "Invalid URL scheme" Error
- **Issue**: After login, Clerk showed error: `{"errors":[{"message":"Invalid URL scheme",...}]}`
- **Root Cause**: Clerk was configured with `afterSignInUrl` and `afterSignUpUrl` pointing to HTTPS URLs, causing unwanted redirect attempts
- **Fix**: Explicitly set `afterSignInUrl` and `afterSignUpUrl` to `undefined` in Clerk mount configuration (redirectUrl is also set to undefined for completeness)
- **File Changed**: `src/clerk-auth-main.js`

### 2. Fixed Auth State Transmission Issue
- **Issue**: Browser extension didn't know after login that user was logged in
- **Root Cause**: When user had a cached Clerk session, the session polling logic wouldn't detect it (no transition from "no session" to "session"), so auth data wasn't stored/transmitted
- **Fix**: Added check for existing active sessions after Clerk initialization. If found, immediately process and transmit auth data
- **File Changed**: `src/clerk-auth-main.js`

## Test Scenarios

### Test 1: Fresh Login (No Cached Session)
**Purpose**: Verify auth works for users logging in for the first time

**Steps**:
1. Clear browser data (cookies, cache, local storage) for `*.clerk.accounts.dev` and extension
2. Open Chrome and load the extension
3. Click extension icon to open popup
4. Click "Login with Clerk" button
5. Complete authentication in the popup window
6. Observe the behavior

**Expected Results**:
- ✅ Clerk sign-in form displays correctly
- ✅ After authentication, no "Invalid URL scheme" error appears
- ✅ Success message shows: "Success! Closing window..."
- ✅ Auth window closes automatically after 2 seconds
- ✅ Main popup immediately shows user email and subscription status
- ✅ No manual refresh needed

**Debug Console Checks**:
```
Q-SCI Clerk Auth: Clerk initialized successfully
Q-SCI Clerk Auth: Mounting sign-in component...
Q-SCI Clerk Auth: New authentication detected!
Q-SCI Clerk Auth: Saving auth data to chrome.storage...
Q-SCI Clerk Auth: Auth data saved to chrome.storage successfully
Q-SCI Clerk Auth: Posting message to opener window...
Q-SCI Auth: Received authentication success from Clerk
Q-SCI Auth: Auth data stored via postMessage
Q-SCI Debug Popup: Login completed, user data: [object]
```

### Test 2: Login with Cached Session
**Purpose**: Verify auth works when user already has a Clerk session

**Steps**:
1. Complete Test 1 (or visit q-sci.org website and login)
2. Logout from extension (click logout button)
3. Click "Login with Clerk" button again
4. Observe the behavior

**Expected Results**:
- ✅ Auth window opens and immediately detects cached session
- ✅ No "Invalid URL scheme" error appears
- ✅ Success message shows: "Success! Closing window..."
- ✅ Auth window closes automatically after 2 seconds
- ✅ Main popup immediately shows user email and subscription status
- ✅ User does NOT need to re-enter credentials

**Debug Console Checks**:
```
Q-SCI Clerk Auth: Clerk initialized successfully
Q-SCI Clerk Auth: Existing active session found, processing immediately...
Q-SCI Clerk Auth: Processing sign-in...
Q-SCI Clerk Auth: Saving auth data to chrome.storage...
Q-SCI Clerk Auth: Auth data saved to chrome.storage successfully
```

### Test 3: OAuth Login (Google, etc.)
**Purpose**: Verify OAuth providers work without redirect errors

**Steps**:
1. Clear browser data
2. Open extension and click "Login with Clerk"
3. Click "Sign in with Google" (or another OAuth provider)
4. Complete OAuth flow
5. Observe the behavior

**Expected Results**:
- ✅ OAuth flow completes successfully
- ✅ No "Invalid URL scheme" error appears
- ✅ Returns to Clerk auth window after OAuth
- ✅ Success message shows and window closes
- ✅ Main popup shows user email and subscription status

### Test 4: Subscription Status Display
**Purpose**: Verify subscription status is correctly fetched and displayed

**Steps**:
1. Login with Clerk
2. Check subscription badge in main popup
3. In Clerk Dashboard, update user's metadata
4. Click "Refresh Status" button in extension
5. Observe the subscription badge update

**Expected Results**:
- ✅ Free users show "Free" badge with gray background
- ✅ Subscribed users show "Subscribed" badge with green background
- ✅ Usage limits display correctly (10 for free, 100 for subscribed)
- ✅ Refresh button updates status from backend

### Test 5: Auth Persistence
**Purpose**: Verify auth state persists across popup opens/closes

**Steps**:
1. Login with Clerk
2. Close popup
3. Open popup again
4. Observe the authentication state

**Expected Results**:
- ✅ User remains logged in
- ✅ Email and subscription status display immediately
- ✅ No need to re-authenticate

### Test 6: Network Error Handling
**Purpose**: Verify graceful handling of network errors

**Steps**:
1. Login with Clerk
2. Disable network connection
3. Open popup
4. Observe the behavior

**Expected Results**:
- ✅ User still shows as logged in (cached data)
- ✅ Subscription status shows cached value
- ✅ Warning logged about network error
- ✅ Extension remains functional with cached data

## Common Issues and Solutions

### Issue: "Invalid URL scheme" error still appears
**Solution**: Ensure you rebuilt the extension after changes: `npm run build`

### Issue: Auth data not transmitted to popup
**Symptoms**: Window closes but popup doesn't show logged-in state
**Debug Steps**:
1. Check browser console for errors
2. Verify chrome.storage has auth data using console: `chrome.storage.local.get(['qsci_auth_token'], (r) => console.log('Has token:', !!r.qsci_auth_token))`
3. Check if postMessage is blocked (check for Content Security Policy errors)

**Solution**: The code now has multiple fallback mechanisms:
- Primary: postMessage from auth window to popup
- Fallback 1: chrome.storage written before window close
- Fallback 2: popup checks storage when window closes
- Fallback 3: popup checks storage if promise rejects

### Issue: Session polling timeout
**Symptoms**: "Authentication timeout. Please try again." message
**Possible Causes**:
1. Network issues preventing Clerk from completing auth
2. User closed window before completing auth
3. Clerk API issues

**Solution**: 
- Check network connectivity
- Try the retry button that appears
- Check Clerk dashboard for service status

## Verification Checklist

After testing, verify:
- [ ] No "Invalid URL scheme" errors in console
- [ ] Auth state properly transmitted in all scenarios
- [ ] Cached sessions handled correctly
- [ ] OAuth providers work correctly
- [ ] Subscription status fetched and displayed
- [ ] Auth persists across popup sessions
- [ ] Graceful error handling for network issues
- [ ] Usage limits enforced correctly

## Debug Commands

### Check chrome.storage contents:
```javascript
chrome.storage.local.get(null, (data) => console.log(data));
```

### Check if user is logged in:
```javascript
chrome.storage.local.get('qsci_auth_token', (result) => 
  console.log('Logged in:', !!result.qsci_auth_token)
);
```

### Clear auth data (for testing):
```javascript
chrome.storage.local.remove([
  'qsci_auth_token',
  'qsci_user_email',
  'qsci_user_id',
  'qsci_clerk_session_id',
  'qsci_subscription_status'
], () => console.log('Auth data cleared'));
```

## Expected Console Output (Successful Flow)

**In Auth Window (clerk-auth.html)**:
```
Q-SCI Clerk Auth: Page loaded
Q-SCI Clerk Auth: Waiting for Clerk SDK...
Q-SCI Clerk Auth: Clerk SDK loaded successfully
Q-SCI Clerk Auth: Initializing Clerk...
Q-SCI Clerk Auth: Clerk initialized successfully
[Either: New login]
Q-SCI Clerk Auth: Mounting sign-in component...
Q-SCI Clerk Auth: Sign-in component mounted
Q-SCI Clerk Auth: Setting up session listeners...
Q-SCI Clerk Auth: New authentication detected!
[Or: Cached session]
Q-SCI Clerk Auth: Existing active session found, processing immediately...
[Then in both cases:]
Q-SCI Clerk Auth: Processing sign-in...
Q-SCI Clerk Auth: Fetched subscription status from backend: free/subscribed
Q-SCI Clerk Auth: Saving auth data to chrome.storage...
Q-SCI Clerk Auth: Auth data saved to chrome.storage successfully
Q-SCI Clerk Auth: Posting message to opener window...
Q-SCI Clerk Auth: Messages sent to opener window
Q-SCI Clerk Auth: Closing authentication window
```

**In Main Popup (popup.html)**:
```
Q-SCI Debug Popup: Script loaded
Q-SCI Debug Popup: DOM loaded, initializing...
Q-SCI Debug Popup: Initializing elements...
Q-SCI Debug Popup: Setting up event listeners...
Q-SCI Debug Popup: Initializing authentication...
Q-SCI Debug Popup: User not logged in, showing login form
[After clicking login:]
Q-SCI Debug Popup: Login button clicked
Q-SCI Debug Popup: Attempting Clerk login...
Q-SCI Auth: Opening Clerk authentication pop-up...
[After auth completes:]
Q-SCI Auth: Received authentication success from Clerk
Q-SCI Auth: Auth data stored via postMessage
Q-SCI Debug Popup: Login completed, user data: {email: "...", subscriptionStatus: "..."}
Q-SCI Debug Popup: Showing user status
```

## Build and Deployment

After verifying all tests pass:

1. **Build for production**:
   ```bash
   npm run build
   ```

2. **Update version** (if needed):
   Edit `manifest.json` and `package.json` to increment version

3. **Create release package**:
   - Zip the extension directory (exclude `node_modules`, `.git`, etc.)
   - Include: manifest.json, all .js/.html/.css files, icons/, dist/

4. **Deploy**:
   - Chrome Web Store: Upload new version
   - Internal testing: Load unpacked extension in Chrome

## Success Criteria

All fixes are successful if:
1. ✅ No "Invalid URL scheme" errors appear in any login scenario
2. ✅ Auth state is immediately transmitted to popup after login
3. ✅ Cached sessions are properly handled
4. ✅ All test scenarios pass
5. ✅ Console logs show expected flow
6. ✅ User experience is smooth (no manual refresh needed)
