// Test script to validate Lancet selectors
// This simulates what the content script should extract

const { JSDOM } = require('jsdom');
const fs = require('fs');

// Simulate a typical Lancet /fulltext page structure
const lancetHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="citation_title" content="Effects of novel treatment on patient outcomes: a randomized controlled trial">
    <meta name="citation_abstract" content="Background: This study investigates the efficacy of a novel therapeutic approach. Methods: Randomized controlled trial with 500 participants. Findings: Treatment group showed significant improvement (p < 0.001). Interpretation: This treatment represents a major advancement in patient care.">
    <meta property="og:title" content="Effects of novel treatment - The Lancet">
    <title>Effects of novel treatment on patient outcomes: a randomized controlled trial - The Lancet</title>
</head>
<body>
    <div id="root" data-react-root>
        <nav class="main-navigation">
            <p>Home</p>
            <p>Subscribe</p>
            <p>Login</p>
        </nav>
        
        <main>
            <article>
                <header class="article-header">
                    <h1 class="article-header__title">Effects of novel treatment on patient outcomes: a randomized controlled trial</h1>
                </header>
                
                <section class="summary" data-component="summary">
                    <h2>Summary</h2>
                    <div class="summary-content">
                        <h3>Background</h3>
                        <p>This groundbreaking study investigates the efficacy of a novel therapeutic approach in treating chronic conditions that significantly impact patient quality of life worldwide.</p>
                        
                        <h3>Methods</h3>
                        <p>We conducted a double-blind, placebo-controlled randomized trial with 500 participants across 20 centers over a 12-month period. Primary outcome was change in quality of life score.</p>
                        
                        <h3>Findings</h3>
                        <p>The treatment group showed significant improvement (p < 0.001) compared to placebo, with minimal adverse effects reported. Effect size was clinically meaningful (Cohen's d = 0.8).</p>
                        
                        <h3>Interpretation</h3>
                        <p>This novel treatment represents a major advancement in patient care and warrants further investigation in larger populations and diverse settings.</p>
                    </div>
                </section>
                
                <section class="article-body" data-component="article-body">
                    <h2>Introduction</h2>
                    <p>Chronic diseases affect millions worldwide, and current treatment options remain limited. This study addresses this critical gap by evaluating a novel therapeutic approach.</p>
                    
                    <h2>Methods</h2>
                    <h3>Study design and participants</h3>
                    <p>This was a multicenter, double-blind, randomized controlled trial. We enrolled adults aged 18-75 years with confirmed diagnosis. Participants were randomly assigned to treatment or placebo groups using computer-generated randomization sequences.</p>
                    
                    <h3>Procedures</h3>
                    <p>The intervention consisted of daily administration of the novel compound for 12 months. Follow-up assessments occurred at months 3, 6, 9, and 12.</p>
                    
                    <h3>Statistical analysis</h3>
                    <p>We used intention-to-treat analysis. Between-group differences were assessed using mixed-effects models. Statistical significance was set at p < 0.05.</p>
                    
                    <h2>Results</h2>
                    <p>Primary outcome showed significant improvement in the treatment group compared to control (mean difference 12.5 points, 95% CI 9.2-15.8, p < 0.001). Secondary outcomes also favored the intervention.</p>
                    
                    <h2>Discussion</h2>
                    <p>This study demonstrates the efficacy and safety of the novel treatment. The findings have important implications for clinical practice and future research directions.</p>
                </section>
            </article>
        </main>
        
        <footer>
            <p>© 2025 The Lancet</p>
            <p>Privacy Policy | Terms of Service</p>
        </footer>
    </div>
</body>
</html>
`;

// Create a JSDOM instance
const dom = new JSDOM(lancetHTML);
const document = dom.window.document;

console.log('=== Testing Lancet Content Extraction ===\n');

// Test title extraction
console.log('1. Testing Title Extraction:');
const titleSelectors = [
    'h1.article-header__title',
    'h1.article-title',
    '.article-header h1',
    'header h1',
    '[data-component="article-header"] h1',
    '[data-testid="article-title"]',
    '[data-component="article-title"]',
    'h1[itemprop="headline"]',
    'h1[itemprop="name"]',
    'meta[name="citation_title"]',
    'meta[property="og:title"]',
    'h1'
];

let titleFound = false;
for (const selector of titleSelectors) {
    if (selector.startsWith('meta')) {
        const element = document.querySelector(selector);
        if (element && element.getAttribute('content')) {
            console.log(`   ✓ Found with selector: ${selector}`);
            console.log(`     Title: ${element.getAttribute('content').substring(0, 60)}...`);
            titleFound = true;
            break;
        }
    } else {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
            console.log(`   ✓ Found with selector: ${selector}`);
            console.log(`     Title: ${element.textContent.trim().substring(0, 60)}...`);
            titleFound = true;
            break;
        }
    }
}
if (!titleFound) console.log('   ✗ No title found');

// Test abstract/summary extraction
console.log('\n2. Testing Abstract/Summary Extraction:');
const abstractSelectors = [
    'section.summary',
    '.summary',
    'section.abstract',
    '.abstract',
    '[data-component="abstract"]',
    '[data-component="summary"]',
    '[data-testid="abstract"]',
    '[data-testid="summary"]',
    'meta[name="citation_abstract"]'
];

let abstractFound = false;
for (const selector of abstractSelectors) {
    if (selector.startsWith('meta')) {
        const element = document.querySelector(selector);
        if (element && element.getAttribute('content')) {
            const content = element.getAttribute('content');
            console.log(`   ✓ Found with selector: ${selector}`);
            console.log(`     Length: ${content.length} characters`);
            console.log(`     Preview: ${content.substring(0, 80)}...`);
            abstractFound = true;
            break;
        }
    } else {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
            const content = element.textContent.trim();
            console.log(`   ✓ Found with selector: ${selector}`);
            console.log(`     Length: ${content.length} characters`);
            console.log(`     Preview: ${content.substring(0, 80)}...`);
            abstractFound = true;
            break;
        }
    }
}
if (!abstractFound) console.log('   ✗ No abstract found');

// Test full text extraction
console.log('\n3. Testing Full Text Extraction:');
const contentSelectors = [
    'section.article-body',
    '.article-body',
    '[data-component="article-body"]',
    '[data-testid="article-body"]',
    '[itemprop="articleBody"]'
];

let contentFound = false;
for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
        const content = element.textContent.trim();
        console.log(`   ✓ Found with selector: ${selector}`);
        console.log(`     Length: ${content.length} characters`);
        console.log(`     Preview: ${content.substring(0, 80)}...`);
        contentFound = true;
        break;
    }
}
if (!contentFound) console.log('   ✗ No content found');

// Test scientific content validation
console.log('\n4. Testing Scientific Content Validation:');
const fullText = document.querySelector('section.summary')?.textContent.trim() || '';
const scientificIndicators = [
    { name: 'Study design', pattern: /\b(study|trial|experiment|research|investigation|analysis|survey|cohort|sample)\b/i },
    { name: 'Methods', pattern: /\b(method|methodology|procedure|protocol|measurement|data|statistical|participants?|patients?)\b/i },
    { name: 'Results', pattern: /\b(result|finding|outcome|conclusion|significant|p\s*[<>=]|effect|correlation)\b/i },
    { name: 'Structure', pattern: /\b(abstract|introduction|background|methods?|results?|discussion|conclusion)\b/i },
    { name: 'Medical terms', pattern: /\b(treatment|intervention|diagnosis|clinical|medical|therapeutic|disease|condition|syndrome)\b/i }
];

let matchCount = 0;
scientificIndicators.forEach(indicator => {
    if (indicator.pattern.test(fullText)) {
        console.log(`   ✓ ${indicator.name} terms found`);
        matchCount++;
    } else {
        console.log(`   ✗ ${indicator.name} terms NOT found`);
    }
});

const isSubstantive = matchCount >= 2 && fullText.length >= 200;
console.log(`\n   Summary: ${matchCount}/5 indicator categories matched`);
console.log(`   Text length: ${fullText.length} characters`);
console.log(`   Is substantive: ${isSubstantive ? '✓ YES' : '✗ NO'}`);

// Test navigation filtering
console.log('\n5. Testing Navigation Filtering:');
const navElements = document.querySelectorAll('nav p');
const articleElements = document.querySelectorAll('article p');
console.log(`   Navigation paragraphs: ${navElements.length}`);
console.log(`   Article paragraphs: ${articleElements.length}`);

const navText = Array.from(navElements).map(p => p.textContent.trim()).join(' ');
const hasNavTerms = /\b(home|login|subscribe|menu)\b/i.test(navText);
console.log(`   Navigation contains menu items: ${hasNavTerms ? '✓ YES' : '✗ NO'}`);

console.log('\n=== Test Complete ===');
