# Quick Testing Guide

## How to Test the Authentication Fixes

### Prerequisites
1. Chrome or Edge browser
2. Clerk account configured (or test account)

### Loading the Extension
```bash
1. Open Chrome/Edge
2. Navigate to chrome://extensions
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select this directory: /path/to/qsci_browser_extension
6. Extension should load with Q-SCI icon
```

### Test Scenario 1: Fresh Login ✅
**Expected**: Login completes and popup shows logged-in state

1. Click the Q-SCI extension icon
2. Popup should show "Anmeldung erforderlich" (Login Required)
3. Click "🔐 Mit Clerk anmelden" button
4. Auth window opens (should be 500x700 popup)
5. Complete login via Clerk (Google, email, etc.)
6. Auth window should show "Success! Closing window..." for 2 seconds
7. Auth window closes automatically
8. **CHECK**: Extension popup should now show:
   - ✅ Your email address
   - ✅ Subscription badge (Free/Subscribed)
   - ✅ Usage count (e.g., "0 / 10")
   - ✅ "Abmelden" (Logout) button visible

### Test Scenario 2: Popup Persistence ✅
**Expected**: Logged-in state persists across popup opens

1. Close the extension popup (click elsewhere or ESC)
2. Click the Q-SCI extension icon again
3. **CHECK**: Should immediately show logged-in state
   - ✅ Should NOT show "Anmeldung erforderlich"
   - ✅ Should show your email and subscription status
   - ✅ Should NOT require login again

### Test Scenario 3: No More ERR_FILE_NOT_FOUND ✅
**Expected**: Can click login multiple times without errors

1. While logged in, click "Abmelden" (Logout)
2. Should show "Anmeldung erforderlich" again
3. Click "🔐 Mit Clerk anmelden"
4. Auth window opens
5. Complete login
6. After successful login, logout again
7. Click "🔐 Mit Clerk anmelden" again
8. **CHECK**: Should open clean auth window
   - ✅ Should NOT show "ERR_FILE_NOT_FOUND"
   - ✅ Should show Clerk login form correctly

### Test Scenario 4: Window Close Handling ✅
**Expected**: Auth state saved even if window closes early

1. Start a fresh login (logout first if needed)
2. Click "🔐 Mit Clerk anmelden"
3. Complete authentication in the popup
4. Immediately look at the extension popup
5. **CHECK**: Within 2-3 seconds of completing auth:
   - ✅ Extension popup should update to logged-in state
   - ✅ Should NOT show "Authentication window was closed" error

### Console Log Verification

Open DevTools (F12) on the extension popup and check console for:

**Successful Flow:**
```
Q-SCI Auth: Opening Clerk authentication pop-up...
Q-SCI Clerk Auth: Saving auth data to chrome.storage...
Q-SCI Clerk Auth: Auth data saved successfully
Q-SCI Auth: Received authentication success from Clerk
Q-SCI Debug Popup: Login completed
```

**Fallback Flow (if postMessage missed):**
```
Q-SCI Auth: Auth window closed, checking for stored credentials...
Q-SCI Auth: Found stored credentials after window close
Q-SCI Debug Popup: Login completed
```

### Common Issues & Solutions

**Issue**: Extension popup shows "Anmeldung erforderlich" after login
- **Fix Applied**: This should not happen anymore - auth state is stored before window closes
- **If still happens**: Check console logs for errors

**Issue**: ERR_FILE_NOT_FOUND on second login
- **Fix Applied**: This should not happen anymore - proper state management
- **If still happens**: Clear extension storage and try again

**Issue**: "Authentication window was closed" error
- **Fix Applied**: Window close now triggers storage check as fallback
- **If still happens**: Check if chrome.storage permissions are granted

### Verification Script

Run automated verification:
```bash
cd /path/to/qsci_browser_extension
./verify-auth-fixes.sh
```

Should output:
```
✅ All checks passed! Authentication fixes are properly applied.
```

### Quick Checklist

After testing, verify these all work:
- [ ] Fresh login completes successfully
- [ ] Popup updates to show logged-in state immediately
- [ ] Logged-in state persists when reopening popup
- [ ] Can logout and login again without errors
- [ ] No ERR_FILE_NOT_FOUND error
- [ ] No "Authentication window was closed" error when auth succeeds
- [ ] Console shows proper authentication flow logs

## If Issues Persist

1. Check browser console for errors
2. Verify extension has all required permissions
3. Try reloading the extension: chrome://extensions → Reload
4. Clear extension storage: Chrome DevTools → Application → Storage → Clear
5. Check that clerk-config.js has valid publishable key

## Success Criteria

The fix is successful if:
1. ✅ Login completes without errors
2. ✅ Popup immediately shows logged-in state after auth
3. ✅ State persists across popup opens
4. ✅ Can logout and re-login multiple times
5. ✅ No error messages during normal flow
