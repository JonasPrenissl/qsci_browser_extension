#!/usr/bin/env node
/**
 * Verification script for Clerk satellite mode fix
 * Verifies that the proxyUrl parameter has been added correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Clerk Satellite Mode Fix...\n');

let exitCode = 0;
const errors = [];
const warnings = [];
const passes = [];

// Test 1: Check src/auth.js contains proxyUrl
console.log('Test 1: Checking src/auth.js for proxyUrl...');
const authPath = path.join(__dirname, 'src', 'auth.js');
if (!fs.existsSync(authPath)) {
  errors.push('src/auth.js not found');
} else {
  const authContent = fs.readFileSync(authPath, 'utf8');
  if (authContent.includes('proxyUrl:')) {
    if (authContent.includes('proxyUrl: \'https://www.q-sci.org\'')) {
      passes.push('✅ src/auth.js contains proxyUrl parameter');
    } else {
      warnings.push('⚠️  src/auth.js contains proxyUrl but value might be incorrect');
    }
  } else {
    errors.push('❌ src/auth.js missing proxyUrl parameter');
  }
}

// Test 2: Check src/clerk-auth-main.js contains proxyUrl
console.log('Test 2: Checking src/clerk-auth-main.js for proxyUrl...');
const mainPath = path.join(__dirname, 'src', 'clerk-auth-main.js');
if (!fs.existsSync(mainPath)) {
  errors.push('src/clerk-auth-main.js not found');
} else {
  const mainContent = fs.readFileSync(mainPath, 'utf8');
  if (mainContent.includes('proxyUrl:')) {
    if (mainContent.includes('proxyUrl: \'https://www.q-sci.org\'')) {
      passes.push('✅ src/clerk-auth-main.js contains proxyUrl parameter');
    } else {
      warnings.push('⚠️  src/clerk-auth-main.js contains proxyUrl but value might be incorrect');
    }
  } else {
    errors.push('❌ src/clerk-auth-main.js missing proxyUrl parameter');
  }
}

// Test 3: Check bundle contains proxyUrl
console.log('Test 3: Checking dist/js/bundle-auth.js for proxyUrl...');
const bundlePath = path.join(__dirname, 'dist', 'js', 'bundle-auth.js');
if (!fs.existsSync(bundlePath)) {
  errors.push('dist/js/bundle-auth.js not found - run npm run build');
} else {
  const bundleContent = fs.readFileSync(bundlePath, 'utf8');
  if (bundleContent.includes('proxyUrl:')) {
    if (bundleContent.includes('proxyUrl: "https://www.q-sci.org"')) {
      passes.push('✅ bundle-auth.js contains proxyUrl parameter');
    } else {
      warnings.push('⚠️  bundle-auth.js contains proxyUrl but value might be incorrect');
    }
  } else {
    errors.push('❌ bundle-auth.js missing proxyUrl parameter');
  }
}

// Test 4: Verify both domain and proxyUrl are present together
console.log('Test 4: Verifying domain and proxyUrl are configured together...');
const srcFiles = ['src/auth.js', 'src/clerk-auth-main.js'];
for (const file of srcFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasDomain = content.includes('domain:') && content.includes('www.q-sci.org');
    const hasProxyUrl = content.includes('proxyUrl:') && content.includes('https://www.q-sci.org');
    
    if (hasDomain && hasProxyUrl) {
      passes.push(`✅ ${file} has both domain and proxyUrl`);
    } else if (!hasDomain) {
      errors.push(`❌ ${file} missing domain parameter`);
    } else if (!hasProxyUrl) {
      errors.push(`❌ ${file} missing proxyUrl parameter`);
    }
  }
}

// Test 5: Check that isSatellite is still true
console.log('Test 5: Verifying isSatellite is enabled...');
for (const file of srcFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('isSatellite: true')) {
      passes.push(`✅ ${file} has isSatellite: true`);
    } else {
      errors.push(`❌ ${file} missing isSatellite: true`);
    }
  }
}

// Print results
console.log('\n' + '='.repeat(60));
console.log('📊 Test Results:');
console.log('='.repeat(60));

if (passes.length > 0) {
  console.log('\n✅ Passed Tests:');
  passes.forEach(msg => console.log('  ' + msg));
}

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  warnings.forEach(msg => console.log('  ' + msg));
}

if (errors.length > 0) {
  console.log('\n❌ Failed Tests:');
  errors.forEach(msg => console.log('  ' + msg));
  exitCode = 1;
}

console.log('\n' + '='.repeat(60));
if (exitCode === 0) {
  console.log('✅ All verification tests passed!');
  console.log('\nThe Clerk satellite mode fix is correctly applied.');
  console.log('Authentication should work without the "Missing domain and proxyUrl" error.');
  console.log('\nNext steps:');
  console.log('1. Load the extension in Chrome');
  console.log('2. Click the extension icon');
  console.log('3. Click "Mit Clerk anmelden" button');
  console.log('4. Verify the authentication window opens without errors');
} else {
  console.log('❌ Some verification tests failed.');
  console.log('\nPlease review the errors above and:');
  console.log('1. Ensure both domain and proxyUrl are configured');
  console.log('2. Run: npm run build');
  console.log('3. Run this verification again');
}
console.log('='.repeat(60) + '\n');

process.exit(exitCode);
