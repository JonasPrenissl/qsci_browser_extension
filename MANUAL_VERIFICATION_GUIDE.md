# Manual Verification Guide - Authentication Fix

## Prerequisites

1. Chrome browser with extension developer mode enabled
2. Q-SCI browser extension built with the latest changes (`npm run build`)
3. Valid Clerk test/production credentials for q-sci.org

## Steps to Verify the Fix

### 1. Load the Extension

```bash
# Build the extension
npm run build

# In Chrome:
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode" (top right)
# 3. Click "Load unpacked"
# 4. Select the qsci_browser_extension directory
```

### 2. Clear Any Cached Sessions

Before testing, ensure no cached authentication data exists:

1. Open Chrome DevTools (F12)
2. Go to Application tab → Storage
3. Clear:
   - Local Storage for chrome-extension://[extension-id]
   - Cookies for q-sci.org and clerk.accounts.dev
4. Or use Incognito/Private browsing window

### 3. Test Authentication Flow

#### Expected Behavior (After Fix)

1. Click the Q-SCI extension icon in Chrome toolbar
2. Extension popup opens
3. You should see a "Login with Clerk" button
4. Click "Login with Clerk"
5. **NEW WINDOW OPENS** with Clerk authentication form
6. You should see:
   - Sign in form with email/password fields OR
   - OAuth buttons (Sign in with Google, Apple, etc.)
   - "Don't have an account? Sign up" link
7. **IMPORTANT**: At this point, NO success message should appear yet
8. Enter your credentials or use OAuth to authenticate
9. After successful authentication, you should see:
   - "Authentication Successful!" message
   - "Closing window..." or similar
10. Window closes automatically after ~1.5 seconds
11. Back in the extension popup, you should now see:
    - Your email address
    - Subscription status (Free/Subscribed)
    - Usage counter (X/Y analyses used)

#### What NOT to See (Old Bug)

❌ Immediate "Authentication Successful!" without seeing the sign-in form
❌ Window closing without entering credentials
❌ Extension popup still showing "Login" button after authentication

### 4. Verify Login Status Persistence

1. After successful login, close the extension popup
2. Reopen the extension popup by clicking the icon
3. Verify you're still logged in (see email and subscription status)
4. You should NOT need to login again

### 5. Test with Cached Sessions

1. Log in successfully (following steps above)
2. Close the authentication window
3. Click "Login with Clerk" again
4. **NEW BEHAVIOR**: You should still see the authentication form (Clerk may show "Continue as [email]" if session exists)
5. This is correct - we want users to explicitly authenticate in the popup

### 6. Test Logout

1. In the extension popup, click "Logout"
2. Verify you're logged out (see "Login with Clerk" button again)
3. Click "Login with Clerk" and verify the full authentication flow works

## Common Issues and Solutions

### Issue: Extension popup shows logged in but analysis fails

**Cause**: Token might be expired or invalid
**Solution**: Click "Refresh Status" button or logout and login again

### Issue: "Authentication timeout" after waiting

**Cause**: Clerk failed to load or network issues
**Solution**: 
1. Check internet connection
2. Check if q-sci.org is accessible
3. Try the "Retry" button
4. Check browser console for errors

### Issue: OAuth (Google, Apple) fails

**Cause**: Redirect URL configuration in Clerk
**Solution**: Verify Clerk dashboard has correct redirect URLs configured:
- https://www.q-sci.org/auth-callback
- https://optimal-jennet-35.clerk.accounts.dev/*

## Success Criteria

✅ Authentication form is displayed when clicking "Login with Clerk"
✅ No immediate success message without entering credentials
✅ Success message only appears after actual authentication
✅ Extension popup shows logged-in status after authentication
✅ Login status persists across popup reopens
✅ OAuth providers (Google, Apple) work correctly

## Logging and Debugging

To see detailed authentication logs:

1. Open Chrome DevTools (F12) in the authentication popup window
2. Go to Console tab
3. Look for messages starting with "Q-SCI Clerk Auth:"
4. Key log messages to look for:
   ```
   Q-SCI Clerk Auth: Clerk initialized successfully
   Q-SCI Clerk Auth: Initial state - session: false user: false
   Q-SCI Clerk Auth: Checking session... (attempt X/300)
   Q-SCI Clerk Auth: New authentication detected!
   Q-SCI Clerk Auth: Processing sign-in...
   ```

## Report Issues

If you encounter issues after this fix:

1. Collect console logs from both extension popup and auth window
2. Note the exact steps that led to the issue
3. Include browser version and extension version
4. Create a GitHub issue with the details
