# Authentication Fixes Test Guide

This document describes the fixes applied to resolve authentication redirect and state synchronization issues.

## Issues Fixed

1. **ERR_FILE_NOT_FOUND Error**: After login via Clerk popup, clicking login again would show this error
2. **Extension Still Shows "Anmeldung erforderlich"**: After successful login, the popup didn't refresh to show logged-in state
3. **"Authentication window was closed" Error**: Popup would report this error even when authentication succeeded

## Root Causes

1. **Timing Issue with postMessage**: The auth window was closing before the popup could receive the authentication success message
2. **No Fallback Storage**: If postMessage failed, there was no way for the popup to know authentication succeeded
3. **No State Check on Window Close**: When the auth window closed, the popup immediately rejected the promise without checking if auth data was stored

## Solutions Implemented

### 1. Always Store to chrome.storage First (src/auth.js & src/clerk-auth-main.js)

```javascript
// ALWAYS store auth data in chrome.storage first before closing window
// This ensures data is persisted even if postMessage fails or is delayed
if (typeof chrome !== 'undefined' && chrome.storage) {
  console.log('Q-SCI Clerk Auth: Saving auth data to chrome.storage...');
  await chrome.storage.local.set({
    'qsci_auth_token': authData.token,
    'qsci_user_email': authData.email,
    'qsci_subscription_status': authData.subscriptionStatus,
    'qsci_user_id': authData.userId,
    'qsci_clerk_session_id': authData.clerkSessionId
  });
  console.log('Q-SCI Clerk Auth: Auth data saved to chrome.storage successfully');
}
```

**Why**: This ensures authentication data is persisted even if the window closes before postMessage can be delivered.

### 2. Multiple postMessage Retries (src/auth.js & src/clerk-auth-main.js)

```javascript
// Post message to opener window multiple times to ensure delivery
// Sometimes the first message can be missed if timing is off
for (let i = 0; i < 3; i++) {
  window.opener.postMessage({
    type: 'CLERK_AUTH_SUCCESS',
    data: authData
  }, '*');
  
  // Small delay between retries
  if (i < 2) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
```

**Why**: Sending multiple messages with small delays increases the likelihood that at least one message will be received before the window closes.

### 3. Increased Window Close Delay (src/auth.js & src/clerk-auth-main.js)

```javascript
// Show success and close window after a longer delay to ensure message delivery
setTimeout(() => {
  console.log('Q-SCI Clerk Auth: Closing authentication window');
  window.close();
}, 2000); // Increased from 1500ms to 2000ms
```

**Why**: The longer delay gives the popup more time to process the postMessage before the window closes.

### 4. Check Storage on Window Close (auth.js)

```javascript
// Check if window was closed without completing auth
const checkClosed = setInterval(async () => {
  if (authWindow.closed) {
    clearInterval(checkClosed);
    clearTimeout(timeoutId);
    window.removeEventListener('message', messageHandler);
    
    // Window closed - check if auth data was stored in chrome.storage
    // This handles the case where postMessage was missed or failed
    console.log('Q-SCI Auth: Auth window closed, checking for stored credentials...');
    
    // Wait a moment for any pending storage writes to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const user = await this.getCurrentUser();
      if (user && user.token && !messageReceived) {
        console.log('Q-SCI Auth: Found stored credentials after window close');
        resolve({
          email: user.email,
          subscriptionStatus: user.subscriptionStatus || 'free',
          userId: user.userId
        });
      } else if (!messageReceived) {
        reject(new Error('Authentication window was closed before completing authentication'));
      }
    } catch (error) {
      console.error('Q-SCI Auth: Error checking stored credentials:', error);
      if (!messageReceived) {
        reject(new Error('Authentication window was closed'));
      }
    }
  }
}, 500);
```

**Why**: This provides a fallback mechanism. If the postMessage was missed, the popup will check chrome.storage for authentication data and proceed successfully if it's found.

### 5. Fallback Check in Login Handler (popup.js)

```javascript
} catch (error) {
  console.error('Q-SCI Debug Popup: Login failed:', error);
  
  // Check if we have stored credentials even though login promise failed
  // This handles edge cases where auth succeeded but promise resolution failed
  try {
    const isLoggedIn = await window.QSCIAuth.isLoggedIn();
    if (isLoggedIn) {
      console.log('Q-SCI Debug Popup: Found stored credentials despite error, attempting to use them');
      currentUser = await window.QSCIAuth.getCurrentUser();
      if (currentUser) {
        showUserStatus(currentUser);
        await updateUsageDisplay();
        updatePageStatus();
        showSuccess('Login successful!');
        return;
      }
    }
  } catch (checkError) {
    console.error('Q-SCI Debug Popup: Error checking stored credentials:', checkError);
  }
  
  showError(error.message || 'Login failed. Please try again.');
}
```

**Why**: This adds another layer of resilience by checking for stored credentials even if the login promise rejects.

## Testing Instructions

### Manual Testing

1. **Load Extension**
   - Open Chrome/Edge
   - Go to chrome://extensions
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension directory

2. **Test Fresh Login**
   - Click the extension icon
   - Should show "Anmeldung erforderlich" (Login Required)
   - Click "🔐 Mit Clerk anmelden" (Login with Clerk)
   - Auth popup should open
   - Complete login with Clerk (use Google, email, etc.)
   - Auth popup should show "Success! Closing window..." and close after 2 seconds
   - Extension popup should immediately show logged-in state with email and subscription status

3. **Test Subsequent Opens**
   - Close and reopen the extension popup
   - Should show logged-in state (not "Anmeldung erforderlich")
   - Should show user email and subscription status
   - Should NOT show ERR_FILE_NOT_FOUND error

4. **Test Logout and Re-login**
   - Click "Abmelden" (Logout)
   - Should show "Anmeldung erforderlich" again
   - Click login button
   - Should successfully authenticate again without errors

### Automated Testing

Run the test page:
```bash
# Open in browser
open test-auth-flow.html
```

The test page will verify:
- Old problematic code is removed
- New state transition detection is present
- Session polling logic is implemented

## Verification Checklist

- [ ] Fresh login completes successfully
- [ ] Extension popup updates to show logged-in state after login
- [ ] No ERR_FILE_NOT_FOUND error on subsequent login attempts
- [ ] No "Authentication window was closed" error when auth succeeds
- [ ] Auth state persists across popup opens/closes
- [ ] Logout and re-login works correctly
- [ ] Console logs show proper flow of authentication

## Console Log Indicators

**Successful Authentication Flow:**
```
Q-SCI Auth: Opening Clerk authentication pop-up...
Q-SCI Clerk Auth: New authentication detected!
Q-SCI Clerk Auth: Processing sign-in...
Q-SCI Clerk Auth: Saving auth data to chrome.storage...
Q-SCI Clerk Auth: Auth data saved to chrome.storage successfully
Q-SCI Clerk Auth: Posting message to opener window...
Q-SCI Clerk Auth: Messages sent to opener window
Q-SCI Auth: Received authentication success from Clerk
Q-SCI Debug Popup: Login completed, user data: [Object]
```

**Fallback Flow (if postMessage missed):**
```
Q-SCI Auth: Auth window closed, checking for stored credentials...
Q-SCI Auth: Found stored credentials after window close
Q-SCI Debug Popup: Login completed, user data: [Object]
```

## Files Modified

1. `auth.js` - Main extension auth module
2. `popup.js` - Popup script
3. `src/auth.js` - Source auth module for bundling
4. `src/clerk-auth-main.js` - Clerk auth page script
5. `dist/js/bundle-auth.js` - Built bundle (auto-generated)

## Related Issues

- Issue: "popup-redirection to clerk and login work great! however afterwards it doesnt get redirected back to the extension"
- Solution: Store auth data before closing window and check storage as fallback

- Issue: "extension still shows 'Anmeldung erforderlich', so apparently doesnt realize that the person just logged in"
- Solution: Multiple postMessage retries and fallback storage check

- Issue: "ERR_FILE_NOT_FOUND" and "Authentication window was closed" errors
- Solution: Proper state synchronization via chrome.storage with fallback checks
