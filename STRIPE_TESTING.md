# Stripe Subscription Integration - Testing Guide

This guide helps you test the Stripe subscription integration in the Q-SCI browser extension.

## Prerequisites

Before testing:
1. Extension loaded in Chrome (chrome://extensions/)
2. Clerk account with publishable key configured in `clerk-auth.html`
3. Backend API running with Stripe webhook handler
4. Test Stripe account with test mode enabled

## Test Cases

### Test 1: Initial Login - Free User

**Objective:** Verify free user gets correct status and limits

**Steps:**
1. Open extension popup
2. Click "Login with Clerk"
3. Sign up/sign in with test account
4. Close authentication window

**Expected Results:**
- ✓ Popup shows "Logged in as: [email]"
- ✓ Subscription badge shows "Free"
- ✓ Usage display shows "0 / 10"
- ✓ Upgrade prompt is visible
- ✓ "Refresh Status" button is visible

**Screenshot Location:** Take screenshot of popup showing free status

---

### Test 2: Manual Subscription Status Refresh

**Objective:** Verify refresh button works correctly

**Setup:**
1. Log in as free user
2. In Clerk Dashboard, manually set user's `publicMetadata.subscription_status` to `"subscribed"`

**Steps:**
1. In extension popup, click "🔄 Refresh Status" button
2. Wait for refresh to complete

**Expected Results:**
- ✓ Button shows "⏳ Refreshing..." during refresh
- ✓ Button returns to "🔄 Refresh Status" after completion
- ✓ Subscription badge updates to "✓ Subscribed"
- ✓ Usage display updates to "0 / 100"
- ✓ Upgrade prompt disappears
- ✓ Success message appears

**Browser Console Check:**
```
Q-SCI Auth: Refreshing subscription status from backend...
Q-SCI Auth: Subscription status refreshed: subscribed
```

---

### Test 3: Options Page Subscription Display

**Objective:** Verify options page shows subscription correctly

**Steps:**
1. Log in as free user
2. Right-click extension icon → Options
3. Observe subscription management section

**Expected Results - Free User:**
- ✓ Shows "Current Plan: Free"
- ✓ Shows "Daily analyses: 10"
- ✓ Shows tip about upgrading
- ✓ "Refresh Subscription Status" button visible
- ✓ "Upgrade to Premium" link visible

**Steps (continued):**
4. Update Clerk metadata to `"subscribed"`
5. Click "🔄 Refresh Subscription Status" in options page

**Expected Results - Premium User:**
- ✓ Shows "Current Plan: ✓ Premium"
- ✓ Shows "Daily analyses: 100"
- ✓ No upgrade tip shown
- ✓ Success message appears

---

### Test 4: Usage Limits Enforcement

**Objective:** Verify usage limits are enforced correctly

**Setup:**
1. Log in as free user (10/day limit)
2. Perform 10 analyses

**Steps:**
1. Try to analyze 11th paper
2. Observe error message

**Expected Results:**
- ✓ Error message: "You have reached your daily limit of 10 analyses. Please subscribe at q-sci.org for more analyses (up to 100 per day)."
- ✓ Upgrade prompt is visible
- ✓ Usage display shows "10 / 10"

**Steps (continued):**
3. Refresh subscription to "subscribed"
4. Try to analyze paper again

**Expected Results:**
- ✓ Analysis works
- ✓ Usage display updates to "11 / 100"

---

### Test 5: Subscribe Link

**Objective:** Verify subscribe link works

**Steps:**
1. Click "Subscribe Now" link in upgrade prompt
2. Or click "Upgrade to Premium" in options page

**Expected Results:**
- ✓ Opens new tab with URL: https://www.q-sci.org/subscribe
- ✓ Extension popup remains functional

---

### Test 6: Subscription Status Persistence

**Objective:** Verify subscription status persists across sessions

**Steps:**
1. Log in as premium user (subscribed)
2. Close browser completely
3. Reopen browser
4. Open extension popup

**Expected Results:**
- ✓ Still shows "Logged in as: [email]"
- ✓ Subscription badge still shows "✓ Subscribed"
- ✓ Usage display shows "X / 100"
- ✓ No login required

---

### Test 7: Logout and Re-login

**Objective:** Verify logout clears data properly

**Steps:**
1. Log in as premium user
2. Note current subscription status
3. Click "Logout" button
4. Click "Login with Clerk" again
5. Sign in with same account

**Expected Results:**
- ✓ After logout, login form appears
- ✓ Analyze buttons are disabled
- ✓ After re-login, subscription status is correct
- ✓ Usage counter is correct (not reset)

---

### Test 8: Network Error Handling

**Objective:** Verify extension works offline

**Setup:**
1. Log in as premium user
2. Disconnect from internet

**Steps:**
1. Close and reopen extension popup
2. Try to use extension features

**Expected Results:**
- ✓ Shows cached subscription status
- ✓ Warning in console about network error
- ✓ Extension remains functional
- ✓ Analysis uses cached data

**Steps (continued):**
3. Click "🔄 Refresh Status"

**Expected Results:**
- ✓ Error message about network failure
- ✓ Extension continues using cached data

---

### Test 9: End-to-End Stripe Flow (Optional)

**Objective:** Test complete payment flow (requires backend)

**Prerequisites:**
- Backend with Stripe integration running
- Stripe test mode enabled
- Webhook endpoint accessible

**Steps:**
1. Log in as free user in extension
2. Click "Subscribe Now"
3. Complete Stripe test checkout with test card `4242 4242 4242 4242`
4. Return to extension
5. Click "🔄 Refresh Status"

**Expected Results:**
- ✓ Stripe checkout completes successfully
- ✓ Webhook updates Clerk metadata
- ✓ Extension refreshes and shows "✓ Subscribed"
- ✓ Usage limit updates to 100/day

**Backend Logs Check:**
```
Webhook received: checkout.session.completed
Updated Clerk user: user_xxxxx
New subscription status: subscribed
```

**Clerk Dashboard Check:**
- Navigate to Users → [Test User] → Metadata
- Verify `publicMetadata` contains:
```json
{
  "subscription_status": "subscribed",
  "plan_id": "price_xxxxx",
  "current_period_end": "2024-XX-XXTXX:XX:XX.XXXZ"
}
```

---

### Test 10: Invalid/Expired Token

**Objective:** Verify extension handles invalid tokens

**Setup:**
1. Log in successfully
2. In Chrome DevTools → Application → Storage → Local Storage
3. Modify `qsci_auth_token` to invalid value

**Steps:**
1. Close and reopen extension popup
2. Try to analyze paper

**Expected Results:**
- ✓ Shows login form (token invalid)
- ✓ Or shows cached data with warning
- ✓ Prompts for re-login if needed

---

## Manual Testing Checklist

Before releasing:

- [ ] Test 1: Initial login as free user
- [ ] Test 2: Manual subscription refresh
- [ ] Test 3: Options page display
- [ ] Test 4: Usage limits enforcement
- [ ] Test 5: Subscribe link functionality
- [ ] Test 6: Subscription persistence
- [ ] Test 7: Logout and re-login
- [ ] Test 8: Network error handling
- [ ] Test 9: End-to-end Stripe flow (if backend available)
- [ ] Test 10: Invalid token handling

## Automated Testing (Future)

Consider adding:
- Unit tests for `AuthService.refreshSubscriptionStatus()`
- Integration tests for popup UI updates
- Mock Clerk API responses
- Mock backend API responses

## Browser Console Commands

Useful for debugging:

```javascript
// Check current user
QSCIAuth.getCurrentUser().then(console.log);

// Check usage
QSCIAuth.getCurrentUser()
  .then(u => QSCIUsage.canAnalyze(u.subscriptionStatus))
  .then(console.log);

// Refresh subscription
QSCIAuth.refreshSubscriptionStatus().then(console.log);

// Check storage
chrome.storage.local.get(null, console.log);

// Clear storage (reset extension)
chrome.storage.local.clear();
```

## Common Issues and Solutions

### Issue: Refresh button doesn't work

**Symptoms:**
- Button click has no effect
- No console logs

**Solutions:**
1. Check `auth.js` is loaded: `typeof QSCIAuth !== 'undefined'`
2. Verify button ID matches: `refresh-subscription-btn` in popup
3. Check browser console for JavaScript errors

### Issue: Subscription status doesn't update

**Symptoms:**
- Clicked refresh but still shows "Free"

**Solutions:**
1. Verify Clerk metadata is actually set to `"subscribed"`
2. Check backend `/api/auth/subscription-status` endpoint
3. Verify network request succeeds (Network tab)
4. Clear extension storage and re-login

### Issue: Upgrade prompt always visible

**Symptoms:**
- Shows upgrade prompt even for premium users

**Solutions:**
1. Check subscription status: `subscriptionStatus === 'subscribed'` (exact match)
2. Verify no typos in status value
3. Check `updateUsageDisplay()` logic

## Documentation References

- [STRIPE_INTEGRATION.md](./STRIPE_INTEGRATION.md) - Technical integration details
- [AUTHENTICATION.md](./AUTHENTICATION.md) - Authentication system overview
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - General testing guide

## Reporting Issues

When reporting issues, include:
1. Extension version
2. Browser version
3. Steps to reproduce
4. Browser console logs
5. Screenshot of issue
6. Current subscription status from storage
