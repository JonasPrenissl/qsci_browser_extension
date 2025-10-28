#!/usr/bin/env node
/**
 * Q-SCI Extension Smoke Test
 * 
 * This script performs basic smoke tests to verify:
 * 1. Extension builds successfully
 * 2. Mock backend server starts
 * 3. API endpoints respond correctly
 * 4. Authentication pages are accessible
 * 5. All required files exist
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Constants
const SERVER_START_TIMEOUT_MS = 5000;
const SERVER_READY_DELAY_MS = 1000;
const CLEANUP_DELAY_MS = 500;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Test results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0
};

// Helper function to make HTTP requests
function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data });
      });
    }).on('error', reject);
  });
}

// Helper function to check if file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

// Test 1: Check required files exist
async function testRequiredFiles() {
  info('Test 1: Checking required files...');
  
  const requiredFiles = [
    'manifest.json',
    'popup.html',
    'popup.js',
    'background.js',
    'src/auth.js',
    'qsci_evaluator.js',
    'clerk-config.js',
    'mock-backend-server.js',
    'website/extension-login.html',
    'website/extension-auth-success.html',
    'dist/js/bundle-auth.js'
  ];

  let allExist = true;
  
  for (const file of requiredFiles) {
    const fullPath = path.join(__dirname, file);
    if (fileExists(fullPath)) {
      success(`  ${file} exists`);
      results.passed++;
    } else {
      error(`  ${file} is missing`);
      results.failed++;
      allExist = false;
    }
  }

  return allExist;
}

// Test 2: Start mock backend server
async function startMockServer() {
  info('Test 2: Starting mock backend server...');
  
  return new Promise((resolve, reject) => {
    const server = spawn('node', ['mock-backend-server.js'], {
      cwd: __dirname,
      detached: false
    });

    let started = false;

    server.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Server running at') && !started) {
        started = true;
        success('  Mock backend server started');
        results.passed++;
        
        // Wait for server to be fully ready
        setTimeout(() => resolve(server), SERVER_READY_DELAY_MS);
      }
    });

    server.stderr.on('data', (data) => {
      error(`  Server error: ${data}`);
    });

    server.on('error', (err) => {
      error(`  Failed to start server: ${err.message}`);
      results.failed++;
      reject(err);
    });

    // Timeout if server doesn't start
    setTimeout(() => {
      if (!started) {
        error('  Server did not start within timeout');
        results.failed++;
        server.kill();
        reject(new Error('Server start timeout'));
      }
    }, SERVER_START_TIMEOUT_MS);
  });
}

// Test 3: Test API endpoints
async function testApiEndpoints() {
  info('Test 3: Testing API endpoints...');
  
  try {
    // Test OpenAI key endpoint
    const openaiResponse = await httpGet('http://localhost:5000/api/auth/openai-key');
    if (openaiResponse.statusCode === 401) {
      success('  /api/auth/openai-key returns 401 (expected without auth header)');
      results.passed++;
    } else {
      error(`  /api/auth/openai-key unexpected status: ${openaiResponse.statusCode}`);
      results.failed++;
    }

    // Test subscription status endpoint
    const subResponse = await httpGet('http://localhost:5000/api/auth/subscription-status');
    if (subResponse.statusCode === 401) {
      success('  /api/auth/subscription-status returns 401 (expected without auth header)');
      results.passed++;
    } else {
      error(`  /api/auth/subscription-status unexpected status: ${subResponse.statusCode}`);
      results.failed++;
    }

    // Test with authorization header
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/openai-key',
      method: 'GET',
      headers: { 'Authorization': 'Bearer test-token' }
    };

    return new Promise((resolve) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.api_key) {
              success('  /api/auth/openai-key returns API key with auth');
              results.passed++;
            } else {
              error('  /api/auth/openai-key did not return API key');
              results.failed++;
            }
          } catch (err) {
            error(`  Failed to parse response: ${err.message}`);
            results.failed++;
          }
          resolve();
        });
      });

      req.on('error', (err) => {
        error(`  Request failed: ${err.message}`);
        results.failed++;
        resolve();
      });

      req.end();
    });
  } catch (err) {
    error(`  API endpoint test failed: ${err.message}`);
    results.failed++;
  }
}

// Test 4: Test authentication pages
async function testAuthPages() {
  info('Test 4: Testing authentication pages...');
  
  try {
    // Test login page
    const loginResponse = await httpGet('http://localhost:5000/extension-login');
    if (loginResponse.statusCode === 200 && loginResponse.data.includes('Q-SCI')) {
      success('  /extension-login page loads correctly');
      results.passed++;
    } else {
      error(`  /extension-login page issue (status: ${loginResponse.statusCode})`);
      results.failed++;
    }

    // Test success page
    const successResponse = await httpGet('http://localhost:5000/extension-auth-success');
    if (successResponse.statusCode === 200 && successResponse.data.includes('Q-SCI')) {
      success('  /extension-auth-success page loads correctly');
      results.passed++;
    } else {
      error(`  /extension-auth-success page issue (status: ${successResponse.statusCode})`);
      results.failed++;
    }

    // Test root page
    const rootResponse = await httpGet('http://localhost:5000/');
    if (rootResponse.statusCode === 200) {
      success('  / (root) page loads correctly');
      results.passed++;
    } else {
      error(`  / (root) page issue (status: ${rootResponse.statusCode})`);
      results.failed++;
    }
  } catch (err) {
    error(`  Auth pages test failed: ${err.message}`);
    results.failed++;
  }
}

// Test 5: Check configuration
async function testConfiguration() {
  info('Test 5: Checking configuration...');
  
  try {
    // Check clerk-config.js with error handling
    let clerkConfig;
    try {
      clerkConfig = require('./clerk-config.js');
    } catch (err) {
      error('  Failed to load clerk-config.js: ' + err.message);
      results.failed++;
      return;
    }
    
    if (clerkConfig.publishableKey && clerkConfig.publishableKey.startsWith('pk_test_')) {
      success('  Clerk config has test key');
      results.passed++;
    } else if (clerkConfig.publishableKey && clerkConfig.publishableKey.startsWith('pk_live_')) {
      warning('  Clerk config has production key (expected for production)');
      results.warnings++;
    } else {
      error('  Clerk config missing or invalid key');
      results.failed++;
    }

    // Check auth.js URLs
    const authJs = fs.readFileSync(path.join(__dirname, 'src', 'auth.js'), 'utf8');
    if (authJs.includes('http://localhost:5000')) {
      success('  auth.js configured for local testing');
      results.passed++;
    } else if (authJs.includes('https://www.q-sci.org')) {
      warning('  auth.js configured for production');
      results.warnings++;
    } else {
      error('  auth.js URLs not configured');
      results.failed++;
    }
  } catch (err) {
    error(`  Configuration test failed: ${err.message}`);
    results.failed++;
  }
}

// Main test runner
async function runTests() {
  console.log('');
  log('╔════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  Q-SCI Extension Smoke Tests                                  ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════╝', 'cyan');
  console.log('');

  let server = null;
  
  // Ensure cleanup happens even if tests fail
  const cleanup = async () => {
    if (server) {
      info('Stopping mock backend server...');
      try {
        server.kill();
        await new Promise(resolve => setTimeout(resolve, CLEANUP_DELAY_MS));
      } catch (err) {
        // Ignore cleanup errors
      }
    }
  };

  // Handle process termination
  process.on('SIGINT', async () => {
    await cleanup();
    process.exit(130);
  });
  
  process.on('SIGTERM', async () => {
    await cleanup();
    process.exit(143);
  });

  try {
    // Run all tests in sequence
    await testRequiredFiles();
    console.log('');
    
    server = await startMockServer();
    console.log('');
    
    await testApiEndpoints();
    console.log('');
    
    await testAuthPages();
    console.log('');
    
    await testConfiguration();
    console.log('');
  } catch (err) {
    error(`Test suite error: ${err.message}`);
  } finally {
    // Clean up: kill server
    await cleanup();
  }

  // Print summary
  console.log('');
  log('═══════════════════════════════════════════════════════════════', 'cyan');
  log('  TEST SUMMARY', 'cyan');
  log('═══════════════════════════════════════════════════════════════', 'cyan');
  success(`Passed: ${results.passed}`);
  if (results.failed > 0) {
    error(`Failed: ${results.failed}`);
  }
  if (results.warnings > 0) {
    warning(`Warnings: ${results.warnings}`);
  }
  console.log('');

  if (results.failed === 0) {
    success('All critical tests passed! ✨');
    console.log('');
    info('Next steps:');
    console.log('  1. Start mock backend: node mock-backend-server.js');
    console.log('  2. Load extension in Chrome (chrome://extensions/)');
    console.log('  3. Test authentication and analysis features');
    console.log('  4. See LOCAL_TESTING_GUIDE.md for detailed instructions');
    console.log('');
    process.exit(0);
  } else {
    error('Some tests failed. Please review the errors above.');
    console.log('');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(err => {
  error(`Fatal error: ${err.message}`);
  process.exit(1);
});
