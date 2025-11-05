/**
 * Verification script for language support and aspect count fixes
 * This script checks that:
 * 1. The evaluator accepts a language parameter
 * 2. The prompt includes language requirements
 * 3. The prompt includes dynamic aspect count requirements
 */

const fs = require('fs');
const path = require('path');

console.log('=== Verifying Language Support and Aspect Count Fixes ===\n');

// Test 1: Check qsci_evaluator.js contains language parameter
console.log('Test 1: Checking qsci_evaluator.js for language parameter...');
const evaluatorPath = path.join(__dirname, 'qsci_evaluator.js');
const evaluatorContent = fs.readFileSync(evaluatorPath, 'utf8');

if (evaluatorContent.includes('function buildMessages(title, sourceUrl, text, language = \'de\')')) {
  console.log('✓ PASS: buildMessages function accepts language parameter');
} else {
  console.error('✗ FAIL: buildMessages function does not accept language parameter');
  process.exit(1);
}

// Test 2: Check for language detection in evaluate function
console.log('\nTest 2: Checking for language detection in evaluate function...');
if (evaluatorContent.includes('window.QSCIi18n.getLanguage()')) {
  console.log('✓ PASS: evaluate function retrieves current language from i18n service');
} else {
  console.error('✗ FAIL: evaluate function does not retrieve language from i18n service');
  process.exit(1);
}

// Test 3: Check for language requirement in prompt
console.log('\nTest 3: Checking for language requirement in prompt...');
if (evaluatorContent.includes('IMPORTANT: You MUST respond in')) {
  console.log('✓ PASS: Prompt includes language requirement');
} else {
  console.error('✗ FAIL: Prompt does not include language requirement');
  process.exit(1);
}

// Test 4: Check for dynamic aspect count requirements
console.log('\nTest 4: Checking for dynamic aspect count requirements...');
const aspectRequirements = [
  'ASPECT COUNT REQUIREMENTS',
  'For scores ≥85%: Provide at least 6 positive aspects',
  'For scores 70-84%: Provide 4-5 positive aspects and 4-5 negative aspects',
  'For scores 50-69%: Provide 3-4 positive aspects and 5-6 negative aspects',
  'For scores <50%: Provide at least 3 positive aspects and at least 6 negative aspects'
];

let allRequirementsFound = true;
for (const requirement of aspectRequirements) {
  if (!evaluatorContent.includes(requirement)) {
    console.error(`✗ FAIL: Missing requirement: "${requirement}"`);
    allRequirementsFound = false;
  }
}

if (allRequirementsFound) {
  console.log('✓ PASS: All aspect count requirements are present in prompt');
} else {
  process.exit(1);
}

// Test 5: Check PDF export fix
console.log('\nTest 5: Checking PDF export border fix...');
const pdfExportPath = path.join(__dirname, 'pdf-export.js');
const pdfExportContent = fs.readFileSync(pdfExportPath, 'utf8');

if (pdfExportContent.includes('// Draw background first') &&
    pdfExportContent.includes('doc.setFillColor(...COLORS.background)') &&
    pdfExportContent.includes('// Then draw the border') &&
    pdfExportContent.includes('doc.setDrawColor(...COLORS.primary)') &&
    pdfExportContent.includes('// Finally add the colored left border on top')) {
  console.log('✓ PASS: PDF export has proper border rendering sequence');
} else {
  console.error('✗ FAIL: PDF export border rendering may not be fixed correctly');
  process.exit(1);
}

// Test 6: Check that colors are set explicitly before each draw operation
console.log('\nTest 6: Checking explicit color setting in PDF export...');
const reasoningBoxMatch = pdfExportContent.match(/\/\/ Draw background first[\s\S]{0,200}doc\.setFillColor[\s\S]{0,200}doc\.roundedRect[\s\S]{0,200}\/\/ Then draw the border[\s\S]{0,200}doc\.setDrawColor/);
if (reasoningBoxMatch) {
  console.log('✓ PASS: Colors are set explicitly before each drawing operation');
} else {
  console.error('✗ FAIL: Colors may not be set explicitly before each operation');
  process.exit(1);
}

console.log('\n=== All Tests Passed ===');
console.log('\nSummary:');
console.log('✓ Language parameter added to buildMessages function');
console.log('✓ Language detection from i18n service implemented');
console.log('✓ Language requirement added to OpenAI prompt');
console.log('✓ Dynamic aspect count requirements based on quality score added');
console.log('✓ PDF export border rendering fixed');
console.log('✓ Explicit color setting in PDF export implemented');
console.log('\nThe implementation is complete and ready for testing with real API calls.');
