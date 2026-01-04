/**
 * Simple unit test for PDF handler module
 * Tests the PDF handler logic without requiring a full browser context
 */

const fs = require('fs');
const path = require('path');

function testPDFHandlerExists() {
  console.log('Testing PDF handler file exists...\n');
  
  const pdfHandlerPath = path.join(__dirname, 'pdf-handler.js');
  const bundlePath = path.join(__dirname, 'dist/js/bundle-pdf-handler.js');
  
  if (!fs.existsSync(pdfHandlerPath)) {
    console.error('✗ FAIL: pdf-handler.js not found at:', pdfHandlerPath);
    return false;
  }
  console.log('✓ PASS: pdf-handler.js exists');
  
  if (!fs.existsSync(bundlePath)) {
    console.error('✗ FAIL: bundle-pdf-handler.js not found at:', bundlePath);
    return false;
  }
  console.log('✓ PASS: bundle-pdf-handler.js exists');
  
  return true;
}

function testPDFHandlerSyntax() {
  console.log('\nTesting PDF handler syntax...\n');
  
  const pdfHandlerPath = path.join(__dirname, 'pdf-handler.js');
  
  try {
    const content = fs.readFileSync(pdfHandlerPath, 'utf8');
    
    // Check for key functions
    if (!content.includes('downloadPDF')) {
      console.error('✗ FAIL: downloadPDF function not found');
      return false;
    }
    console.log('✓ PASS: downloadPDF function exists');
    
    if (!content.includes('extractTextFromPDF')) {
      console.error('✗ FAIL: extractTextFromPDF function not found');
      return false;
    }
    console.log('✓ PASS: extractTextFromPDF function exists');
    
    if (!content.includes('tryDownloadAndExtractPDF')) {
      console.error('✗ FAIL: tryDownloadAndExtractPDF function not found');
      return false;
    }
    console.log('✓ PASS: tryDownloadAndExtractPDF function exists');
    
    if (!content.includes('window.QSCIPDFHandler')) {
      console.error('✗ FAIL: window.QSCIPDFHandler not exposed');
      return false;
    }
    console.log('✓ PASS: window.QSCIPDFHandler exposed');
    
    return true;
  } catch (error) {
    console.error('✗ FAIL: Error reading pdf-handler.js:', error.message);
    return false;
  }
}

function testManifestUpdated() {
  console.log('\nTesting manifest.json updates...\n');
  
  const manifestPath = path.join(__dirname, 'manifest.json');
  
  try {
    const content = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(content);
    
    // Check for downloads permission
    if (!manifest.permissions || !manifest.permissions.includes('downloads')) {
      console.error('✗ FAIL: downloads permission not found in manifest.json');
      return false;
    }
    console.log('✓ PASS: downloads permission added');
    
    // Check for PDF handler in web accessible resources
    const webResources = manifest.web_accessible_resources?.[0]?.resources || [];
    if (!webResources.includes('dist/js/bundle-pdf-handler.js')) {
      console.error('✗ FAIL: bundle-pdf-handler.js not in web_accessible_resources');
      return false;
    }
    console.log('✓ PASS: bundle-pdf-handler.js in web_accessible_resources');
    
    return true;
  } catch (error) {
    console.error('✗ FAIL: Error reading manifest.json:', error.message);
    return false;
  }
}

function testPopupHTMLUpdated() {
  console.log('\nTesting popup.html updates...\n');
  
  const popupPath = path.join(__dirname, 'popup.html');
  
  try {
    const content = fs.readFileSync(popupPath, 'utf8');
    
    // Check if PDF handler script is included
    if (!content.includes('dist/js/bundle-pdf-handler.js')) {
      console.error('✗ FAIL: bundle-pdf-handler.js script not included in popup.html');
      return false;
    }
    console.log('✓ PASS: bundle-pdf-handler.js script included in popup.html');
    
    return true;
  } catch (error) {
    console.error('✗ FAIL: Error reading popup.html:', error.message);
    return false;
  }
}

function testPopupJSUpdated() {
  console.log('\nTesting popup.js updates...\n');
  
  const popupJsPath = path.join(__dirname, 'popup.js');
  
  try {
    const content = fs.readFileSync(popupJsPath, 'utf8');
    
    // Check for PDF analysis logic
    if (!content.includes('QSCIPDFHandler')) {
      console.error('✗ FAIL: QSCIPDFHandler not used in popup.js');
      return false;
    }
    console.log('✓ PASS: QSCIPDFHandler used in popup.js');
    
    if (!content.includes('tryDownloadAndExtractPDF')) {
      console.error('✗ FAIL: tryDownloadAndExtractPDF not called in popup.js');
      return false;
    }
    console.log('✓ PASS: tryDownloadAndExtractPDF called in popup.js');
    
    return true;
  } catch (error) {
    console.error('✗ FAIL: Error reading popup.js:', error.message);
    return false;
  }
}

// Run all tests
console.log('========================================');
console.log('Q-SCI PDF Analysis Feature Unit Tests');
console.log('========================================\n');

const tests = [
  { name: 'PDF handler files exist', fn: testPDFHandlerExists },
  { name: 'PDF handler syntax correct', fn: testPDFHandlerSyntax },
  { name: 'Manifest.json updated', fn: testManifestUpdated },
  { name: 'Popup.html updated', fn: testPopupHTMLUpdated },
  { name: 'Popup.js updated', fn: testPopupJSUpdated }
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  const result = test.fn();
  if (result) {
    passed++;
  } else {
    failed++;
  }
}

console.log('\n========================================');
console.log('Final Results');
console.log('========================================');
console.log(`Total: ${tests.length} tests`);
console.log(`✓ Passed: ${passed}`);
console.log(`✗ Failed: ${failed}`);

if (failed === 0) {
  console.log('\n✓ All tests passed!');
  process.exit(0);
} else {
  console.log('\n✗ Some tests failed');
  process.exit(1);
}
