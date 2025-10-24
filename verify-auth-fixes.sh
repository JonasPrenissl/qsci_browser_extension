#!/bin/bash

# Q-SCI Authentication Fixes Verification Script
# This script verifies that the authentication fixes are properly applied

echo "🔍 Q-SCI Authentication Fixes Verification"
echo "=========================================="
echo ""

ERRORS=0

# Check 1: Verify chrome.storage is saved before window close in src/auth.js
echo "✓ Check 1: Verify chrome.storage save in src/auth.js"
if grep -q "ALWAYS store auth data in chrome.storage first" src/auth.js; then
  echo "  ✅ Found chrome.storage save before window close"
else
  echo "  ❌ Missing chrome.storage save in src/auth.js"
  ERRORS=$((ERRORS + 1))
fi

# Check 2: Verify multiple postMessage retries in src/auth.js
echo "✓ Check 2: Verify multiple postMessage retries in src/auth.js"
if grep -q "for (let i = 0; i < 3; i++)" src/auth.js; then
  echo "  ✅ Found postMessage retry loop"
else
  echo "  ❌ Missing postMessage retry loop in src/auth.js"
  ERRORS=$((ERRORS + 1))
fi

# Check 3: Verify window close delay is increased to 2000ms in src/auth.js
echo "✓ Check 3: Verify window close delay in src/auth.js"
if grep -q "}, 2000);" src/auth.js; then
  echo "  ✅ Found 2000ms window close delay"
else
  echo "  ❌ Missing or incorrect window close delay in src/auth.js"
  ERRORS=$((ERRORS + 1))
fi

# Check 4: Verify storage check on window close in auth.js
echo "✓ Check 4: Verify storage check on window close in auth.js"
if grep -q "Auth window closed, checking for stored credentials" auth.js; then
  echo "  ✅ Found storage check on window close"
else
  echo "  ❌ Missing storage check on window close in auth.js"
  ERRORS=$((ERRORS + 1))
fi

# Check 5: Verify fallback credential check in popup.js
echo "✓ Check 5: Verify fallback credential check in popup.js"
if grep -q "Found stored credentials despite error" popup.js; then
  echo "  ✅ Found fallback credential check in popup.js"
else
  echo "  ❌ Missing fallback credential check in popup.js"
  ERRORS=$((ERRORS + 1))
fi

# Check 6: Verify chrome.storage save in src/clerk-auth-main.js
echo "✓ Check 6: Verify chrome.storage save in src/clerk-auth-main.js"
if grep -q "ALWAYS store auth data in chrome.storage first" src/clerk-auth-main.js; then
  echo "  ✅ Found chrome.storage save in src/clerk-auth-main.js"
else
  echo "  ❌ Missing chrome.storage save in src/clerk-auth-main.js"
  ERRORS=$((ERRORS + 1))
fi

# Check 7: Verify bundle was rebuilt
echo "✓ Check 7: Verify bundle was rebuilt"
if [ -f "dist/js/bundle-auth.js" ]; then
  BUNDLE_SIZE=$(wc -c < dist/js/bundle-auth.js)
  # Minimum expected bundle size (includes Clerk SDK and auth logic)
  # A properly built bundle with Clerk SDK should be > 1MB
  MIN_BUNDLE_SIZE=1000000
  if [ "$BUNDLE_SIZE" -gt "$MIN_BUNDLE_SIZE" ]; then
    echo "  ✅ Bundle exists and is properly sized ($BUNDLE_SIZE bytes)"
  else
    echo "  ⚠️  Bundle exists but may be incomplete ($BUNDLE_SIZE bytes)"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "  ❌ Bundle does not exist"
  ERRORS=$((ERRORS + 1))
fi

echo ""
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
  echo "✅ All checks passed! Authentication fixes are properly applied."
  exit 0
else
  echo "❌ $ERRORS check(s) failed. Please review the fixes."
  exit 1
fi
