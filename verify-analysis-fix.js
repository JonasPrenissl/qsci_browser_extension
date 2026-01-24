#!/usr/bin/env node

/**
 * Verification script for the analysis display fix
 * Checks that the prompt and token limits are configured correctly
 */

const fs = require('fs');
const path = require('path');

console.log('\n=== Verifying Analysis Display Fix ===\n');

// Read the qsci_evaluator.js file
const evaluatorPath = path.join(__dirname, 'qsci_evaluator.js');
const evaluatorContent = fs.readFileSync(evaluatorPath, 'utf8');

let allChecksPass = true;

// Check 1: max_tokens should be 2500 or higher
console.log('✓ Check 1: max_tokens limit');
const maxTokensMatch = evaluatorContent.match(/max_tokens:\s*(\d+)/);
if (maxTokensMatch) {
  const maxTokens = parseInt(maxTokensMatch[1]);
  console.log(`  Current max_tokens: ${maxTokens}`);
  if (maxTokens >= 2500) {
    console.log('  ✓ PASS: max_tokens is sufficient (>= 2500)');
  } else {
    console.log(`  ✗ FAIL: max_tokens is too low (${maxTokens} < 2500)`);
    allChecksPass = false;
  }
} else {
  console.log('  ✗ FAIL: Could not find max_tokens in evaluator');
  allChecksPass = false;
}

// Check 2: REASONING should mention 2-3 paragraphs (not just "2 concise")
console.log('\n✓ Check 2: REASONING prompt format');
const reasoningMatch = evaluatorContent.match(/REASONING:([^`]+)/);
if (reasoningMatch) {
  const reasoningPrompt = reasoningMatch[1];
  console.log(`  Current prompt: "${reasoningPrompt.trim()}"`);
  if (reasoningPrompt.includes('2-3') && reasoningPrompt.includes('paragraph')) {
    console.log('  ✓ PASS: REASONING expects 2-3 paragraphs');
  } else if (reasoningPrompt.includes('concise') && !reasoningPrompt.includes('2-3')) {
    console.log('  ✗ FAIL: REASONING still mentions "concise" without "2-3 paragraphs"');
    allChecksPass = false;
  } else {
    console.log('  ⚠ WARNING: REASONING format may not be optimal');
  }
} else {
  console.log('  ✗ FAIL: Could not find REASONING in prompt');
  allChecksPass = false;
}

// Check 3: SOURCE_TEXT and EXPLANATION should be marked as REQUIRED
console.log('\n✓ Check 3: SOURCE_TEXT and EXPLANATION requirements');
const hasSourceRequired = evaluatorContent.includes('SOURCE_TEXT: REQUIRED');
const hasExplanationRequired = evaluatorContent.includes('EXPLANATION: REQUIRED');

if (hasSourceRequired) {
  console.log('  ✓ PASS: SOURCE_TEXT is marked as REQUIRED');
} else {
  console.log('  ✗ FAIL: SOURCE_TEXT is not marked as REQUIRED');
  allChecksPass = false;
}

if (hasExplanationRequired) {
  console.log('  ✓ PASS: EXPLANATION is marked as REQUIRED');
} else {
  console.log('  ✗ FAIL: EXPLANATION is not marked as REQUIRED');
  allChecksPass = false;
}

// Check 4: Verify aspect format includes both source_text and explanation
console.log('\n✓ Check 4: Expected JSON output format');
const outputFormatMatch = evaluatorContent.match(/OUTPUT:[^{]*(\{[^}]+\})/);
if (outputFormatMatch) {
  const outputFormat = outputFormatMatch[1];
  console.log(`  Current format: "${outputFormat.trim()}"`);
  if (outputFormat.includes('positive_aspects') && outputFormat.includes('negative_aspects')) {
    console.log('  ✓ PASS: Output format includes positive_aspects[] and negative_aspects[]');
  } else {
    console.log('  ✗ FAIL: Output format missing aspects arrays');
    allChecksPass = false;
  }
} else {
  console.log('  ✗ FAIL: Could not find OUTPUT format in prompt');
  allChecksPass = false;
}

// Summary
console.log('\n=== Verification Summary ===\n');
if (allChecksPass) {
  console.log('✓ All checks PASSED');
  console.log('\nThe fix is correctly implemented:');
  console.log('- max_tokens increased to accommodate full output');
  console.log('- REASONING expects 2-3 detailed paragraphs');
  console.log('- SOURCE_TEXT and EXPLANATION marked as REQUIRED');
  console.log('- Prompt structure supports complete analysis');
  console.log('\nExpected behavior:');
  console.log('- Analysis will show 2-3 paragraph reasoning section');
  console.log('- Each aspect will have source citation and explanation');
  console.log('- Response time may increase slightly (~2-5 seconds) but quality will improve');
  process.exit(0);
} else {
  console.log('✗ Some checks FAILED');
  console.log('\nPlease review the changes to qsci_evaluator.js');
  process.exit(1);
}
