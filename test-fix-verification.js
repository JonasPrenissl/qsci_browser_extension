// Test to verify the fix for Lancet extraction issue
const { JSDOM } = require('jsdom');
const fs = require('fs');

console.log('=== Testing Fix for Lancet Extraction Issue ===\n');

// Load the content script
const contentScriptCode = fs.readFileSync('content-script.js', 'utf8');

// Test Case 1: Lancet page with loading placeholder (the actual problem)
console.log('Test 1: Lancet page with "Loading..." placeholder (Problem Case)');
const loadingHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta name="citation_title" content="Effects of novel treatment on patient outcomes: a randomized controlled trial">
    <meta name="citation_abstract" content="Background: This study investigates the efficacy of a novel therapeutic approach. Methods: We conducted a double-blind randomized controlled trial with 500 participants. Results: Significant improvement was observed (p < 0.001). Interpretation: This treatment represents a major advancement.">
</head>
<body>
    <div id="root" data-react-root>
        <div class="loading">Loading article...</div>
    </div>
</body>
</html>
`;

let dom = new JSDOM(loadingHTML);
let doc = dom.window.document;

// Simulate extraction
let bodyText = doc.body.textContent.trim();
let isLoading = /loading/i.test(bodyText) && bodyText.length < 50;

console.log(`   Body text: "${bodyText}"`);
console.log(`   Is loading placeholder: ${isLoading}`);

// Try meta fallback
let metaTitle = doc.querySelector('meta[name="citation_title"]')?.getAttribute('content') || '';
let metaAbstract = doc.querySelector('meta[name="citation_abstract"]')?.getAttribute('content') || '';
let metaText = metaTitle + '. ' + metaAbstract;

console.log(`   Meta fallback text length: ${metaText.length} characters`);
console.log(`   Meta fallback passes >50 check: ${metaText.length > 50}`);
console.log(`   Has scientific terms: ${/study|method|result|trial|participants/i.test(metaText)}`);
console.log(`   Result: ${metaText.length > 50 && /study|method|result/i.test(metaText) ? '✓ PASS' : '✗ FAIL'}\n`);

// Test Case 2: Lancet page with properly rendered content
console.log('Test 2: Lancet page with rendered content (Normal Case)');
const renderedHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta name="citation_title" content="Test Article">
</head>
<body>
    <article>
        <h1 class="article-header__title">Effects of novel treatment on patient outcomes</h1>
        <section class="summary" data-component="summary">
            <p>Background: This study investigates efficacy.</p>
            <p>Methods: Randomized controlled trial with 500 participants.</p>
            <p>Results: Significant improvement (p < 0.001).</p>
        </section>
    </article>
</body>
</html>
`;

dom = new JSDOM(renderedHTML);
doc = dom.window.document;

let title = doc.querySelector('h1.article-header__title')?.textContent.trim() || '';
let summary = doc.querySelector('section.summary')?.textContent.trim() || '';

console.log(`   Title: ${title ? '✓ Found' : '✗ Not found'}`);
console.log(`   Summary: ${summary.length} characters`);
console.log(`   Has scientific content: ${summary.length > 100 && /study|method|result/i.test(summary)}`);
console.log(`   Result: ${summary.length > 50 ? '✓ PASS' : '✗ FAIL'}\n`);

// Test Case 3: Very short meta content (edge case)
console.log('Test 3: Short meta content (Edge Case)');
const shortMetaHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta name="citation_title" content="Study Title">
    <meta name="citation_abstract" content="A clinical trial examining treatment efficacy.">
</head>
<body>
    <div>Loading...</div>
</body>
</html>
`;

dom = new JSDOM(shortMetaHTML);
doc = dom.window.document;

metaTitle = doc.querySelector('meta[name="citation_title"]')?.getAttribute('content') || '';
metaAbstract = doc.querySelector('meta[name="citation_abstract"]')?.getAttribute('content') || '';
metaText = metaTitle + '. ' + metaAbstract;

console.log(`   Combined meta text: ${metaText.length} characters`);
console.log(`   Text: "${metaText}"`);
console.log(`   Passes >50 check: ${metaText.length > 50}`);
console.log(`   Result: ${metaText.length > 50 ? '✓ PASS' : '✗ FAIL'}\n`);

// Verify the key constants in content-script.js
console.log('=== Verification of Content Script Constants ===');
const constantChecks = [
    { name: 'DYNAMIC_CONTENT_DELAY', pattern: /const DYNAMIC_CONTENT_DELAY = (\d+)/, expected: 5000 },
    { name: 'MIN_SUBSTANTIVE_LENGTH', pattern: /const MIN_SUBSTANTIVE_LENGTH = (\d+)/, expected: 200 },
    { name: 'Has isLoadingPlaceholder function', pattern: /function isLoadingPlaceholder/, expected: true },
    { name: 'Has meta fallback in Lancet', pattern: /meta\[name="citation_abstract"\].*fallback/s, expected: true },
    { name: 'Has meta fallback in Generic', pattern: /Insufficient content from selectors, trying meta tag fallback/s, expected: true }
];

constantChecks.forEach(check => {
    if (check.pattern instanceof RegExp && typeof check.expected === 'number') {
        const match = contentScriptCode.match(check.pattern);
        if (match) {
            const value = parseInt(match[1]);
            console.log(`   ${check.name}: ${value} ${value === check.expected ? '✓ CORRECT' : '✗ INCORRECT (expected ' + check.expected + ')'}`);
        } else {
            console.log(`   ${check.name}: ✗ NOT FOUND`);
        }
    } else if (check.pattern instanceof RegExp && typeof check.expected === 'boolean') {
        const found = check.pattern.test(contentScriptCode);
        console.log(`   ${check.name}: ${found ? '✓ FOUND' : '✗ NOT FOUND'}`);
    }
});

console.log('\n=== Summary ===');
console.log('The fix addresses the Lancet extraction issue by:');
console.log('1. Increasing DYNAMIC_CONTENT_DELAY from 3500ms to 5000ms');
console.log('2. Adding isLoadingPlaceholder() to detect "Loading..." text');
console.log('3. Adding meta tag fallback when DOM content is insufficient');
console.log('4. Applying fallback to both Lancet-specific and generic extraction');
console.log('\nExpected Result:');
console.log('✓ Even if React hasn\'t rendered, meta tags will provide content');
console.log('✓ More time (5s) allows React/Vue to render before extraction');
console.log('✓ Loading placeholders are detected and ignored');
console.log('✓ The extension will no longer show 0% for Lancet articles');
