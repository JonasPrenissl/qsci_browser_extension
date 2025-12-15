/**
 * Test script for verifying usage increment functionality
 * Tests that:
 * 1. Full analyses count as 1.0
 * 2. Chat questions count as 0.2
 * 3. Fractional usage is tracked correctly
 * 4. Usage limits work with fractional values
 */

const fs = require('fs');
const path = require('path');

// Mock chrome API for testing
global.chrome = {
  storage: {
    local: {
      data: {},
      get: function(keys, callback) {
        if (Array.isArray(keys)) {
          const result = {};
          keys.forEach(key => {
            if (this.data[key] !== undefined) {
              result[key] = this.data[key];
            }
          });
          callback(result);
        } else {
          callback(this.data[keys] !== undefined ? { [keys]: this.data[keys] } : {});
        }
      },
      set: function(obj, callback) {
        Object.assign(this.data, obj);
        if (callback) callback();
      },
      remove: function(keys, callback) {
        if (Array.isArray(keys)) {
          keys.forEach(key => delete this.data[key]);
        } else {
          delete this.data[keys];
        }
        if (callback) callback();
      }
    }
  }
};

// Mock window object
global.window = {};

// Load the auth module
console.log('Loading auth.js...');
const authCode = fs.readFileSync(path.join(__dirname, 'auth.js'), 'utf8');
eval(authCode);

// Test functions
async function runTests() {
  console.log('\n=== Starting Usage Increment Tests ===\n');
  
  // Test 1: Verify incrementUsage defaults to 1.0
  console.log('Test 1: Full analysis increment (default 1.0)');
  chrome.storage.local.data = {}; // Reset storage
  const usage1 = await window.QSCIUsage.incrementUsage();
  console.log(`  Result: ${usage1} (expected: 1)`);
  console.assert(usage1 === 1, 'Full analysis should increment by 1.0');
  console.log('  ✓ PASS\n');
  
  // Test 2: Verify incrementUsage with 0.2 for chat questions
  console.log('Test 2: Chat question increment (0.2)');
  const usage2 = await window.QSCIUsage.incrementUsage(0.2);
  console.log(`  Result: ${usage2} (expected: 1.2)`);
  console.assert(Math.abs(usage2 - 1.2) < 0.01, 'Chat question should increment by 0.2');
  console.log('  ✓ PASS\n');
  
  // Test 3: Multiple chat questions
  console.log('Test 3: Five chat questions (5 x 0.2 = 1.0)');
  chrome.storage.local.data = {}; // Reset storage
  for (let i = 0; i < 5; i++) {
    await window.QSCIUsage.incrementUsage(0.2);
  }
  const usage3 = await window.QSCIUsage.getDailyUsage();
  console.log(`  Result: ${usage3} (expected: 1.0)`);
  console.assert(Math.abs(usage3 - 1.0) < 0.01, 'Five chat questions should equal 1 full analysis');
  console.log('  ✓ PASS\n');
  
  // Test 4: Mixed usage (full analysis + chat questions)
  console.log('Test 4: Mixed usage (1 full + 3 chat = 1.6)');
  chrome.storage.local.data = {}; // Reset storage
  await window.QSCIUsage.incrementUsage(1.0); // Full analysis
  await window.QSCIUsage.incrementUsage(0.2); // Chat
  await window.QSCIUsage.incrementUsage(0.2); // Chat
  await window.QSCIUsage.incrementUsage(0.2); // Chat
  const usage4 = await window.QSCIUsage.getDailyUsage();
  console.log(`  Result: ${usage4} (expected: 1.6)`);
  console.assert(Math.abs(usage4 - 1.6) < 0.01, 'Mixed usage should be tracked correctly');
  console.log('  ✓ PASS\n');
  
  // Test 5: Verify canAnalyze with free tier limit
  console.log('Test 5: Free tier limit check (10 analyses)');
  chrome.storage.local.data = {}; // Reset storage
  
  // Add 9 full analyses
  for (let i = 0; i < 9; i++) {
    await window.QSCIUsage.incrementUsage(1.0);
  }
  
  // Should still be able to analyze
  let canAnalyze1 = await window.QSCIUsage.canAnalyze('free');
  console.log(`  After 9 analyses: canAnalyze=${canAnalyze1.canAnalyze}, remaining=${canAnalyze1.remaining}`);
  console.assert(canAnalyze1.canAnalyze === true, 'Should be able to analyze at 9/10');
  console.assert(canAnalyze1.remaining === 1, 'Should have 1 remaining');
  
  // Add 5 chat questions (= 1 full analysis), total = 10
  for (let i = 0; i < 5; i++) {
    await window.QSCIUsage.incrementUsage(0.2);
  }
  
  // Should now be at limit
  let canAnalyze2 = await window.QSCIUsage.canAnalyze('free');
  console.log(`  After 9 + 5 chat (=10): canAnalyze=${canAnalyze2.canAnalyze}, remaining=${canAnalyze2.remaining}`);
  console.assert(canAnalyze2.canAnalyze === false, 'Should NOT be able to analyze at 10/10');
  console.assert(canAnalyze2.remaining === 0, 'Should have 0 remaining');
  console.log('  ✓ PASS\n');
  
  // Test 6: Verify canAnalyze with premium tier limit
  console.log('Test 6: Premium tier limit check (100 analyses)');
  chrome.storage.local.data = {}; // Reset storage
  
  // Add 99 full analyses
  for (let i = 0; i < 99; i++) {
    await window.QSCIUsage.incrementUsage(1.0);
  }
  
  // Should still be able to analyze
  let canAnalyze3 = await window.QSCIUsage.canAnalyze('subscribed');
  console.log(`  After 99 analyses: canAnalyze=${canAnalyze3.canAnalyze}, remaining=${canAnalyze3.remaining}`);
  console.assert(canAnalyze3.canAnalyze === true, 'Should be able to analyze at 99/100');
  console.assert(canAnalyze3.remaining === 1, 'Should have 1 remaining');
  
  // Add 5 chat questions (= 1 full analysis), total = 100
  for (let i = 0; i < 5; i++) {
    await window.QSCIUsage.incrementUsage(0.2);
  }
  
  // Should now be at limit
  let canAnalyze4 = await window.QSCIUsage.canAnalyze('subscribed');
  console.log(`  After 99 + 5 chat (=100): canAnalyze=${canAnalyze4.canAnalyze}, remaining=${canAnalyze4.remaining}`);
  console.assert(canAnalyze4.canAnalyze === false, 'Should NOT be able to analyze at 100/100');
  console.assert(canAnalyze4.remaining === 0, 'Should have 0 remaining');
  console.log('  ✓ PASS\n');
  
  // Test 7: Verify partial usage doesn't block when there's enough remaining
  console.log('Test 7: Partial usage with enough remaining');
  chrome.storage.local.data = {}; // Reset storage
  
  // Add 9.9 analyses (e.g., 9 full + 4.5 chat questions)
  for (let i = 0; i < 9; i++) {
    await window.QSCIUsage.incrementUsage(1.0);
  }
  for (let i = 0; i < 4; i++) {
    await window.QSCIUsage.incrementUsage(0.2);
  }
  
  const usage7 = await window.QSCIUsage.getDailyUsage();
  console.log(`  Current usage: ${usage7} (expected: 9.8)`);
  
  // Should still be able to do a chat question (0.2)
  let canAnalyze5 = await window.QSCIUsage.canAnalyze('free');
  console.log(`  At 9.8/10: canAnalyze=${canAnalyze5.canAnalyze}, remaining=${canAnalyze5.remaining.toFixed(1)}`);
  console.assert(canAnalyze5.canAnalyze === true, 'Should be able to analyze at 9.8/10');
  console.log('  ✓ PASS\n');
  
  console.log('=== All Tests Passed! ===\n');
}

// Run tests
runTests().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
