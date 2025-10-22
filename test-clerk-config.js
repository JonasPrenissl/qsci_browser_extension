#!/usr/bin/env node
/**
 * Test script to verify that clerk-config.js is properly configured
 * and the build produces a valid bundle with a Clerk publishable key.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Clerk Configuration...\n');

let exitCode = 0;

// Test 1: Check if clerk-config.js exists
console.log('Test 1: Checking if clerk-config.js exists...');
const clerkConfigPath = path.join(__dirname, 'clerk-config.js');
if (!fs.existsSync(clerkConfigPath)) {
  console.error('❌ FAIL: clerk-config.js not found');
  exitCode = 1;
} else {
  console.log('✅ PASS: clerk-config.js exists');
}

// Test 2: Check if clerk-config.js is valid JavaScript
console.log('\nTest 2: Checking if clerk-config.js is valid...');
try {
  const clerkConfig = require(clerkConfigPath);
  console.log('✅ PASS: clerk-config.js is valid JavaScript');
  
  // Test 3: Check if publishableKey exists
  console.log('\nTest 3: Checking if publishableKey is defined...');
  if (!clerkConfig.publishableKey) {
    console.error('❌ FAIL: publishableKey is not defined');
    exitCode = 1;
  } else {
    console.log('✅ PASS: publishableKey is defined');
    
    // Test 4: Check if publishableKey is not placeholder
    console.log('\nTest 4: Checking if publishableKey is not a placeholder...');
    if (clerkConfig.publishableKey === 'YOUR_CLERK_PUBLISHABLE_KEY_HERE') {
      console.error('❌ FAIL: publishableKey is still set to placeholder value');
      exitCode = 1;
    } else {
      console.log('✅ PASS: publishableKey is not a placeholder');
      
      // Test 5: Check if publishableKey starts with pk_
      console.log('\nTest 5: Checking if publishableKey format is valid...');
      if (!clerkConfig.publishableKey.startsWith('pk_')) {
        console.error('❌ FAIL: publishableKey does not start with "pk_"');
        exitCode = 1;
      } else {
        console.log('✅ PASS: publishableKey format is valid');
        console.log(`   Key type: ${clerkConfig.publishableKey.startsWith('pk_test_') ? '🧪 TEST/DEVELOPMENT' : '🚀 PRODUCTION'}`);
      }
    }
  }
} catch (error) {
  console.error('❌ FAIL: clerk-config.js has syntax errors:', error.message);
  exitCode = 1;
}

// Test 6: Check if bundle exists
console.log('\nTest 6: Checking if bundle exists...');
const bundlePath = path.join(__dirname, 'dist', 'js', 'bundle-auth.js');
if (!fs.existsSync(bundlePath)) {
  console.error('❌ FAIL: dist/js/bundle-auth.js not found (run npm run build)');
  exitCode = 1;
} else {
  console.log('✅ PASS: bundle-auth.js exists');
  
  // Test 7: Check if bundle contains the key
  console.log('\nTest 7: Checking if bundle contains publishableKey...');
  try {
    const bundleContent = fs.readFileSync(bundlePath, 'utf8');
    const keyMatch = bundleContent.match(/publishableKey:\s*"(pk_[^"]+)"/);
    
    if (!keyMatch) {
      console.error('❌ FAIL: publishableKey not found in bundle');
      exitCode = 1;
    } else {
      console.log('✅ PASS: publishableKey found in bundle');
      console.log(`   Key: ${keyMatch[1].substring(0, 20)}...`);
      
      // Test 8: Check if bundle key matches config key
      console.log('\nTest 8: Checking if bundle key matches config...');
      const clerkConfig = require(clerkConfigPath);
      if (keyMatch[1] !== clerkConfig.publishableKey) {
        console.error('❌ FAIL: Bundle key does not match clerk-config.js');
        console.error(`   Bundle:  ${keyMatch[1]}`);
        console.error(`   Config:  ${clerkConfig.publishableKey}`);
        exitCode = 1;
      } else {
        console.log('✅ PASS: Bundle key matches config');
      }
    }
  } catch (error) {
    console.error('❌ FAIL: Error reading bundle:', error.message);
    exitCode = 1;
  }
}

// Summary
console.log('\n' + '='.repeat(50));
if (exitCode === 0) {
  console.log('✅ All tests passed! Clerk configuration is correct.');
  console.log('\nThe extension should now authenticate properly without');
  console.log('the "Clerk API-Schlüssel fehlt" error.');
} else {
  console.log('❌ Some tests failed. Please review the errors above.');
  console.log('\nTo fix:');
  console.log('1. Ensure clerk-config.js exists with a valid key');
  console.log('2. Run: npm run build');
  console.log('3. Run this test again: node test-clerk-config.js');
}
console.log('='.repeat(50) + '\n');

process.exit(exitCode);
