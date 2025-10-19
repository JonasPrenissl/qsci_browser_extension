# Troubleshooting: "Nothing Happens" When Clicking Analyze

This guide helps diagnose and fix the issue where clicking the "Analyze Paper" button results in no visible action.

## Quick Diagnosis Steps

### Step 1: Open Browser Console

1. With the extension popup open, press `F12` or right-click and select "Inspect"
2. Go to the Console tab
3. Click "Analyze Paper" button
4. Look for console messages

### Step 2: Check Console Messages

Look for these specific log messages:

#### ✅ Expected Flow (Working):
```
Q-SCI Debug Popup: Analyze button clicked
Q-SCI Debug Popup: Starting simplified page analysis...
Q-SCI Debug Popup: Current user: user@example.com
Q-SCI Debug Popup: About to call window.qsciEvaluatePaper
Q-SCI LLM Evaluator: Starting evaluation...
Q-SCI LLM Evaluator: Fetching API key from backend...
Q-SCI Auth: getOpenAIApiKey() called
Q-SCI Auth: Fetching OpenAI API key from backend...
Q-SCI Auth: Backend response status: 200
Q-SCI Auth: OpenAI API key fetched successfully
Q-SCI LLM Evaluator: API key fetched successfully
[Analysis completes...]
```

#### ❌ Common Error Patterns:

##### Pattern 1: Backend Not Configured (404)
```
Q-SCI Auth: Backend response status: 404
❌ Backend endpoint not found (404). The /api/auth/openai-key endpoint needs to be deployed to Vercel.
```

**Fix:**
- Deploy the backend endpoint to Vercel
- See `VERCEL_DEPLOYMENT_CHECKLIST.md` for setup instructions
- Verify endpoint exists at `https://www.q-sci.org/api/auth/openai-key`

##### Pattern 2: API Key Not Set (500)
```
Q-SCI Auth: Backend response status: 500
❌ Backend server error (500). The OPENAI_API_KEY environment variable may not be set on Vercel.
```

**Fix:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `OPENAI_API_KEY` with your OpenAI API key
3. Redeploy the application
4. Try analyzing again

##### Pattern 3: Authentication Failed (401)
```
Q-SCI Auth: Backend response status: 401
❌ Authentication failed (401). Your session may have expired.
```

**Fix:**
1. Click "Logout" button in extension
2. Click "Login with Clerk" button
3. Complete authentication
4. Try analyzing again

##### Pattern 4: Not Logged In
```
Q-SCI Debug Popup: No current user, showing error
❌ Please login to use analysis features.
```

**Fix:**
1. Click "Login with Clerk" button
2. Complete authentication
3. Try analyzing again

##### Pattern 5: No Console Messages At All
```
[No messages appear]
```

**Fix:**
- The extension may not be loaded properly
- Try reloading the extension:
  1. Go to `chrome://extensions/`
  2. Find "Q-SCI: Scientific Paper Quality Evaluator"
  3. Click the refresh icon
  4. Reload the current page
  5. Open extension popup and try again

### Step 3: Check Button State

In the extension popup:

1. Is the "Analyze Paper" button enabled (not grayed out)?
   - ❌ **Grayed out**: You may be on an unsupported site
   - ✅ **Enabled**: Button should work

2. Is there a page status message?
   - "❌ Not a supported site" → Navigate to a scientific site (PubMed, arXiv, etc.)
   - "✅ Scientific site detected" → Button should work

3. Are you logged in?
   - Check if you see "Logged in as: [email]"
   - If not, click "Login with Clerk"

## Detailed Troubleshooting

### Issue: Button Click Does Nothing

**Symptoms:**
- Button is enabled
- Clicking it produces no effect
- No error messages visible

**Diagnosis:**

1. Open browser DevTools (F12) → Console
2. Filter console to show only errors: Click the filter icon and select "Errors"
3. Click "Analyze Paper"
4. Check for any JavaScript errors

**Common Causes:**

1. **Scripts Not Loaded**
   - Check for errors loading `auth.js`, `qsci_evaluator.js`, or `popup.js`
   - Reload extension: `chrome://extensions/` → Click refresh icon

2. **Backend Unreachable**
   - Check network tab in DevTools
   - Look for failed request to `https://www.q-sci.org/api/auth/openai-key`
   - Verify backend is deployed and accessible

3. **CORS Issues**
   - Check console for CORS-related errors
   - Backend needs to include CORS headers
   - See `VERCEL_DEPLOYMENT_CHECKLIST.md` for CORS setup

### Issue: Loading Spinner Shows But Nothing Happens

**Symptoms:**
- "Analyzing..." message appears
- Loading spinner visible
- Eventually times out or hangs

**Diagnosis:**

Check console for error messages about:
- Network timeouts
- OpenAI API errors
- Backend connectivity issues

**Common Causes:**

1. **OpenAI API Key Invalid**
   - Verify API key in Vercel environment variables
   - Test key with OpenAI API directly

2. **Network Timeout**
   - Check internet connection
   - Verify OpenAI API is accessible
   - Check if firewall/proxy is blocking requests

3. **Backend Timeout**
   - Backend may be slow to respond
   - Check Vercel function logs for errors

### Issue: Error Message Appears But Disappears Quickly

**Symptoms:**
- Red error message flashes briefly
- Message disappears before you can read it

**Fix:**

Error messages now stay visible longer (8-15 seconds) for critical errors. If you still miss it:

1. Check browser console for the error message
2. All errors are logged with prefix `Q-SCI Debug Popup: Showing error:`
3. Look for the most recent error message

### Issue: Analysis Works on Some Sites But Not Others

**Symptoms:**
- Analysis works on PubMed but not on other sites
- Different behavior on different scientific sites

**Diagnosis:**

This is expected behavior. The extension:
- Only works on supported scientific sites (see manifest.json for list)
- Requires sufficient text content to analyze
- Some sites may have access restrictions

**Supported Sites Include:**
- PubMed (pubmed.ncbi.nlm.nih.gov)
- PMC (pmc.ncbi.nlm.nih.gov)
- arXiv (arxiv.org)
- Nature, Science, Cell, Lancet, and many others

**Fix:**
- Use the "Manual Analysis" feature to analyze text from any site
- Paste abstract/content into the text area
- Click "Analyze Text"

## Testing Checklist

Use this checklist to verify everything is working:

- [ ] Extension is loaded and visible in browser toolbar
- [ ] Can open extension popup
- [ ] Can see login button if not logged in
- [ ] Can complete Clerk authentication
- [ ] User email shown after login
- [ ] Navigate to PubMed article: https://pubmed.ncbi.nlm.nih.gov/36977144/
- [ ] Extension shows "✅ Scientific site detected"
- [ ] "Analyze Paper" button is enabled
- [ ] Click "Analyze Paper"
- [ ] Loading message appears
- [ ] Console shows API key fetch logs
- [ ] Analysis completes with results
- [ ] Quality score is displayed
- [ ] Can view detailed results

## Still Having Issues?

If you've tried all the above and still experiencing issues:

### Collect Debug Information

1. **Browser Console Output:**
   - Open DevTools → Console
   - Clear console
   - Click "Analyze Paper"
   - Copy all console messages

2. **Network Tab:**
   - Open DevTools → Network
   - Filter by "openai"
   - Click "Analyze Paper"
   - Screenshot any failed requests

3. **Extension Version:**
   - Go to `chrome://extensions/`
   - Find Q-SCI extension
   - Note the version number

4. **Backend Status:**
   - Try accessing: `https://www.q-sci.org/api/auth/openai-key`
   - Note the response (should be 401 without authentication)

### Report the Issue

Include in your bug report:
- Console output (from step 1)
- Network tab screenshots (from step 2)
- Extension version (from step 3)
- Backend status (from step 4)
- Operating system and browser version
- Steps to reproduce

## Quick Fixes Summary

| Symptom | Quick Fix |
|---------|-----------|
| Button grayed out | Navigate to supported site (e.g., PubMed) |
| Not logged in | Click "Login with Clerk" |
| 404 error | Deploy backend endpoint to Vercel |
| 500 error | Set OPENAI_API_KEY in Vercel env variables |
| 401 error | Logout and login again |
| No console logs | Reload extension at chrome://extensions/ |
| CORS error | Add CORS headers to backend |
| Analysis timeout | Check OpenAI API status |

## Prevention

To avoid issues in the future:

1. **Keep extension updated** - Check for updates regularly
2. **Verify backend is deployed** - Test endpoint periodically
3. **Monitor Vercel logs** - Check for backend errors
4. **Test after Vercel deployments** - Ensure changes don't break functionality
5. **Check OpenAI API status** - Visit status.openai.com if issues occur

## Related Documentation

- `VERCEL_DEPLOYMENT_CHECKLIST.md` - Backend setup guide
- `BACKEND_OPENAI_KEY_ENDPOINT.md` - Endpoint implementation details
- `TESTING_GUIDE.md` - Comprehensive testing procedures
