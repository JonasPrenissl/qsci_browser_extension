#!/usr/bin/env node

/**
 * Verification script to check if the improvements are in place
 * This script checks the key changes made to improve error handling
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying improvements to analyze functionality...\n');

let allChecksPassed = true;

// Check 1: Verify popup.js has enhanced error handling
console.log('✓ Checking popup.js for enhanced error handling...');
const popupJs = fs.readFileSync(path.join(__dirname, 'popup.js'), 'utf8');

const popupChecks = [
  { name: 'Extended error timeout to 30 seconds', regex: /30000/, found: false },
  { name: 'Added stack trace logging in showError', regex: /new Error\(\)\.stack/, found: false },
  { name: 'Enhanced logging in analyzePage with START/END markers', regex: /STARTING ANALYSIS/, found: false },
  { name: 'Detailed console logging for evaluation results', regex: /positiveAspectsCount:.*evaluation/, found: false },
  { name: 'Manual text analysis has detailed logging', regex: /STARTING MANUAL TEXT ANALYSIS/, found: false }
];

popupChecks.forEach(check => {
  if (check.regex.test(popupJs)) {
    console.log(`  ✅ ${check.name}`);
    check.found = true;
  } else {
    console.log(`  ❌ ${check.name}`);
    allChecksPassed = false;
  }
});

// Check 2: Verify qsci_evaluator.js has improved error messages
console.log('\n✓ Checking qsci_evaluator.js for improved error messages...');
const evaluatorJs = fs.readFileSync(path.join(__dirname, 'qsci_evaluator.js'), 'utf8');

const evaluatorChecks = [
  { name: 'Error message for 404 (endpoint not found)', regex: /endpoint not found.*BACKEND_QUICK_SETUP/, found: false },
  { name: 'Error message for 500 (server error)', regex: /server error.*OPENAI_API_KEY environment variable/, found: false },
  { name: 'Error message for 401 (authentication)', regex: /Authentication failed.*logout and login/, found: false },
  { name: 'Error message for network errors', regex: /Unable to connect.*internet connection/, found: false },
  { name: 'User-friendly error message logic', regex: /userFriendlyMessage/, found: false }
];

evaluatorChecks.forEach(check => {
  if (check.regex.test(evaluatorJs)) {
    console.log(`  ✅ ${check.name}`);
    check.found = true;
  } else {
    console.log(`  ❌ ${check.name}`);
    allChecksPassed = false;
  }
});

// Check 3: Verify build output exists
console.log('\n✓ Checking build output...');
const distFiles = [
  'dist/js/bundle-auth.js',
  'popup.js',
  'qsci_evaluator.js',
  'auth.js',
  'manifest.json'
];

distFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file} exists`);
  } else {
    console.log(`  ❌ ${file} missing`);
    allChecksPassed = false;
  }
});

// Summary
console.log('\n' + '='.repeat(60));
if (allChecksPassed) {
  console.log('✅ All verification checks passed!');
  console.log('\nThe improvements are in place:');
  console.log('  • Error messages now stay visible for 30 seconds (critical errors)');
  console.log('  • Error messages are more specific and actionable');
  console.log('  • Comprehensive logging helps with debugging');
  console.log('  • Clear guidance on how to fix each error type');
  console.log('\n📝 Next Steps:');
  console.log('  1. Deploy the backend endpoint /api/auth/openai-key');
  console.log('  2. Set the OPENAI_API_KEY environment variable in Vercel');
  console.log('  3. Test the extension with a real backend');
  console.log('  4. Check browser console logs for detailed debugging info');
  process.exit(0);
} else {
  console.log('❌ Some verification checks failed!');
  console.log('\nPlease review the output above and fix any issues.');
  process.exit(1);
}
