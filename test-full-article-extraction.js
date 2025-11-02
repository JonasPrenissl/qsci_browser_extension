/**
 * Test script to verify full article content extraction
 * 
 * This script simulates the content extraction logic and verifies that
 * the full article content (not just abstract) is being captured.
 * 
 * Usage:
 * 1. Open the browser console on a Lancet article page
 * 2. Copy and paste this entire script
 * 3. Check the output to verify full content extraction
 */

(function testFullArticleExtraction() {
  console.log('=== Q-SCI Full Article Extraction Test ===\n');
  
  // Configuration (matches content-script.js after fix)
  const MAX_FULLTEXT_LENGTH = 100000;
  
  // Test 1: Check if main content containers exist
  console.log('Test 1: Checking for main content containers...');
  const main = document.querySelector('main');
  const article = document.querySelector('article');
  const articleBody = document.querySelector('section.article-body, .article-body');
  
  console.log('  - main element:', main ? '✓ Found' : '✗ Not found');
  console.log('  - article element:', article ? '✓ Found' : '✗ Not found');
  console.log('  - article-body element:', articleBody ? '✓ Found' : '✗ Not found');
  
  // Test 2: Extract content using the same logic as content-script.js
  console.log('\nTest 2: Extracting content...');
  
  let abstract = '';
  let fullText = '';
  
  // Try to find abstract/summary
  const summarySelectors = ['section.summary', '.summary', 'section.abstract', '.abstract'];
  for (const selector of summarySelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      abstract = element.textContent.trim();
      console.log('  - Abstract found with selector:', selector);
      console.log('  - Abstract length:', abstract.length, 'characters');
      break;
    }
  }
  
  // Try to find full text
  const contentSelectors = [
    'section.article-body',
    '.article-body',
    'main',
    'article',
    '[role="main"]'
  ];
  
  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      fullText = element.textContent.trim();
      console.log('  - Full text found with selector:', selector);
      console.log('  - Full text length:', fullText.length, 'characters');
      break;
    }
  }
  
  // Test 3: Combine content as content-script.js does
  console.log('\nTest 3: Combining content for analysis...');
  
  let analysisText = abstract || fullText || '';
  
  if (abstract && fullText && fullText !== abstract) {
    // This is the key line that was limiting content
    const limitedFullText = fullText.substring(0, MAX_FULLTEXT_LENGTH);
    analysisText = abstract + '\n\n' + limitedFullText;
    console.log('  - Combined abstract + full text');
    console.log('  - Full text was limited to:', MAX_FULLTEXT_LENGTH, 'characters');
    console.log('  - Actual full text length:', fullText.length, 'characters');
    console.log('  - Content was', fullText.length > MAX_FULLTEXT_LENGTH ? 'NOT truncated ✓' : 'truncated ✗');
  } else if (abstract) {
    analysisText = abstract;
    console.log('  - Using abstract only');
  } else if (fullText) {
    analysisText = fullText;
    console.log('  - Using full text only');
  }
  
  console.log('  - Final analysis text length:', analysisText.length, 'characters');
  
  // Test 4: Verify key sections are present
  console.log('\nTest 4: Verifying key sections are present...');
  
  const checkSection = (text, sectionName, keywords) => {
    const found = keywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    console.log('  -', sectionName + ':', found ? '✓ Found' : '✗ Not found');
    return found;
  };
  
  const hasBackground = checkSection(analysisText, 'Background', ['background', 'introduction']);
  const hasMethods = checkSection(analysisText, 'Methods', ['methods', 'study design', 'participants']);
  const hasResults = checkSection(analysisText, 'Results/Findings', ['results', 'findings', 'outcomes']);
  const hasDiscussion = checkSection(analysisText, 'Discussion/Interpretation', ['discussion', 'interpretation', 'conclusion']);
  
  // Test 5: Check for specific study details
  console.log('\nTest 5: Checking for specific study details...');
  
  const checkDetail = (text, detailName, keywords) => {
    const found = keywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    console.log('  -', detailName + ':', found ? '✓ Found' : '✗ Not found');
    return found;
  };
  
  checkDetail(analysisText, 'Sample size', ['patients', 'participants', 'subjects', 'n=', 'n =']);
  checkDetail(analysisText, 'Study design', ['randomized', 'randomised', 'controlled', 'trial', 'cohort', 'case-control']);
  checkDetail(analysisText, 'Statistical methods', ['p-value', 'p =', 'p<', 'confidence interval', 'hazard ratio', 'odds ratio', 'statistical']);
  checkDetail(analysisText, 'Outcomes', ['outcome', 'endpoint', 'survival', 'mortality', 'efficacy']);
  
  // Test 6: Final assessment
  console.log('\n=== Test Summary ===');
  
  const allSectionsPresent = hasBackground && hasMethods && hasResults && hasDiscussion;
  const sufficientLength = analysisText.length > 5000;
  
  console.log('All key sections present:', allSectionsPresent ? '✓ PASS' : '✗ FAIL');
  console.log('Sufficient content length:', sufficientLength ? '✓ PASS' : '✗ FAIL');
  console.log('Content extraction:', (allSectionsPresent && sufficientLength) ? '✓ WORKING CORRECTLY' : '✗ NEEDS ATTENTION');
  
  // Return results for programmatic access
  return {
    success: allSectionsPresent && sufficientLength,
    abstractLength: abstract.length,
    fullTextLength: fullText.length,
    analysisTextLength: analysisText.length,
    maxLimit: MAX_FULLTEXT_LENGTH,
    truncated: fullText.length > MAX_FULLTEXT_LENGTH,
    sections: {
      background: hasBackground,
      methods: hasMethods,
      results: hasResults,
      discussion: hasDiscussion
    },
    preview: analysisText.substring(0, 500)
  };
})();
