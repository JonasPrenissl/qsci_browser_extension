# Testing Guide - Clerk Extension Authentication Fix

## Prerequisites

Before testing, ensure:
- [ ] Website pages deployed to `https://www.q-sci.org/extension-login` and `/extension-auth-success`
- [ ] Clerk dashboard configured with redirect URLs
- [ ] Extension built: `npm run build`
- [ ] Extension loaded in Chrome

## Test Scenarios

### Scenario 1: First-Time Login (Happy Path)

**Steps:**
1. Load extension in Chrome
2. Open extension popup
3. Click "Login with Clerk" button

**Expected Behavior:**
- ✅ New tab opens to `https://www.q-sci.org/extension-login`
- ✅ Clerk login UI appears on the website
- ✅ Can sign in with email/password or OAuth (Google, etc.)
- ✅ After successful auth, redirects to `/extension-auth-success`
- ✅ Success page shows "Authentication successful!"
- ✅ Tab auto-closes after 2 seconds
- ✅ Extension popup shows user as logged in
- ✅ User email displayed in popup
- ✅ Subscription status badge shown (Free/Subscribed)

**Verification:**
```javascript
// Check browser console in extension popup (F12)
// Should see:
"Q-SCI Auth: Received authentication success from Clerk"
"Q-SCI Auth: User logged out"
```

**Check Storage:**
```javascript
// In console:
chrome.storage.local.get(null, console.log)
// Should show:
{
  qsci_auth_token: "...",
  qsci_user_email: "user@example.com",
  qsci_user_id: "user_...",
  qsci_subscription_status: "free" or "subscribed"
}
```

### Scenario 2: Already Logged In

**Steps:**
1. Visit `https://www.q-sci.org/extension-login` directly
2. You should already be signed in to Clerk

**Expected Behavior:**
- ✅ Page automatically redirects to `/extension-auth-success`
- ✅ Shows "User already signed in, redirecting..."
- ✅ Redirects immediately

### Scenario 3: OAuth Login (Google)

**Steps:**
1. Click "Login with Clerk" in extension
2. Choose "Continue with Google"
3. Complete Google OAuth flow

**Expected Behavior:**
- ✅ Google OAuth window opens
- ✅ After approval, returns to Clerk
- ✅ Clerk redirects to `/extension-auth-success` (HTTPS URL - no error!)
- ✅ Token sent to extension
- ✅ Tab closes, user logged in

**Verification:**
- ❌ Should NOT see "Invalid URL scheme" error
- ✅ OAuth callback works correctly with HTTPS redirect

### Scenario 4: Logout and Re-login

**Steps:**
1. Logout from extension popup
2. Login again

**Expected Behavior:**
- ✅ Logout clears stored token
- ✅ Extension shows login form
- ✅ Can login again successfully
- ✅ New token stored

### Scenario 5: Token Expiry

**Steps:**
1. Login successfully
2. Wait for token to expire (or manually clear token)
3. Try to analyze a paper

**Expected Behavior:**
- ✅ Extension detects invalid/expired token
- ✅ Shows login form again
- ✅ Can re-authenticate

### Scenario 6: Popup Blocker Active

**Steps:**
1. Enable popup blocker in browser
2. Click "Login with Clerk"

**Expected Behavior:**
- ❌ Tab may not open (blocked)
- ✅ Extension shows error: "Failed to open authentication window. Please check if pop-ups are blocked."

**Fix:**
- Allow popups for the extension
- Try again

### Scenario 7: No Internet Connection

**Steps:**
1. Disconnect from internet
2. Click "Login with Clerk"

**Expected Behavior:**
- ❌ Tab opens but fails to load
- ✅ Shows browser error page
- ✅ Extension shows error after timeout

### Scenario 8: Backend API Down

**Steps:**
1. Login successfully (website works)
2. Backend API is unavailable
3. Subscription status fetch fails

**Expected Behavior:**
- ✅ Login completes (uses Clerk)
- ⚠️ Subscription status defaults to "free" (fallback)
- ✅ Warning in console: "Failed to fetch subscription status from backend"
- ✅ Extension still functions

## Console Logging Checklist

### Extension Popup Console

Check for these logs (F12 in popup):

```
✅ Q-SCI Auth: Opening Clerk authentication pop-up...
✅ Q-SCI Auth: Received authentication success from Clerk
✅ Q-SCI Auth: User logged in successfully
```

Should NOT see:
```
❌ Invalid URL scheme error
❌ chrome-extension:// in any URL
```

### Login Page Console

Open `https://www.q-sci.org/extension-login` and check console:

```
✅ Q-SCI Extension Login: Page loaded
✅ Q-SCI Extension Login: Clerk SDK loaded
✅ Q-SCI Extension Login: Initializing Clerk...
✅ Q-SCI Extension Login: Clerk initialized
✅ Q-SCI Extension Login: Sign-in component mounted
```

### Success Page Console

After login, check `/extension-auth-success` console before it closes:

```
✅ Q-SCI Auth Success: Page loaded
✅ Q-SCI Auth Success: Clerk SDK loaded
✅ Q-SCI Auth Success: User authenticated: user_...
✅ Q-SCI Auth Success: Subscription status from backend: free
✅ Q-SCI Auth Success: Sending auth data to extension via postMessage
```

## Network Tab Verification

### On Login Page

Check Network tab (F12 → Network):

```
✅ clerk.browser.js - 200 OK (Clerk SDK loads)
✅ /v1/client - 200 OK (Clerk client API)
```

### On Success Page

```
✅ clerk.browser.js - 200 OK
✅ /api/auth/subscription-status - 200 OK (backend API)
```

## Error Scenarios to Test

### 1. Invalid Clerk Key

**Setup:** Use wrong publishable key in HTML files

**Expected:**
- ❌ Clerk fails to initialize
- ✅ Error shown: "Failed to initialize authentication"

### 2. Redirect URL Not in Clerk Dashboard

**Setup:** Remove redirect URLs from Clerk dashboard

**Expected:**
- ⚠️ Warning: "Redirect URL not in allowedRedirectOrigins"
- ⚠️ May fall back to default redirect
- ⚠️ OAuth may not work correctly

### 3. Wrong Backend URL

**Setup:** Change `API_BASE_URL` to invalid URL

**Expected:**
- ✅ Login works (uses Clerk)
- ❌ Subscription status fails
- ✅ Falls back to "free" tier

## Performance Testing

### Load Times

Measure these:

1. **Login page load time:**
   - Target: < 2 seconds
   - Check: Time until Clerk UI appears

2. **Authentication completion time:**
   - Target: < 3 seconds after entering credentials
   - Check: Time until tab closes

3. **Token transfer time:**
   - Target: < 500ms
   - Check: Time from success page load to popup update

## Security Testing

### Check Token Handling

1. **Token not exposed in URL:**
   ```
   ✅ URL should be: /extension-auth-success
   ❌ NOT: /extension-auth-success?token=...
   ```

2. **Token transmitted securely:**
   ```
   ✅ Uses postMessage (browser API)
   ❌ NOT in query params or localStorage of website
   ```

3. **Token stored securely:**
   ```
   ✅ chrome.storage.local (encrypted by Chrome)
   ❌ NOT in website cookies or localStorage
   ```

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Chrome (one version back)
- [ ] Edge (Chromium-based)
- [ ] Brave

## Regression Testing

Ensure these still work:

- [ ] Manual text analysis
- [ ] Paper analysis on supported sites
- [ ] Usage limit tracking
- [ ] Subscription status display
- [ ] Logout functionality
- [ ] i18n (language switching)

## Success Criteria

All tests pass when:
- ✅ No "Invalid URL scheme" errors
- ✅ OAuth providers work (Google, Apple, etc.)
- ✅ Tab opens and closes automatically
- ✅ Token correctly transferred to extension
- ✅ User shown as logged in after auth
- ✅ Subscription status fetched correctly
- ✅ Can analyze papers after login
- ✅ Usage tracking works
- ✅ Logout and re-login work

## Rollback Testing

If issues found:
1. Revert `auth.js` to use local popup
2. Verify old flow still works (with "Invalid URL scheme" error)
3. Helps isolate if issue is with new code or existing code

## Reporting Issues

When reporting bugs, include:
1. Browser version
2. Extension version
3. Full console logs from popup, login page, and success page
4. Network tab screenshots
5. Steps to reproduce
6. Expected vs actual behavior

## Quick Test Script

Run this to verify basic flow:

```javascript
// In extension popup console:

// 1. Check if login URL is correct
console.log('Auth URL:', window.QSCIAuth.CLERK_AUTH_URL);
// Should be: https://www.q-sci.org/extension-login

// 2. Test login function exists
console.log('Login function:', typeof window.QSCIAuth.login);
// Should be: "function"

// 3. Check storage is empty (if logged out)
chrome.storage.local.get(['qsci_auth_token'], console.log);
// Should be: {} or {qsci_auth_token: "..."}

// 4. Trigger login
window.QSCIAuth.login().then(console.log).catch(console.error);
// Should open new tab and complete flow
```

## Done!

If all tests pass, the fix is working correctly! 🎉
