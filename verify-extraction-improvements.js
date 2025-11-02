#!/usr/bin/env node

/**
 * Verification Script for Content Extraction Improvements
 * 
 * This script verifies that the content extraction enhancements
 * are properly implemented and can handle various HTML structures.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Q-SCI Content Extraction Verification\n');
console.log('=' .repeat(60));

// Check if content-script.js exists
const contentScriptPath = path.join(__dirname, 'content-script.js');
if (!fs.existsSync(contentScriptPath)) {
  console.error('❌ content-script.js not found!');
  process.exit(1);
}

console.log('✓ content-script.js found');

// Read the content script
const contentScript = fs.readFileSync(contentScriptPath, 'utf-8');

// Verification checklist
const checks = [
  {
    name: 'Dynamic content delay constant',
    pattern: /DYNAMIC_CONTENT_DELAY\s*=\s*2500/,
    description: 'Checks for the new dynamic content delay constant'
  },
  {
    name: 'Dynamic content detection',
    pattern: /\[data-react-root\].*\[data-reactroot\].*#root.*#app/,
    description: 'Checks for React/Vue/Angular detection'
  },
  {
    name: 'data-component selectors',
    pattern: /\[data-component[^\]]*\]/g,
    description: 'Checks for data-component attribute selectors',
    minMatches: 10
  },
  {
    name: 'data-testid selectors',
    pattern: /\[data-testid[^\]]*\]/g,
    description: 'Checks for data-testid attribute selectors',
    minMatches: 5
  },
  {
    name: 'Schema.org itemprop selectors',
    pattern: /\[itemprop[^\]]*\]/g,
    description: 'Checks for Schema.org itemprop selectors',
    minMatches: 5
  },
  {
    name: 'Enhanced Lancet title selectors',
    pattern: /lancetTitleSelectors[\s\S]{0,1000}data-component.*article-title/,
    description: 'Checks for enhanced Lancet title extraction'
  },
  {
    name: 'Enhanced Lancet abstract selectors',
    pattern: /lancetAbstractSelectors[\s\S]{0,2000}data-component.*summary/,
    description: 'Checks for enhanced Lancet abstract extraction'
  },
  {
    name: 'Paragraph filtering (nav, header, footer)',
    pattern: /p\.closest\(['"]nav['"]\)/,
    description: 'Checks for improved paragraph filtering'
  },
  {
    name: 'Section container detection',
    pattern: /section\[id\*=['"](abstract|section)['"]\]/,
    description: 'Checks for section-based content detection'
  },
  {
    name: 'Increased extraction delay',
    pattern: /EXTRACTION_DELAY\s*=\s*2000/,
    description: 'Checks for increased base extraction delay'
  }
];

let passed = 0;
let failed = 0;

console.log('\n📋 Running verification checks...\n');

checks.forEach((check, index) => {
  process.stdout.write(`${index + 1}. ${check.name}... `);
  
  if (check.minMatches) {
    // Check for minimum number of matches
    const matches = contentScript.match(check.pattern);
    const matchCount = matches ? matches.length : 0;
    
    if (matchCount >= check.minMatches) {
      console.log(`✓ PASS (${matchCount} found)`);
      passed++;
    } else {
      console.log(`✗ FAIL (${matchCount} found, need ${check.minMatches})`);
      failed++;
    }
  } else {
    // Check for presence
    if (check.pattern.test(contentScript)) {
      console.log('✓ PASS');
      passed++;
    } else {
      console.log('✗ FAIL');
      failed++;
    }
  }
  
  if (check.description) {
    console.log(`   ${check.description}`);
  }
  console.log();
});

console.log('=' .repeat(60));
console.log(`\n📊 Results: ${passed}/${checks.length} checks passed`);

if (failed > 0) {
  console.log(`\n⚠️  ${failed} check(s) failed. Please review the implementation.`);
  process.exit(1);
} else {
  console.log('\n✅ All verification checks passed!');
  console.log('\n📝 Next Steps:');
  console.log('   1. Build the extension: npm run build');
  console.log('   2. Load it in Chrome (chrome://extensions/)');
  console.log('   3. Test on The Lancet website');
  console.log('   4. Check browser console for extraction logs');
  process.exit(0);
}
