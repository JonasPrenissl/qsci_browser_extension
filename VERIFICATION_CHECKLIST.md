# Verification Checklist for Clerk Authentication Fixes

## Pre-Testing Setup
- [ ] Run `npm install` to ensure all dependencies are installed
- [ ] Run `npm run build` to build the latest bundle
- [ ] Load extension in Chrome at `chrome://extensions` (Developer mode enabled)

## UI Centering Tests
- [ ] Click extension icon to open popup
- [ ] Click "Login with Clerk" button
- [ ] Verify popup window opens (500x700px)
- [ ] **Critical**: Verify Clerk sign-in form is centered horizontally in the window
- [ ] Verify form is vertically centered or well-positioned
- [ ] Sign-in form should look symmetric and professional

## Invalid URL Scheme Error Tests
- [ ] Open browser console (F12)
- [ ] Complete Clerk authentication
- [ ] **Critical**: Verify NO "Invalid URL scheme" error appears in console
- [ ] Verify NO errors related to redirect_url appear
- [ ] Check Network tab - no failed requests to chrome-extension:// URLs

## Auto-Close Window Tests
- [ ] After clicking sign-in in Clerk UI
- [ ] Verify success message appears: "Success! Closing window..."
- [ ] **Critical**: Verify window auto-closes after approximately 1.5 seconds
- [ ] Test should work whether popup is opened normally OR in a new tab

## Authentication State Tests
- [ ] After successful authentication, verify main popup shows:
  - [ ] User email address displayed
  - [ ] Subscription badge shown (Free/Subscribed/Past Due)
  - [ ] Usage counter displayed (X / Y format)
  - [ ] Analyze buttons are ENABLED (not grayed out)

## Subscription Status Tests

### Free User Test
- [ ] In Clerk Dashboard, set user Public Metadata:
  ```json
  {
    "subscription_status": "free"
  }
  ```
- [ ] Login to extension
- [ ] Verify badge shows "Free" (or localized equivalent)
- [ ] Verify usage limit shows "0 / 10"

### Subscribed User Test
- [ ] In Clerk Dashboard, set user Public Metadata:
  ```json
  {
    "subscription_status": "subscribed"
  }
  ```
- [ ] Login to extension
- [ ] Verify badge shows "Subscribed" (or localized equivalent)
- [ ] Verify usage limit shows "0 / 100"

### Past Due User Test
- [ ] In Clerk Dashboard, set user Public Metadata:
  ```json
  {
    "subscription_status": "past_due"
  }
  ```
- [ ] Login to extension
- [ ] Verify badge shows "Past Due" (or localized equivalent)
- [ ] Verify usage limit shows "0 / 10"

## Edge Cases
- [ ] Test logout functionality - verify user is logged out
- [ ] Test re-login - verify it works without errors
- [ ] Test with pop-up blocker enabled - verify appropriate error message
- [ ] Close auth window manually before completing - verify appropriate error handling

## Console Verification
- [ ] Open browser console during entire flow
- [ ] Verify these console messages appear:
  - [ ] "Q-SCI Clerk Auth: Initializing Clerk..."
  - [ ] "Q-SCI Clerk Auth: Clerk initialized successfully"
  - [ ] "Q-SCI Clerk Auth: Mounting sign-in component..."
  - [ ] "Q-SCI Clerk Auth: Processing sign-in..."
  - [ ] "Q-SCI Auth: Received authentication success from Clerk"
- [ ] Verify NO errors appear in console

## Storage Verification
- [ ] After successful authentication, open Chrome DevTools
- [ ] Go to Application > Storage > Local Storage > Extension
- [ ] Verify these keys exist:
  - [ ] `qsci_auth_token` (has value)
  - [ ] `qsci_user_email` (has user's email)
  - [ ] `qsci_user_id` (has Clerk user ID)
  - [ ] `qsci_clerk_session_id` (has session ID)
  - [ ] `qsci_subscription_status` (has 'free', 'subscribed', or 'past_due')

## Final Checks
- [ ] All 4 main issues from problem statement are resolved:
  1. Clerk window is centered ✓
  2. No "Invalid URL scheme" error ✓
  3. Window auto-closes after auth ✓
  4. Subscription status is communicated and displayed ✓

---

## Notes
- If any test fails, check the console for error messages
- Refer to AUTHENTICATION_FIXES.md for detailed troubleshooting
- Refer to CLERK_AUTH_FIXES_SUMMARY.md for technical details
