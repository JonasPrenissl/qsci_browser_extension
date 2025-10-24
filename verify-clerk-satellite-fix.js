#!/usr/bin/env node
// Test to verify Clerk configuration is correct
const fs = require('fs');
const path = require('path');

console.log('Testing Clerk Configuration...\n');

// Read the bundled auth file
const bundlePath = path.join(__dirname, 'dist/js/bundle-auth.js');
const bundleContent = fs.readFileSync(bundlePath, 'utf8');

// Test 1: Check that isSatellite is NOT set in our configuration
const hasIsSatelliteTrue = /isSatellite:\s*true/.test(bundleContent);
if (hasIsSatelliteTrue) {
  console.log('❌ FAIL: Found isSatellite: true in bundle (should be removed)');
  process.exit(1);
} else {
  console.log('✅ PASS: isSatellite: true not found in our configuration');
}

// Test 2: Check that domain is NOT set in our clerk.load() call
const hasDomainConfig = /await clerk\.load\(\{[^}]*domain:\s*['"]/.test(bundleContent);
if (hasDomainConfig) {
  console.log('❌ FAIL: Found domain configuration in clerk.load() (should be removed)');
  process.exit(1);
} else {
  console.log('✅ PASS: domain parameter not found in clerk.load()');
}

// Test 3: Check that proxyUrl is NOT set in our clerk.load() call  
const hasProxyUrlConfig = /await clerk\.load\(\{[^}]*proxyUrl:\s*['"]/.test(bundleContent);
if (hasProxyUrlConfig) {
  console.log('❌ FAIL: Found proxyUrl configuration in clerk.load() (should be removed)');
  process.exit(1);
} else {
  console.log('✅ PASS: proxyUrl parameter not found in clerk.load()');
}

// Test 4: Check that redirect URLs are still present
const hasRedirectUrls = /signInFallbackRedirectUrl/.test(bundleContent);
if (!hasRedirectUrls) {
  console.log('❌ FAIL: Redirect URLs not found (should be present)');
  process.exit(1);
} else {
  console.log('✅ PASS: Redirect URLs are properly configured');
}

console.log('\n✅ All tests passed! Clerk is configured as a Main App (not Satellite).');
console.log('\nConfiguration summary:');
console.log('  - isSatellite: NOT SET (correct for main app)');
console.log('  - domain: NOT SET (correct for main app)');
console.log('  - proxyUrl: NOT SET (correct for main app)');
console.log('  - Redirect URLs: CONFIGURED (for OAuth compatibility)');
