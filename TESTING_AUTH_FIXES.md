# Testing Authentication Fixes

This document describes how to test the authentication fixes applied to resolve the issues where authentication works once but doesn't persist, and "file not detected" errors on second login attempts.

## Fixes Applied

### 1. Enhanced Logging
- Added comprehensive debug logging throughout the authentication flow
- Storage operations now log success/failure and verify data was written
- All chrome.storage reads/writes are logged with details
- Popup initialization logs all storage keys and auth state

### 2. Improved Storage Persistence
- Increased window close delay from 2000ms to 2500ms to ensure storage writes complete
- Increased storage verification delay from 500ms to 1000ms
- Added verification after each chrome.storage.local.set() call
- Added try-catch blocks around all storage operations
- Added validation for auth data before storing

### 3. Better Error Handling
- Added validation for received auth data (checks for token, email, userId)
- Improved error messages for file loading issues
- Added retry button on initialization errors
- Better detection of network vs. configuration errors

## Testing Steps

### Test 1: Fresh Login (First Time)

1. **Remove the extension and reinstall it** (or clear extension storage):
   - Go to `chrome://extensions/`
   - Find "Q-SCI: Scientific Paper Quality Evaluator"
   - Click "Remove" and confirm
   - Reload the extension (or load unpacked from the directory)

2. **Open the popup**:
   - Click the extension icon in Chrome toolbar
   - Open Chrome DevTools (F12 or right-click > Inspect)
   - Go to the Console tab

3. **Look for initialization logs**:
   ```
   Q-SCI Debug Popup: All chrome.storage.local keys: []
   Q-SCI Auth: Checking if user is logged in...
   Q-SCI Auth: isLoggedIn result: false
   Q-SCI Debug Popup: User not logged in, showing login form
   ```

4. **Click the "Login with Clerk" button**:
   - A new popup window should open with the Clerk authentication interface
   - Watch the console logs in BOTH windows (popup and auth window)

5. **Complete authentication** in the Clerk window:
   - Sign in with your credentials
   - Watch for these logs in the auth window console:
   ```
   Q-SCI Clerk Auth: New authentication detected!
   Q-SCI Clerk Auth: Processing sign-in...
   Q-SCI Clerk Auth: Saving auth data to chrome.storage...
   Q-SCI Clerk Auth: Auth data saved to chrome.storage successfully
   Q-SCI Clerk Auth: Verification - token saved: true email saved: true
   Q-SCI Clerk Auth: Posting message to opener window...
   ```

6. **Check the popup window console** for:
   ```
   Q-SCI Auth: Received authentication success from Clerk
   Q-SCI Auth: Auth data received: {hasToken: true, hasEmail: true, hasUserId: true}
   Q-SCI Auth: Storing received auth data...
   Q-SCI Auth: Storing auth data... {hasToken: true, email: "...", ...}
   Q-SCI Auth: Auth data stored successfully
   Q-SCI Auth: Verification - data in storage: {hasToken: true, ...}
   Q-SCI Auth: Auth data stored via postMessage
   ```

7. **Verify the UI updates**:
   - The login form should disappear
   - The user status section should appear showing your email
   - The subscription badge should show your status (Free/Subscribed)

**Expected Result**: Authentication succeeds, auth window closes, popup shows logged-in state.

### Test 2: Persistence After Closing Popup

1. **Close the popup** (click outside or press Escape)

2. **Wait 2 seconds**

3. **Re-open the popup** by clicking the extension icon again

4. **Check the console logs**:
   ```
   Q-SCI Debug Popup: All chrome.storage.local keys: [..."qsci_auth_token", "qsci_user_email", ...]
   Q-SCI Debug Popup: Auth-related storage: {hasAuthToken: true, hasEmail: true, ...}
   Q-SCI Auth: Checking if user is logged in...
   Q-SCI Auth: isLoggedIn result: true
   Q-SCI Auth: Getting current user...
   Q-SCI Auth: Storage keys retrieved: {hasToken: true, hasEmail: true, ...}
   Q-SCI Auth: Current user: {email: "...", subscriptionStatus: "..."}
   ```

5. **Verify the UI**:
   - Should immediately show the logged-in state (no login form)
   - Should display your email and subscription status
   - Should show usage counter

**Expected Result**: Popup remembers authentication state and shows logged-in UI immediately.

### Test 3: Second Login Attempt (Without Logging Out)

1. **With the popup still showing logged-in state**, manually clear storage:
   - In popup DevTools console, run:
   ```javascript
   await chrome.storage.local.clear()
   ```

2. **Close and reopen the popup**

3. **Click the "Login with Clerk" button again**

4. **Verify**:
   - Auth window opens successfully
   - You can complete authentication
   - Auth data is saved correctly
   - Popup shows logged-in state

**Expected Result**: Second login attempt works identically to the first.

### Test 4: Logout and Re-login

1. **With popup showing logged-in state**, click "Logout" button

2. **Verify**:
   - Login form should reappear
   - Console should log:
   ```
   Q-SCI Auth: User logged out
   ```

3. **Click "Login with Clerk" again**

4. **Complete authentication**

5. **Verify**:
   - Authentication succeeds
   - Popup shows logged-in state again

**Expected Result**: Logout clears auth data, re-login works correctly.

## Common Issues and Solutions

### Issue: "File not detected" or similar errors

**Possible causes**:
1. Extension not properly reloaded after code changes
2. Bundle file missing or corrupted
3. Browser cache issues

**Solutions**:
1. Go to `chrome://extensions/`
2. Click the reload icon for the extension
3. Or click "Remove" and reinstall
4. Clear browser cache (Ctrl+Shift+Delete)
5. Run `npm run build` to rebuild the bundle

### Issue: Auth window opens but doesn't show Clerk UI

**Check**:
1. Auth window console for errors
2. Verify bundle-auth.js loaded: Look for network errors in auth window DevTools > Network tab
3. Check if Clerk SDK loaded: Look for "Clerk SDK loaded successfully" log

**Solutions**:
1. Check internet connection
2. Verify bundle-auth.js exists in dist/js/
3. Run `npm run build` again
4. Check clerk-config.js has valid publishable key

### Issue: Authentication succeeds but popup doesn't update

**Check**:
1. Popup console for postMessage logs
2. Popup console for storage write/read logs
3. Run in popup console: `await chrome.storage.local.get(null)` to see all stored data

**Solutions**:
1. Check if postMessage is being sent (auth window logs)
2. Check if messageHandler is receiving it (popup logs)
3. Check if storage write succeeded (look for verification logs)
4. Increase window close delays if needed

### Issue: Popup shows login form even after successful authentication

**Check**:
1. Popup initialization logs for storage state
2. Run: `await chrome.storage.local.get(['qsci_auth_token'])` in popup console
3. Check if token exists in storage

**Solutions**:
1. If token exists but popup doesn't recognize it: Check for timing issues
2. If token doesn't exist: Storage write failed, check auth window logs
3. Increase delays in code if needed

## Debug Commands

Run these in the popup DevTools console:

```javascript
// Check all storage
await chrome.storage.local.get(null)

// Check auth token specifically
await chrome.storage.local.get(['qsci_auth_token', 'qsci_user_email'])

// Clear storage (for testing)
await chrome.storage.local.clear()

// Check if auth service is available
window.QSCIAuth

// Manually check login status
await window.QSCIAuth.isLoggedIn()

// Get current user
await window.QSCIAuth.getCurrentUser()
```

## Reporting Issues

If issues persist, provide:

1. **Browser Console Logs** from:
   - Popup window (both windows if auth window opens)
   - Background service worker (chrome://extensions/ > Service Worker link)

2. **Steps that led to the issue**

3. **Expected vs. Actual behavior**

4. **Output of debug commands** (see above)

5. **Screenshots** of any error messages

## Changes Made

Files modified:
- `auth.js` - Enhanced logging, validation, better error handling
- `src/auth.js` - Improved storage persistence, verification, error messages
- `popup.js` - Added storage state debug logging on init
- `dist/js/bundle-auth.js` - Rebuilt with all changes

No breaking changes were made. All changes are additive (more logging) or improvements (better timing, validation).
