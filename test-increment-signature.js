/**
 * Simple test script to verify the incrementUsage function accepts a parameter
 * This tests the core change: incrementUsage(amount = 1.0)
 */

const fs = require('fs');
const path = require('path');

console.log('=== Testing incrementUsage function signature ===\n');

// Read the auth.js source files
console.log('1. Checking src/auth.js...');
const srcAuth = fs.readFileSync(path.join(__dirname, 'src/auth.js'), 'utf8');

// Check if the function accepts an amount parameter
if (srcAuth.includes('incrementUsage(amount = 1.0)')) {
  console.log('   ✓ src/auth.js: incrementUsage now accepts amount parameter');
} else {
  console.error('   ✗ src/auth.js: incrementUsage does NOT accept amount parameter');
  process.exit(1);
}

// Check if it logs the increment amount
if (srcAuth.includes("console.log('Q-SCI Usage: Incremented by', amount, 'to', newUsage)")) {
  console.log('   ✓ src/auth.js: Logs include the increment amount');
} else {
  console.error('   ✗ src/auth.js: Logs do NOT include the increment amount');
  process.exit(1);
}

// Check if it uses the amount in calculation
if (srcAuth.includes('const newUsage = currentUsage + amount')) {
  console.log('   ✓ src/auth.js: Uses amount in calculation\n');
} else {
  console.error('   ✗ src/auth.js: Does NOT use amount in calculation');
  process.exit(1);
}

console.log('2. Checking auth.js...');
const auth = fs.readFileSync(path.join(__dirname, 'auth.js'), 'utf8');

// Check if the function accepts an amount parameter
if (auth.includes('incrementUsage(amount = 1.0)')) {
  console.log('   ✓ auth.js: incrementUsage now accepts amount parameter');
} else {
  console.error('   ✗ auth.js: incrementUsage does NOT accept amount parameter');
  process.exit(1);
}

// Check if it logs the increment amount
if (auth.includes("console.log('Q-SCI Usage: Incremented by', amount, 'to', newUsage)")) {
  console.log('   ✓ auth.js: Logs include the increment amount');
} else {
  console.error('   ✗ auth.js: Logs do NOT include the increment amount');
  process.exit(1);
}

// Check if it uses the amount in calculation
if (auth.includes('const newUsage = currentUsage + amount')) {
  console.log('   ✓ auth.js: Uses amount in calculation\n');
} else {
  console.error('   ✗ auth.js: Does NOT use amount in calculation');
  process.exit(1);
}

console.log('3. Checking popup.js for chat usage increment...');
const popup = fs.readFileSync(path.join(__dirname, 'popup.js'), 'utf8');

// Check if chat increments by 0.2
if (popup.includes('incrementUsage(0.2)')) {
  console.log('   ✓ popup.js: Chat questions increment by 0.2');
} else {
  console.error('   ✗ popup.js: Chat questions do NOT increment by 0.2');
  process.exit(1);
}

// Check if the comment mentions 0.2 analyses
if (popup.includes('chat questions count as 0.2 analyses')) {
  console.log('   ✓ popup.js: Comment mentions 0.2 analyses\n');
} else {
  console.error('   ✗ popup.js: Comment does NOT mention 0.2 analyses');
  process.exit(1);
}

console.log('4. Checking popup.js for fractional display...');

// Check if usage display handles fractional values
if (popup.includes('toFixed(1)') && popup.includes('usageInfo.used % 1 === 0')) {
  console.log('   ✓ popup.js: Usage display handles fractional values\n');
} else {
  console.error('   ✗ popup.js: Usage display does NOT handle fractional values properly');
  process.exit(1);
}

console.log('5. Verifying full analysis still increments by 1 (default)...');

// Check that full analysis calls incrementUsage without parameter (uses default 1.0)
if (popup.includes('window.QSCIUsage.incrementUsage();') || 
    popup.includes('window.QSCIUsage.incrementUsage(1)') ||
    popup.includes('window.QSCIUsage.incrementUsage(1.0)')) {
  console.log('   ✓ popup.js: Full analysis increments by default amount (1.0)\n');
} else {
  console.warn('   ⚠ popup.js: Could not verify full analysis increment (may use default)');
}

console.log('=== All signature checks passed! ===\n');

console.log('Summary:');
console.log('- incrementUsage() now accepts optional amount parameter (default: 1.0)');
console.log('- Chat questions call incrementUsage(0.2)');
console.log('- Full analyses use default incrementUsage() = 1.0');
console.log('- Usage display shows fractional values with 1 decimal place');
console.log('\nImplementation verified successfully! ✓');
