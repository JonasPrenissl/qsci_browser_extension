#!/usr/bin/env node
/**
 * Verification script for subscription status fix
 * This script verifies that the extension no longer uses the problematic
 * publicMetadata.plan_id fallback that caused false premium status.
 */

const fs = require('fs');
const path = require('path');

console.log('');
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║     Q-SCI Extension - Subscription Status Fix Verification    ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('');

let allChecksPass = true;

function checkFileDoesNotContain(filePath, searchString, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const contains = content.includes(searchString);
    const status = contains ? '❌' : '✅';
    console.log(`${status} ${description}`);
    if (contains) {
      console.log(`   File ${path.basename(filePath)} should NOT contain: "${searchString.substring(0, 50)}..."`);
      allChecksPass = false;
    }
    return !contains;
  } catch (error) {
    console.log(`❌ ${description}`);
    console.log(`   Error reading file: ${error.message}`);
    allChecksPass = false;
    return false;
  }
}

function checkFileContains(filePath, searchString, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const contains = content.includes(searchString);
    const status = contains ? '✅' : '❌';
    console.log(`${status} ${description}`);
    if (!contains) {
      console.log(`   File ${path.basename(filePath)} should contain: "${searchString.substring(0, 50)}..."`);
      allChecksPass = false;
    }
    return contains;
  } catch (error) {
    console.log(`❌ ${description}`);
    console.log(`   Error reading file: ${error.message}`);
    allChecksPass = false;
    return false;
  }
}

console.log('📁 Checking Extension Auth Success Page:');
console.log('');

const authSuccessFile = path.join(__dirname, 'website/extension-auth-success.html');

// Verify that problematic fallback is removed
checkFileDoesNotContain(
  authSuccessFile,
  'if (user.publicMetadata && user.publicMetadata.plan_id) {\n              subscriptionStatus = \'subscribed\';',
  'Removed problematic publicMetadata.plan_id fallback in else block'
);

checkFileDoesNotContain(
  authSuccessFile,
  'Fallback: Check publicMetadata for plan_id',
  'Removed publicMetadata fallback comment'
);

// Verify that the extension now defaults to free
checkFileContains(
  authSuccessFile,
  'defaulting to free',
  'Extension defaults to free when backend is unavailable'
);

checkFileContains(
  authSuccessFile,
  'The backend is the authoritative source',
  'Documentation clearly states backend is authoritative'
);

console.log('');
console.log('📁 Checking Backend Documentation:');
console.log('');

const backendDocFile = path.join(__dirname, 'BACKEND_SUBSCRIPTION_FIX.md');

// Verify that backend documentation is updated
checkFileContains(
  backendDocFile,
  'plan_id: undefined',
  'Backend webhook documented to clear plan_id when subscription cancelled'
);

checkFileContains(
  backendDocFile,
  'current_period_end: undefined',
  'Backend webhook documented to clear current_period_end when subscription cancelled'
);

checkFileContains(
  backendDocFile,
  'CRITICAL: publicMetadata Cleanup Required',
  'Critical warning about publicMetadata cleanup added'
);

console.log('');
console.log('📁 Checking Subscription Status Fix Documentation:');
console.log('');

const subscriptionDocFile = path.join(__dirname, 'SUBSCRIPTION_STATUS_FIX.md');

checkFileContains(
  subscriptionDocFile,
  'Previous Issue (Now Fixed)',
  'Documentation updated with fix information'
);

checkFileContains(
  subscriptionDocFile,
  'The extension now defaults to \'free\' status when the backend API is unavailable',
  'Current behavior documented'
);

console.log('');
console.log('═══════════════════════════════════════════════════════════════');

if (allChecksPass) {
  console.log('✅ All checks passed! The subscription status fix is correctly implemented.');
  console.log('');
  console.log('Summary of changes:');
  console.log('1. Removed problematic publicMetadata.plan_id fallback from extension auth page');
  console.log('2. Extension now defaults to "free" when backend is unavailable (safer)');
  console.log('3. Backend documentation updated to require clearing publicMetadata on cancellation');
  console.log('4. Documentation updated to reflect the fix and current behavior');
  console.log('');
  console.log('Note: The backend webhook handler must be updated separately to clear');
  console.log('      publicMetadata.plan_id when subscriptions are cancelled.');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please review the output above.');
  process.exit(1);
}
