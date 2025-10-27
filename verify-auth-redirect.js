#!/usr/bin/env node
/**
 * Verification script to check if the Clerk authentication redirect flow is set up correctly
 */

const fs = require('fs');
const path = require('path');

console.log('');
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║  Q-SCI Extension - Authentication Redirect Flow Verification  ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('');

let allChecksPass = true;

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${description}`);
  if (!exists) {
    console.log(`   Missing: ${filePath}`);
    allChecksPass = false;
  }
  return exists;
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

console.log('📁 Checking Website Authentication Pages:');
console.log('');

checkFile(
  path.join(__dirname, 'website', 'extension-login.html'),
  'extension-login.html exists'
);

checkFile(
  path.join(__dirname, 'website', 'extension-auth-success.html'),
  'extension-auth-success.html exists'
);

console.log('');
console.log('⚙️  Checking Extension Configuration:');
console.log('');

// Check if auth.js uses the correct URL
const authJsPath = path.join(__dirname, 'src', 'auth.js');

if (!fs.existsSync(authJsPath)) {
  console.log(`❌ src/auth.js not found (required for HTTPS redirect flow)`);
  console.log(`   The extension should use src/auth.js with HTTPS URLs`);
  allChecksPass = false;
} else {
  checkFileContains(
    authJsPath,
    "const CLERK_AUTH_URL = 'https://www.q-sci.org/extension-login'",
    'src/auth.js uses correct production URL'
  );

  checkFileContains(
    authJsPath,
    'window.open(',
    'src/auth.js opens authentication in new window'
  );

  checkFileContains(
    authJsPath,
    "CLERK_AUTH_SUCCESS",
    'src/auth.js listens for correct message type'
  );
}

console.log('');
console.log('🔍 Checking Website Pages Configuration:');
console.log('');

const loginPagePath = path.join(__dirname, 'website', 'extension-login.html');
checkFileContains(
  loginPagePath,
  'AUTH_SUCCESS_URL',
  'extension-login.html defines success URL'
);

checkFileContains(
  loginPagePath,
  'extension-auth-success',
  'extension-login.html redirects to success page'
);

const successPagePath = path.join(__dirname, 'website', 'extension-auth-success.html');
checkFileContains(
  successPagePath,
  'window.opener',
  'extension-auth-success.html uses window.opener'
);

checkFileContains(
  successPagePath,
  'postMessage',
  'extension-auth-success.html sends postMessage'
);

checkFileContains(
  successPagePath,
  "type: 'CLERK_AUTH_SUCCESS'",
  'extension-auth-success.html sends correct message type'
);

console.log('');
console.log('🏗️  Checking Build Files:');
console.log('');

checkFile(
  path.join(__dirname, 'build.js'),
  'build.js exists'
);

checkFile(
  path.join(__dirname, 'test-server.js'),
  'test-server.js exists (for local testing)'
);

console.log('');
console.log('📚 Checking Documentation:');
console.log('');

checkFile(
  path.join(__dirname, 'TESTING_AUTH_REDIRECT.md'),
  'TESTING_AUTH_REDIRECT.md exists'
);

checkFile(
  path.join(__dirname, 'website', 'README.md'),
  'website/README.md exists'
);

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

if (allChecksPass) {
  console.log('✅ All checks passed! The authentication redirect flow is properly configured.');
  console.log('');
  console.log('📝 Next steps:');
  console.log('   1. Deploy website/extension-login.html to https://www.q-sci.org/extension-login');
  console.log('   2. Deploy website/extension-auth-success.html to https://www.q-sci.org/extension-auth-success');
  console.log('   3. Configure Clerk dashboard with these redirect URLs');
  console.log('   4. Test the authentication flow');
  console.log('');
  console.log('   For local testing, run: npm run test-server');
  console.log('   See TESTING_AUTH_REDIRECT.md for detailed instructions');
  console.log('');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please review the errors above.');
  console.log('');
  console.log('📝 To fix issues:');
  console.log('   1. Ensure all required files exist');
  console.log('   2. Check file contents match expected patterns');
  console.log('   3. Run npm run build if needed');
  console.log('   4. See TESTING_AUTH_REDIRECT.md for help');
  console.log('');
  process.exit(1);
}
