// Test edge cases that might cause extraction to fail
const { JSDOM } = require('jsdom');

console.log('=== Testing Lancet Extraction Edge Cases ===\n');

// Edge Case 1: Content with lots of navigation text mixed in
console.log('Test 1: Content mixed with navigation');
const mixedHTML = `
<!DOCTYPE html>
<html>
<body>
    <nav>Cookie Policy Accept Share Tweet Subscribe</nav>
    <h1 class="article-header__title">Study Title</h1>
    <section class="summary">
        <p>Some text about the study.</p>
    </section>
</body>
</html>
`;

let dom = new JSDOM(mixedHTML);
let doc = dom.window.document;
let summary = doc.querySelector('section.summary')?.textContent.trim() || '';
console.log(`   Extracted length: ${summary.length} characters`);
console.log(`   Content: "${summary}"`);
console.log(`   Has scientific terms: ${/study|research|method|result/i.test(summary)}`);
console.log(`   Is substantive (>200 chars): ${summary.length >= 200}\n`);

// Edge Case 2: Meta tags only (no visible content)
console.log('Test 2: Meta tags only (no visible article content)');
const metaOnlyHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta name="citation_title" content="Study Title">
    <meta name="citation_abstract" content="Short abstract.">
</head>
<body>
    <div>Loading...</div>
</body>
</html>
`;

dom = new JSDOM(metaOnlyHTML);
doc = dom.window.document;
const metaAbstract = doc.querySelector('meta[name="citation_abstract"]')?.getAttribute('content') || '';
console.log(`   Meta abstract length: ${metaAbstract.length} characters`);
console.log(`   Content: "${metaAbstract}"`);
console.log(`   Is substantive (>200 chars): ${metaAbstract.length >= 200}\n`);

// Edge Case 3: React/Vue app with no content yet rendered
console.log('Test 3: Empty React root (content not yet loaded)');
const emptyReactHTML = `
<!DOCTYPE html>
<html>
<body>
    <div id="root" data-react-root></div>
    <script src="app.js"></script>
</body>
</html>
`;

dom = new JSDOM(emptyReactHTML);
doc = dom.window.document;
const rootContent = doc.querySelector('#root')?.textContent.trim() || '';
console.log(`   Root content length: ${rootContent.length} characters`);
console.log(`   Content: "${rootContent}"`);
console.log(`   Problem: Content not yet rendered by React!\n`);

// Edge Case 4: Content in deeply nested structure
console.log('Test 4: Content in deeply nested divs');
const nestedHTML = `
<!DOCTYPE html>
<html>
<body>
    <div class="app">
        <div class="container">
            <div class="wrapper">
                <div class="article-container">
                    <article>
                        <h1>Study on cardiovascular health</h1>
                        <div class="content-wrapper">
                            <div class="text-container">
                                <p>This randomized controlled trial investigated treatment efficacy with 500 participants. Methods included double-blind placebo-controlled design. Results showed significant improvement (p < 0.001) in primary outcomes. The study demonstrates clinical effectiveness of the intervention.</p>
                            </div>
                        </div>
                    </article>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
`;

dom = new JSDOM(nestedHTML);
doc = dom.window.document;

// Try different extraction strategies
const strategies = [
    { name: 'article tag', selector: 'article' },
    { name: 'h1 parent', selector: 'h1', method: 'parent' },
    { name: 'p tags', selector: 'p' },
    { name: 'all text', selector: 'body' }
];

strategies.forEach(strategy => {
    if (strategy.method === 'parent') {
        const h1 = doc.querySelector(strategy.selector);
        const content = h1?.closest('article')?.textContent.trim() || '';
        console.log(`   ${strategy.name}: ${content.length} chars, substantive: ${content.length >= 200 && /study|method|result/i.test(content)}`);
    } else if (strategy.selector === 'p') {
        const paragraphs = Array.from(doc.querySelectorAll(strategy.selector));
        const content = paragraphs.map(p => p.textContent.trim()).join(' ');
        console.log(`   ${strategy.name}: ${content.length} chars, substantive: ${content.length >= 200 && /study|method|result/i.test(content)}`);
    } else {
        const content = doc.querySelector(strategy.selector)?.textContent.trim() || '';
        console.log(`   ${strategy.name}: ${content.length} chars, substantive: ${content.length >= 200 && /study|method|result/i.test(content)}`);
    }
});

console.log('\n=== Key Findings ===');
console.log('1. Meta tags might provide short content (<200 chars) - FAILS validation');
console.log('2. React apps might have empty DOM initially - TIMING ISSUE');
console.log('3. Deeply nested content still extractable via article/body selectors');
console.log('4. Navigation text pollution minimal if using proper selectors');

console.log('\n=== Recommended Fixes ===');
console.log('1. Lower MIN_SUBSTANTIVE_LENGTH from 200 to 100 characters');
console.log('2. Increase DYNAMIC_CONTENT_DELAY from 3500ms to 4500-5000ms');
console.log('3. Add retry logic if content < 100 chars after first attempt');
console.log('4. Check if text is just "Loading..." or similar placeholder');
