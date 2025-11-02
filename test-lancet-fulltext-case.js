// Test a more realistic Lancet fulltext page structure
// Based on modern Lancet website patterns

const { JSDOM } = require('jsdom');

// Simulate a Lancet fulltext page that loads content dynamically
// This mimics what might happen if JS hasn't finished rendering yet
const lancetFulltextHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="citation_title" content="Effects of novel treatment on patient outcomes">
    <meta name="citation_abstract" content="This study examines treatment efficacy in a randomized trial.">
    <title>The Lancet</title>
</head>
<body>
    <div id="root">
        <!-- Initially, React might not have rendered the content yet -->
        <div class="loading-spinner">Loading article...</div>
    </div>
    <!-- After React renders, it would look like this: -->
    <!-- <div id="root">
        <article>
            <h1>Effects of novel treatment on patient outcomes</h1>
            <section data-component="summary">
                <p>Background: This study...</p>
            </section>
        </article>
    </div> -->
</body>
</html>
`;

console.log('=== Testing Lancet Fulltext Page (Before JS Renders) ===\n');

const dom = new JSDOM(lancetFulltextHTML);
const doc = dom.window.document;

// Try to extract content
const title = doc.querySelector('h1')?.textContent?.trim() || '';
const summary = doc.querySelector('[data-component="summary"]')?.textContent?.trim() || '';
const article = doc.querySelector('article')?.textContent?.trim() || '';
const bodyText = doc.body?.textContent?.trim() || '';
const metaTitle = doc.querySelector('meta[name="citation_title"]')?.getAttribute('content') || '';
const metaAbstract = doc.querySelector('meta[name="citation_abstract"]')?.getAttribute('content') || '';

console.log('Extraction Results:');
console.log(`1. H1 title: "${title}" (${title.length} chars)`);
console.log(`2. Summary section: "${summary}" (${summary.length} chars)`);
console.log(`3. Article tag: "${article}" (${article.length} chars)`);
console.log(`4. Body text: "${bodyText.substring(0, 50)}..." (${bodyText.length} chars)`);
console.log(`5. Meta title: "${metaTitle}" (${metaTitle.length} chars)`);
console.log(`6. Meta abstract: "${metaAbstract}" (${metaAbstract.length} chars)`);

console.log('\nProblem:');
console.log('- Body contains only "Loading article..." text');
console.log('- No article structure present');
console.log('- Only meta tags have actual content');

console.log('\nWhat gets extracted:');
const extractedText = summary || article || bodyText || title;
console.log(`Text: "${extractedText}" (${extractedText.length} chars)`);
console.log(`Passes >50 char check: ${extractedText.length > 50}`);
console.log(`Has scientific terms: ${/study|method|result|research/i.test(extractedText)}`);

console.log('\n=== Solution Required ===');
console.log('1. Increase wait time for dynamic content (currently 3500ms)');
console.log('2. Use meta tags as fallback when article structure is missing');
console.log('3. Detect "loading" placeholders and retry extraction');
console.log('4. Add mutation observer to detect when content is actually rendered');

// Test with meta fallback
console.log('\n=== Testing Meta Tag Fallback ===');
const metaOnlyText = metaTitle + ' ' + metaAbstract;
console.log(`Combined meta content: ${metaOnlyText.length} chars`);
console.log(`Preview: "${metaOnlyText}"`);
console.log(`Passes >50 char check: ${metaOnlyText.length > 50}`);
console.log(`Has scientific terms: ${/study|trial|treatment|efficacy/i.test(metaOnlyText)}`);
console.log(`Substantive (>200 chars): ${metaOnlyText.length >= 200}`);
