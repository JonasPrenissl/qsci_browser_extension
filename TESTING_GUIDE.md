# Testing Guide: Analysis Continuation and Timeout Fixes

## Overview
This guide helps test the fixes for two critical issues:
1. Analysis stops when user switches tabs
2. Timeout errors on complex papers (The Lancet)

## Changes Summary
- API timeout increased: 30s → 120s
- Analysis moved to background service worker
- Analysis continues when popup is closed
- Progress restored when popup reopens

---

## Setup

### 1. Load the Extension
```
1. Open Chrome
2. Navigate to chrome://extensions
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the extension directory
6. Extension should appear in the list
```

### 2. Verify Extension Loaded
```
- Check for Q-SCI icon in Chrome toolbar
- Click icon to open popup
- You should see the login screen or analysis interface
```

---

## Test Cases

### Test 1: The Lancet Website (Primary Issue)
**Purpose**: Verify no timeout on complex papers with PDFs

**Steps**:
1. Navigate to: https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(25)01176-6/fulltext
2. Open Q-SCI extension popup
3. Ensure you're logged in
4. Click "Analyze" button
5. Observe the progress indicators
6. Wait for analysis to complete (should be < 120 seconds)

**Expected Results**:
- ✅ Analysis starts successfully
- ✅ Loading progress shows various stages
- ✅ Analysis completes within 120 seconds
- ✅ No "Request timed out after 30 seconds" error
- ✅ Results display correctly
- ✅ Quality score and analysis appear

**Failure Indicators**:
- ❌ "Request timed out" error before 120 seconds
- ❌ Analysis hangs indefinitely
- ❌ Error messages about failed extraction

---

### Test 2: Tab Switching During Analysis (Primary Issue)
**Purpose**: Verify analysis continues when user switches tabs

**Steps**:
1. Navigate to any scientific paper (PubMed, arXiv, etc.)
2. Open Q-SCI extension popup
3. Click "Analyze" button
4. Wait 5 seconds for analysis to start
5. **Switch to a different tab** (e.g., open a new tab)
6. Wait 30-60 seconds
7. Return to the original paper tab
8. Reopen Q-SCI extension popup

**Expected Results**:
- ✅ Analysis starts in original tab
- ✅ When you switch tabs, analysis continues in background
- ✅ When you return and reopen popup, one of:
  - Analysis is still running (shows progress)
  - Analysis completed (shows results)
- ✅ Results display correctly
- ✅ No errors about analysis being interrupted

**Failure Indicators**:
- ❌ Analysis stops when tab is switched
- ❌ No progress shown when returning
- ❌ Must restart analysis from beginning
- ❌ "Analysis failed" error on return

---

### Test 3: Popup Close During Analysis
**Purpose**: Verify analysis continues when popup is closed

**Steps**:
1. Navigate to any scientific paper
2. Open Q-SCI extension popup
3. Click "Analyze" button
4. Wait 5 seconds for analysis to start
5. **Close the popup** (click outside it or press Escape)
6. Wait 30 seconds
7. Reopen Q-SCI extension popup

**Expected Results**:
- ✅ Analysis starts
- ✅ Popup closes normally
- ✅ When reopened, shows:
  - "Analysis in progress..." with progress bar, OR
  - Completed analysis results
- ✅ Results display correctly

**Failure Indicators**:
- ❌ "No analysis found" when reopening
- ❌ Must restart analysis
- ❌ Error messages

---

### Test 4: Quick Analysis (Regression Test)
**Purpose**: Verify existing functionality still works

**Steps**:
1. Navigate to a simple paper (e.g., PubMed abstract)
2. Open Q-SCI extension popup
3. Click "Analyze" button
4. **Do NOT switch tabs or close popup**
5. Wait for analysis to complete

**Expected Results**:
- ✅ Analysis completes quickly (< 30 seconds for abstracts)
- ✅ Loading progress shows smoothly
- ✅ Results display correctly
- ✅ No changes in user experience from before

**Failure Indicators**:
- ❌ Analysis takes longer than before
- ❌ UI doesn't update smoothly
- ❌ Unexpected errors

---

## Debugging

### Check Background Worker Logs
```
1. Open Chrome DevTools (F12)
2. Go to "Console" tab
3. Filter for "Q-SCI Background:"
4. Look for:
   - "Service worker starting..."
   - "Starting analysis in background..."
   - "Evaluation completed:"
```

### Check Popup Logs
```
1. Right-click extension icon
2. Select "Inspect popup"
3. Go to "Console" tab
4. Look for:
   - "Q-SCI Debug Popup:"
   - Analysis flow messages
   - Progress updates
```

### Check Storage
```
1. Open Chrome DevTools
2. Go to "Application" tab
3. Expand "Storage" > "Local Storage"
4. Click on "chrome-extension://[extension-id]"
5. Look for:
   - qsci_current_analysis_state
   - qsci_current_analysis
```

---

## Success Metrics

### Must Pass:
- ✅ The Lancet paper analyzes without timeout
- ✅ Tab switching doesn't interrupt analysis
- ✅ Popup close doesn't interrupt analysis
- ✅ Results restored when returning to tab

### Should Work:
- ✅ All existing features still work
- ✅ No performance degradation
- ✅ UI updates smoothly
- ✅ Error messages are clear

---

## Expected Behavior Summary

### Normal Flow:
```
User clicks Analyze
    ↓
Popup extracts content
    ↓
Popup sends to background worker
    ↓
Background worker starts analysis
    ↓
Popup polls every 500ms
    ↓
User can switch tabs (analysis continues)
    ↓
When user returns, popup shows progress/results
    ↓
Analysis completes (max 120s)
    ↓
Results displayed
```

### State Transitions:
```
No analysis → running → complete → displayed → cleared
                    ↘ error → displayed → cleared
```
