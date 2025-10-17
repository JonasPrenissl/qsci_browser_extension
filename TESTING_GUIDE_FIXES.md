# Testing Guide for Clerk Auth and API Key Fixes

## Prerequisites

Before testing, ensure:
- [ ] Backend has implemented the `/api/auth/openai-key` endpoint (see BACKEND_OPENAI_KEY_ENDPOINT.md)
- [ ] Backend `OPENAI_API_KEY` environment variable is set
- [ ] Clerk is properly configured with the correct publishable key
- [ ] Extension is loaded in Chrome (chrome://extensions/)

## Test 1: Clerk Authentication Flow

### Objective
Verify that users can successfully log in with Clerk and are no longer stuck at "Loading authentication..."

### Steps
1. Open the extension popup
2. Click "🔐 Mit Clerk anmelden" (Login with Clerk)
3. A popup window should open showing the Clerk authentication page
4. **Expected:** Clerk sign-in form loads within 5-10 seconds
5. Sign in with valid credentials or create a new account
6. **Expected:** After successful sign-in, you should see:
   - Console logs: "Q-SCI Clerk Auth: Session detected, user signed in"
   - Success message: "Erfolg! Sie können dieses Fenster schließen."
   - Popup window closes automatically after 2 seconds
7. Extension popup should update to show:
   - User email
   - Subscription status badge (Free/Premium)
   - Daily usage counter (0 / 10 or 0 / 100)

### Success Criteria
✅ Clerk auth window opens
✅ Sign-in form appears
✅ User can complete sign-in
✅ Popup closes automatically
✅ Extension shows logged-in status
✅ No error messages appear

### Failure Scenarios to Test

#### Scenario 1A: Timeout (Authentication takes too long)
1. Start login process
2. Don't complete sign-in within 5 minutes
3. **Expected:** Error message appears: "Authentication timeout. Please try again."
4. **Expected:** Retry button appears
5. Click retry button
6. **Expected:** Authentication process restarts

#### Scenario 1B: Window Closed Prematurely
1. Start login process
2. Close the popup window before signing in
3. **Expected:** Extension shows error: "Authentication window was closed"

## Test 2: API Key Retrieval from Backend

### Objective
Verify that the extension can fetch the OpenAI API key from the backend

### Prerequisites
- User must be logged in (complete Test 1 first)
- Backend `/api/auth/openai-key` endpoint must be implemented

### Steps
1. Ensure you're logged in to the extension
2. Navigate to a supported scientific website (e.g., pubmed.ncbi.nlm.nih.gov)
3. Find a paper and click "Paper analysieren"
4. Open browser console (F12)
5. **Expected Console Logs:**
   ```
   Q‑SCI LLM Evaluator: Fetching API key from backend...
   Q‑SCI LLM Evaluator: API key fetched successfully
   ```
6. **Expected:** Analysis proceeds normally

### Success Criteria
✅ No error about missing API key
✅ Console shows successful API key fetch
✅ Analysis completes successfully
✅ Results are displayed

### Failure Scenarios to Test

#### Scenario 2A: Backend Unavailable
1. Stop backend server or block network to backend
2. Try to analyze a paper
3. **Expected Error:** "Unable to retrieve API key: Unable to fetch API key. Please check your internet connection."

#### Scenario 2B: Not Logged In
1. Log out from extension
2. Try to analyze a paper
3. **Expected Error:** "Please login to use analysis features."

#### Scenario 2C: Invalid/Expired Token
1. Manually clear auth token from storage:
   ```javascript
   chrome.storage.local.remove('qsci_auth_token')
   ```
2. Try to analyze a paper without logging in again
3. **Expected Error:** "Unable to retrieve API key: No authentication token found. Please login first."

## Test 3: Options Page Changes

### Objective
Verify that the options page no longer shows manual API key input

### Steps
1. Click "Einstellungen" button in popup
2. Options page opens in new tab
3. Scroll to "OpenAI API Konfiguration" section

### Expected
✅ No input field for API key
✅ Information text: "Der OpenAI API-Schlüssel wird zentral vom Q-SCI-Backend verwaltet..."
✅ Blue info box: "✓ API-Schlüssel automatisch konfiguriert"
✅ Text explains that API key is automatically retrieved from backend

### Not Expected
❌ Input field for API key
❌ "Save API key" button
❌ Old description about entering API key manually

## Test 4: Paper Analysis End-to-End

### Objective
Complete paper analysis from login to results

### Steps
1. Log in via Clerk (if not already logged in)
2. Navigate to PubMed: https://pubmed.ncbi.nlm.nih.gov/
3. Search for a paper (e.g., "diabetes treatment")
4. Click on a paper to open its detail page
5. Open extension popup
6. **Expected:** Green checkmark showing supported site
7. Click "Paper analysieren"
8. **Expected:** Loading indicator appears
9. Wait for analysis to complete (may take 10-30 seconds)
10. **Expected:** Results appear showing:
    - Quality percentage
    - Journal tier (if available)
    - Quartile (if available)
11. Click "Details anzeigen"
12. **Expected:** Detailed view shows:
    - Positive aspects
    - Negative aspects/areas for improvement
    - Source citations (when available)

### Success Criteria
✅ Analysis starts without API key errors
✅ Loading indicator appears
✅ Results load within reasonable time (< 60 seconds)
✅ Quality score is displayed
✅ Detailed view shows analysis points
✅ Usage counter increments (e.g., from 0/10 to 1/10)

## Test 5: Usage Limits

### Objective
Verify that daily usage limits are enforced

### Test 5A: Free User Limit (10 analyses)
1. Log in as a free user (no subscription)
2. Perform 9 analyses on different papers
3. **Expected:** Usage counter shows 9/10
4. Perform 10th analysis
5. **Expected:** Usage counter shows 10/10
6. Try to perform 11th analysis
7. **Expected Error:** "You have reached your daily limit of 10 analyses. Please subscribe at q-sci.org for more analyses (up to 100 per day)."
8. **Expected:** Upgrade prompt appears in popup

### Test 5B: Subscribed User Limit (100 analyses)
1. Log in as a subscribed user
2. Verify subscription badge shows "Premium"
3. **Expected:** Usage counter shows X/100
4. Perform several analyses
5. **Expected:** Limit is 100, not 10

## Test 6: Multi-Language Support

### Objective
Verify translations work for new features

### Steps
1. Open extension popup
2. Click language selector in top-right
3. Switch from German (DE) to English (EN)
4. **Expected:** All text updates to English
5. Open options page
6. **Expected:** Options page text is in English
7. Check OpenAI API section shows English text
8. Switch back to German
9. **Expected:** All text returns to German

### Success Criteria
✅ Language switcher works in popup
✅ Language switcher works in options page
✅ Language switcher works in Clerk auth page
✅ New API key management text is translated
✅ All UI elements update immediately

## Test 7: Error Recovery

### Objective
Test that users can recover from errors

### Scenario 7A: Network Error During Auth
1. Disconnect from internet
2. Try to log in with Clerk
3. **Expected:** Error message about network issues
4. Reconnect to internet
5. Click retry or try logging in again
6. **Expected:** Login succeeds

### Scenario 7B: Network Error During Analysis
1. Log in successfully
2. Start paper analysis
3. Disconnect from internet during analysis
4. **Expected:** Error message about network issues
5. Reconnect to internet
6. Try analysis again
7. **Expected:** Analysis succeeds

## Test 8: Browser Console Monitoring

### Objective
Monitor for any JavaScript errors

### Steps
1. Open browser console (F12)
2. Clear console
3. Perform complete user flow (login → analyze paper → view results)
4. Check console for errors

### Success Criteria
✅ No JavaScript errors
✅ Only informational logs (starting with "Q-SCI" or "Q‑SCI")
✅ No undefined variable errors
✅ No failed network requests (except when intentionally testing failures)

### Expected Console Logs
```
Q-SCI Debug Popup: Script loaded
Q-SCI Debug Popup: DOM loaded, initializing...
Q-SCI Auth: Module loaded
Q-SCI Clerk Auth: Waiting for Clerk SDK...
Q-SCI Clerk Auth: Clerk initialized successfully
Q‑SCI LLM Evaluator: Fetching API key from backend...
Q‑SCI LLM Evaluator: API key fetched successfully
```

## Test 9: Session Persistence

### Objective
Verify that authentication persists across browser sessions

### Steps
1. Log in to extension
2. Close browser completely
3. Reopen browser
4. Open extension popup
5. **Expected:** Still logged in
6. Try to analyze a paper
7. **Expected:** Analysis works without needing to log in again

### Success Criteria
✅ Auth state persists after browser restart
✅ Can analyze papers without re-login
✅ Usage counter persists and resets at midnight

## Test 10: Backwards Compatibility

### Objective
Ensure old local API keys don't cause issues

### Steps
1. Manually add old API key to storage:
   ```javascript
   chrome.storage.local.set({ openai_api_key: 'sk-old-key-123' })
   ```
2. Log in to extension
3. Try to analyze a paper
4. **Expected:** Extension ignores old key and uses backend key
5. Analysis succeeds

### Success Criteria
✅ Old API keys are ignored
✅ No errors from old storage values
✅ Backend API key takes precedence

## Regression Testing Checklist

Ensure existing functionality still works:
- [ ] Popup opens and displays correctly
- [ ] Settings button opens options page
- [ ] Language switcher works
- [ ] Manual text analysis works
- [ ] Detailed analysis view works
- [ ] Export analysis works
- [ ] Logout works
- [ ] All supported websites are detected correctly
- [ ] PDF analysis toggle works
- [ ] Subscription refresh button works

## Performance Testing

### Metrics to Monitor
- Time to login: Should complete within 10-30 seconds
- Time to fetch API key: Should complete within 1-2 seconds
- Time for analysis: Should complete within 20-60 seconds
- Popup load time: Should be < 1 second

## Security Testing

### Checks
- [ ] Auth token is stored securely in chrome.storage.local
- [ ] API key is never logged to console in production
- [ ] HTTPS is used for all backend requests
- [ ] Clerk token is sent in Authorization header, not URL
- [ ] No sensitive data exposed in error messages

## Troubleshooting

### Issue: Clerk auth stuck at "Loading..."
**Check:**
- Browser console for errors
- Clerk SDK loaded successfully
- Network requests to clerk.accounts.dev are successful
- Pop-up blocker is not blocking auth window

### Issue: "Failed to retrieve API key"
**Check:**
- User is logged in (check chrome.storage.local for qsci_auth_token)
- Backend endpoint is running and accessible
- Backend returns 200 OK response
- OPENAI_API_KEY is set in backend environment

### Issue: "OpenAI API request failed"
**Check:**
- API key retrieved from backend is valid
- OpenAI API is accessible
- API key has sufficient credits
- Request body is properly formatted

## Sign-Off

After completing all tests:
- [ ] All test scenarios pass
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] Error messages are user-friendly
- [ ] Translations work correctly
- [ ] Backend endpoint is deployed
- [ ] Ready for production deployment

Tested by: _______________
Date: _______________
Version: _______________
