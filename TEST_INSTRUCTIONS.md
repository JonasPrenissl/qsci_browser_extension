# Q-SCI Extension - Final Testing Instructions

## ✅ Fixes Applied and Ready for Testing

This document provides step-by-step instructions for testing the two fixes applied to the Q-SCI browser extension.

---

## Fix Summary

### 1. Clerk Authentication Error - FIXED ✅
**Issue:** "Missing signInUrl. A satellite application needs to specify the signInUrl for development instances"
**Fix:** Added `signInUrl` parameter to Clerk initialization in `src/auth.js`

### 2. Analyze Button Not Working - FIXED ✅  
**Issue:** Analyze button was disabled on non-supported sites, preventing analysis
**Fix:** Modified `showPageStatus()` in `popup.js` to keep button enabled for logged-in users

---

## Quick Test Instructions

### Step 1: Load Extension in Chrome
1. Open Chrome and navigate to: `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select this directory: `/home/runner/work/qsci_browser_extension/qsci_browser_extension`

### Step 2: Test Authentication
1. Click Q-SCI icon in Chrome toolbar
2. Click "🔐 Mit Clerk anmelden" button
3. **Expected:** Auth popup opens WITHOUT "Missing signInUrl" error
4. Complete login process
5. **Expected:** User status is displayed in popup (email, subscription)

### Step 3: Test Analyze Button (Supported Site)
1. Go to: https://pubmed.ncbi.nlm.nih.gov/35917817/
2. Open Q-SCI extension popup
3. **Expected:** "Paper analysieren" button is enabled
4. Click the analyze button
5. **Expected:** Analysis starts and completes successfully

### Step 4: Test Analyze Button (Unsupported Site)
1. Go to: https://www.google.com
2. Open Q-SCI extension popup
3. **Expected:** "Paper analysieren" button is STILL ENABLED
4. Scroll to "Manuelle Analyse" section
5. Paste some text and click "Text analysieren"
6. **Expected:** Manual analysis works

---

## Debugging Console Logs

If you need to debug, open DevTools on the popup (right-click popup → Inspect) and look for these logs:

### Successful Authentication Flow:
```
Q-SCI Debug Popup: DOM loaded, initializing...
Q-SCI Debug Popup: Initializing authentication...
Q-SCI Clerk Auth: Initializing Clerk...
Q-SCI Clerk Auth: Loading Clerk SDK...
Q-SCI Clerk Auth: Clerk initialized successfully
```

### Successful Analysis Flow:
```
Q-SCI Debug Popup: Analyze button clicked
Q-SCI Debug Popup: Starting simplified page analysis...
Q-SCI Debug Popup: Current user: [email]
Q-SCI Debug Popup: Usage check passed
Q-SCI Debug Popup: Calling qsciEvaluatePaper...
Q-SCI Debug Popup: Evaluation result: [object]
```

---

## What Changed

### File: src/auth.js (Line 125-139)
```javascript
await clerk.load({
  isSatellite: true,
  signInUrl: AUTH_CALLBACK_URL,      // ← ADDED
  signUpUrl: AUTH_CALLBACK_URL,      // ← ADDED
  // ... other parameters
});
```

### File: popup.js (Line 523-536)
```javascript
function showPageStatus(message, canAnalyze) {
  // ... status message code ...
  
  // Only disable if NOT logged in (CHANGED)
  if (elements.analyzeBtn && !currentUser) {
    elements.analyzeBtn.disabled = !canAnalyze;
    elements.analyzeBtn.style.opacity = canAnalyze ? '1' : '0.5';
  }
}
```

---

## Success Criteria

✅ Authentication works without "Missing signInUrl" error
✅ Analyze button is enabled after login
✅ Analyze button works on supported sites
✅ Analyze button stays enabled on unsupported sites
✅ Manual text analysis is accessible

---

## Files Modified

- `src/auth.js` - Added signInUrl to Clerk initialization
- `dist/js/bundle-auth.js` - Rebuilt bundle with fix
- `popup.js` - Modified showPageStatus() logic
- `FIXES_APPLIED.md` - Detailed documentation
- `TEST_INSTRUCTIONS.md` - This file

---

## Ready for Production?

After successful testing:
1. Update `clerk-config.js` with production Clerk key (pk_live_...)
2. Run `npm run build` to rebuild with production key
3. Deploy to Chrome Web Store

For questions or issues, check the detailed logs in the browser console.
