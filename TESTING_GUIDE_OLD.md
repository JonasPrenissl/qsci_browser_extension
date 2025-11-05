# Q-SCI Browser Extension - Testing Guide

This guide helps you test all features of the extension to ensure everything works correctly.

## Pre-Testing Checklist

Before running tests:
- [ ] Extension copied to **local drive** (not network drive)
- [ ] Clerk account created
- [ ] `clerk-auth.html` updated with real Clerk keys
- [ ] Extension loaded in Chrome without errors
- [ ] Extension ID noted
- [ ] Clerk redirect URL configured

## Test 1: Extension Loading

### Steps:
1. Open Chrome
2. Navigate to `chrome://extensions/`
3. Ensure "Developer mode" is ON
4. Click "Load unpacked"
5. Select the extension folder

### Expected Results:
- ✅ Extension loads without errors
- ✅ No red error messages
- ✅ Extension appears in extensions list
- ✅ Extension icon visible in toolbar
- ✅ Background script shows "Service worker (Active)"

### Troubleshooting:
- ❌ "Background script error" → Check if on local drive (not network)
- ❌ "Manifest error" → Check `manifest.json` syntax
- ❌ "File not found" → Ensure all files present

## Test 2: Authentication - Login

### Steps:
1. Click extension icon in toolbar
2. Verify "Login Required" section is visible
3. Verify analyze buttons are **disabled** (grayed out)
4. Click "Login with Clerk" button
5. Pop-up window should open
6. Complete sign-in or sign-up in Clerk

### Expected Results:
- ✅ Pop-up window opens
- ✅ Clerk authentication page loads
- ✅ Can sign in or sign up
- ✅ After successful auth, pop-up closes automatically
- ✅ Extension shows "Logged in as: your@email.com"
- ✅ Subscription badge shows "Free" or "✓ Subscribed"
- ✅ Usage display shows "0 / 10" or "0 / 100"
- ✅ Analyze buttons are now **enabled**

### Troubleshooting:
- ❌ Pop-up doesn't open → Check Chrome pop-up settings
- ❌ Pop-up shows error → Check Clerk keys in `clerk-auth.html`
- ❌ Authentication fails → Check Clerk redirect URL configured
- ❌ Pop-up doesn't close → Check browser console for errors

## Test 3: Access Control - Unauthorized Access

### Steps:
1. If logged in, click "Logout"
2. Verify login form appears
3. Try to click "Analyze Paper" button (should be disabled)
4. Try to click "Analyze Text" button (should be disabled)

### Expected Results:
- ✅ After logout, login form appears
- ✅ Analyze buttons are disabled (grayed out, opacity 0.5)
- ✅ Cannot click disabled buttons
- ✅ No analysis can be performed without login

### Troubleshooting:
- ❌ Buttons still enabled → Check `showLoginForm()` function
- ❌ Can still analyze → Check authentication guards in analyze functions

## Test 4: Paper Analysis - Supported Site

### Steps:
1. Ensure you're logged in
2. Navigate to https://pubmed.ncbi.nlm.nih.gov/
3. Search for any paper (e.g., "covid-19")
4. Click on a paper to open details page
5. Click extension icon
6. Verify "✅ Scientific site detected" status
7. Click "Analyze Paper" button
8. Wait for analysis to complete

### Expected Results:
- ✅ Status shows "✅ Scientific site detected"
- ✅ Analyze button is enabled
- ✅ Analysis starts (loading indicator appears)
- ✅ Analysis completes with results
- ✅ Quality score displayed (percentage)
- ✅ Journal tier displayed
- ✅ Quartile displayed
- ✅ Usage counter increments (e.g., "1 / 10")
- ✅ "View Details" button appears

### Troubleshooting:
- ❌ Site not detected → Check if domain in supported list
- ❌ Analysis fails → Check browser console for errors
- ❌ Usage doesn't increment → Check auth.js and storage

## Test 5: Manual Text Analysis

### Steps:
1. Ensure you're logged in
2. Click extension icon
3. Scroll to "Manual Analysis" section
4. Paste some scientific text (at least 50 characters)
5. Click "Analyze Text" button
6. Wait for analysis to complete

### Expected Results:
- ✅ Can paste text into textarea
- ✅ Button enabled when text > 50 chars
- ✅ Analysis starts and completes
- ✅ Results displayed
- ✅ Usage counter increments

### Troubleshooting:
- ❌ Button disabled → Ensure text is > 50 characters
- ❌ Analysis fails → Check browser console

## Test 6: Usage Limits - Free User

### Setup:
1. In Clerk dashboard, set user's public metadata:
   ```json
   {
     "subscription_status": "free"
   }
   ```
2. Logout and login again to refresh

### Steps:
1. Verify badge shows "Free"
2. Verify usage shows "X / 10"
3. Perform analyses until reaching 10
4. Try to perform 11th analysis

### Expected Results:
- ✅ Can perform up to 10 analyses
- ✅ Counter shows "10 / 10" after 10th analysis
- ✅ 11th analysis is blocked
- ✅ Error message: "You have reached your daily limit of 10 analyses..."
- ✅ Upgrade prompt appears after 5+ analyses

### Troubleshooting:
- ❌ Wrong limit → Check subscription_status in Clerk metadata
- ❌ Limit not enforced → Check `canAnalyze()` function
- ❌ Counter doesn't update → Check usage tracking in auth.js

## Test 7: Usage Limits - Subscribed User

### Setup:
1. In Clerk dashboard, set user's public metadata:
   ```json
   {
     "subscription_status": "subscribed"
   }
   ```
2. Logout and login again to refresh

### Steps:
1. Verify badge shows "✓ Subscribed"
2. Verify usage shows "X / 100"
3. Perform multiple analyses
4. Verify limit is 100, not 10

### Expected Results:
- ✅ Can perform up to 100 analyses
- ✅ Badge shows "✓ Subscribed" (green)
- ✅ Counter shows "X / 100"
- ✅ Upgrade prompt does **not** appear
- ✅ Limit is 100, not 10

### Troubleshooting:
- ❌ Still shows "Free" → Logout and login again
- ❌ Still limited to 10 → Check subscription_status spelling
- ❌ Upgrade prompt still shows → Check condition in popup.js

## Test 8: Daily Reset

### Steps:
1. Perform some analyses (e.g., 3 analyses)
2. Note the usage counter (e.g., "3 / 10")
3. Change system time to next day
4. OR wait until midnight
5. Click extension icon

### Expected Results:
- ✅ Usage counter resets to "0 / 10" or "0 / 100"
- ✅ Can perform analyses again
- ✅ New daily limit starts

### Troubleshooting:
- ❌ Counter doesn't reset → Check `_getTodayDate()` and `getDailyUsage()`
- ❌ Still blocked → Clear chrome.storage.local and re-test

## Test 9: Logout

### Steps:
1. Ensure you're logged in
2. Click "Logout" button
3. Verify state after logout

### Expected Results:
- ✅ Login form appears
- ✅ User status section hidden
- ✅ Analyze buttons disabled
- ✅ Cannot perform analyses
- ✅ Success message: "Logged out successfully!"

### Troubleshooting:
- ❌ Still logged in → Check `logout()` function
- ❌ Buttons still enabled → Check `showLoginForm()` function

## Test 10: Persistence - Browser Restart

### Steps:
1. Login to extension
2. Perform 2-3 analyses
3. Close Chrome completely
4. Restart Chrome
5. Click extension icon

### Expected Results:
- ✅ Still logged in (no need to login again)
- ✅ Email and subscription status visible
- ✅ Usage counter shows correct count from before restart
- ✅ Can continue analyzing

### Troubleshooting:
- ❌ Logged out after restart → Check if auth data stored in chrome.storage.local
- ❌ Usage counter reset → Check storage persistence

## Test 11: Multiple Sites

### Steps:
Test on these sites:
1. https://pubmed.ncbi.nlm.nih.gov/ (PubMed)
2. https://arxiv.org/ (arXiv)
3. https://www.nature.com/ (Nature)
4. https://www.science.org/ (Science)
5. Random site like https://www.google.com/

### Expected Results:
- ✅ Supported sites show "✅ Scientific site detected"
- ✅ Unsupported sites show "❌ Not a supported site"
- ✅ Analyze button enabled on supported sites
- ✅ Analyze button disabled on unsupported sites

## Test 12: Detailed Analysis View

### Steps:
1. Perform an analysis
2. Click "View Details" button
3. Verify detailed view

### Expected Results:
- ✅ Detailed section appears
- ✅ Journal information visible
- ✅ Quality percentage shown
- ✅ Traffic light indicator shown
- ✅ Positive aspects listed
- ✅ Areas for improvement listed
- ✅ Can click "Close" to return

## Browser Console Checks

Open DevTools (F12) and check console for:

### Expected Messages (No Errors):
```
Q-SCI Auth: Module loaded
Q-SCI Debug Popup: Script loaded
Q-SCI Debug Popup: DOM loaded, initializing...
Q-SCI Background: Service worker initialized successfully
```

### No Error Messages:
- ❌ No red error messages
- ❌ No "Uncaught TypeError"
- ❌ No "Failed to load"
- ❌ No 404 errors

## Storage Verification

### Check Chrome Storage:
1. Open DevTools (F12)
2. Go to Application tab
3. Expand "Storage" → "Local Storage" → "Extension"
4. Verify these keys exist:
   - `qsci_auth_token`
   - `qsci_user_email`
   - `qsci_user_id`
   - `qsci_clerk_session_id`
   - `qsci_subscription_status`
   - `qsci_daily_usage`
   - `qsci_last_usage_date`

### Manual Test via Console:
```javascript
chrome.storage.local.get(null, (data) => {
  console.log('Storage:', data);
});
```

## Performance Tests

### Load Time:
- Extension should load in < 1 second
- Popup should open in < 500ms

### Analysis Time:
- Paper analysis should complete in 5-15 seconds
- Manual text analysis should complete in 3-10 seconds

## Final Checklist

After all tests:
- [ ] Extension loads without errors
- [ ] Authentication works (login/logout)
- [ ] Access control works (login required)
- [ ] Usage limits enforced correctly
- [ ] Free users: 10 analyses/day
- [ ] Subscribed users: 100 analyses/day
- [ ] Daily reset works
- [ ] Persistence works (survives browser restart)
- [ ] Multiple sites supported
- [ ] Paper analysis works
- [ ] Manual text analysis works
- [ ] Detailed view works
- [ ] No console errors
- [ ] Storage contains correct data

## Bug Reporting

If you find issues:
1. Note the exact steps to reproduce
2. Check browser console for errors
3. Check `chrome://extensions/` for errors
4. Note your setup:
   - Chrome version
   - Extension version
   - OS (Windows/Mac/Linux)
   - Clerk configuration status
5. Create detailed bug report with:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Console errors
   - Screenshots

## Success Criteria

✅ **All tests pass**
✅ **No console errors**
✅ **Authentication works**
✅ **Usage limits enforced**
✅ **Only logged-in users can analyze**
✅ **Daily reset works**
✅ **Multiple sites supported**

## Automated Testing (Future)

Consider adding:
- Unit tests for auth.js functions
- Integration tests for popup.js
- E2E tests with Puppeteer
- Mock Clerk responses for testing

---

**Testing complete?** Document any issues found and create bug reports as needed.
