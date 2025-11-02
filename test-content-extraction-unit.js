/**
 * Unit tests for content extraction improvements
 * Tests the extraction logic without requiring a browser
 */

const { JSDOM } = require('jsdom');

// Simulate the extraction functions from content-script.js
const MIN_SUBSTANTIVE_LENGTH = 200;

function cleanExtractedText(text) {
  if (!text) return '';
  
  const patternsToRemove = [
    /\b(Home|About|Contact|Login|Sign in|Sign up|Register|Subscribe|Menu|Navigation)\b/gi,
    /\b(Cookie|Cookies|We use cookies|Accept cookies|Privacy Policy|Terms of Service)\b.*?(\.|$)/gi,
    /\b(Share|Tweet|Facebook|Twitter|LinkedIn|Email this|Print)\b/gi,
    /\b(Copyright|©|\(c\)|All rights reserved|Terms|Privacy)\b.*?(\.|$)/gi,
    /\b(Previous article|Next article|Back to|View PDF|Download PDF)\b/gi,
    /\b(Subscribe now|Get access|Purchase|Buy article)\b.*?(\.|$)/gi
  ];
  
  let cleaned = text;
  for (const pattern of patternsToRemove) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

function isSubstantiveScientificContent(text) {
  if (!text || text.length < MIN_SUBSTANTIVE_LENGTH) {
    return false;
  }
  
  const scientificIndicators = [
    /\b(study|trial|experiment|research|investigation|analysis|survey|cohort|sample)\b/i,
    /\b(method|methodology|procedure|protocol|measurement|data|statistical|participants?|patients?)\b/i,
    /\b(result|finding|outcome|conclusion|significant|p\s*[<>=]|effect|correlation)\b/i,
    /\b(abstract|introduction|background|methods?|results?|discussion|conclusion)\b/i,
    /\b(treatment|intervention|diagnosis|clinical|medical|therapeutic|disease|condition|syndrome)\b/i
  ];
  
  let indicatorCount = 0;
  for (const indicator of scientificIndicators) {
    if (indicator.test(text)) {
      indicatorCount++;
    }
  }
  
  return indicatorCount >= 2;
}

function testModernLancetExtraction() {
  console.log('\n=== Test: Modern Lancet-style structure with data attributes ===');
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="citation_title" content="Effects of Novel Treatment on Patient Outcomes">
        <meta name="citation_abstract" content="Background: This study investigates novel therapeutic approaches. Methods: We conducted a randomized controlled trial with 500 participants. Results: Significant improvement was observed (p < 0.001). Conclusion: This treatment represents a major advancement.">
      </head>
      <body>
        <article>
          <header>
            <h1 data-component="article-title">Effects of Novel Treatment on Patient Outcomes: A Randomized Controlled Trial</h1>
          </header>
          <section data-component="summary" data-testid="abstract">
            <h2>Summary</h2>
            <div itemprop="abstract">
              <p><strong>Background:</strong> This groundbreaking study investigates the efficacy of a novel therapeutic approach.</p>
              <p><strong>Methods:</strong> We conducted a double-blind, placebo-controlled randomized trial with 500 participants.</p>
              <p><strong>Findings:</strong> The treatment group showed significant improvement (p < 0.001) compared to placebo.</p>
            </div>
          </section>
          <section data-component="article-body">
            <h2>Introduction</h2>
            <p>Chronic diseases affect millions worldwide. This study addresses this critical gap.</p>
            <h2>Methods</h2>
            <p>Study design: Multicenter, double-blind, randomized controlled trial.</p>
          </section>
        </article>
      </body>
    </html>
  `;
  
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  // Test title extraction
  let title = '';
  const titleSelectors = [
    'h1[data-component="article-title"]',
    'meta[name="citation_title"]',
    'h1'
  ];
  
  for (const selector of titleSelectors) {
    if (selector.startsWith('meta')) {
      const element = document.querySelector(selector);
      if (element?.getAttribute('content')) {
        title = element.getAttribute('content');
        break;
      }
    } else {
      const element = document.querySelector(selector);
      if (element?.textContent) {
        title = element.textContent.trim();
        break;
      }
    }
  }
  
  // Test abstract extraction
  let abstract = '';
  const abstractSelectors = [
    '[data-component="summary"]',
    '[data-testid="abstract"]',
    'meta[name="citation_abstract"]'
  ];
  
  for (const selector of abstractSelectors) {
    if (selector.startsWith('meta')) {
      const element = document.querySelector(selector);
      if (element?.getAttribute('content')) {
        abstract = element.getAttribute('content');
        break;
      }
    } else {
      const element = document.querySelector(selector);
      if (element?.textContent) {
        abstract = element.textContent.trim();
        break;
      }
    }
  }
  
  // Test content extraction
  let fullText = '';
  const contentSelectors = [
    '[data-component="article-body"]',
    'article'
  ];
  
  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element?.textContent) {
      fullText = element.textContent.trim();
      break;
    }
  }
  
  const text = abstract || fullText || title;
  const cleaned = cleanExtractedText(text);
  const isSubstantive = isSubstantiveScientificContent(cleaned);
  
  console.log(`✓ Title found: ${title.length > 10}`);
  console.log(`✓ Abstract found: ${abstract.length > 100}`);
  console.log(`✓ Full text found: ${fullText.length > 100}`);
  console.log(`✓ Text length: ${text.length} (min: ${MIN_SUBSTANTIVE_LENGTH})`);
  console.log(`✓ Is substantive scientific content: ${isSubstantive}`);
  
  const passed = title.length > 10 && 
                 abstract.length > 100 && 
                 fullText.length > 100 && 
                 text.length >= MIN_SUBSTANTIVE_LENGTH && 
                 isSubstantive;
  
  if (passed) {
    console.log('✅ TEST PASSED');
  } else {
    console.log('❌ TEST FAILED');
  }
  
  return passed;
}

function testClassicSemanticStructure() {
  console.log('\n=== Test: Classic semantic HTML structure ===');
  
  const html = `
    <!DOCTYPE html>
    <html>
      <body>
        <h1 class="article-header__title">Cardiovascular Risk Factors in Urban Populations</h1>
        <section class="summary">
          <h2>Summary</h2>
          <p><strong>Background:</strong> Urban environments present unique cardiovascular risk factors.</p>
          <p><strong>Methods:</strong> We analyzed data from 10,000 participants in major urban centers.</p>
          <p><strong>Findings:</strong> Urban-specific factors contributed significantly to cardiovascular risk.</p>
        </section>
        <section class="article-body">
          <h3>Introduction</h3>
          <p>Cardiovascular disease remains the leading cause of mortality globally.</p>
          <h3>Study Population</h3>
          <p>We recruited participants from five major cities, ensuring diverse representation.</p>
        </section>
      </body>
    </html>
  `;
  
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  const title = document.querySelector('h1.article-header__title')?.textContent?.trim() || '';
  const abstract = document.querySelector('section.summary')?.textContent?.trim() || '';
  const fullText = document.querySelector('section.article-body')?.textContent?.trim() || '';
  
  const text = abstract || fullText || title;
  const cleaned = cleanExtractedText(text);
  const isSubstantive = isSubstantiveScientificContent(cleaned);
  
  console.log(`✓ Title found: ${title.length > 10}`);
  console.log(`✓ Abstract found: ${abstract.length > 100}`);
  console.log(`✓ Full text found: ${fullText.length > 100}`);
  console.log(`✓ Text length: ${text.length}`);
  console.log(`✓ Is substantive: ${isSubstantive}`);
  
  const passed = title.length > 10 && 
                 abstract.length > 100 && 
                 fullText.length > 100 && 
                 isSubstantive;
  
  if (passed) {
    console.log('✅ TEST PASSED');
  } else {
    console.log('❌ TEST FAILED');
  }
  
  return passed;
}

function testNavigationFiltering() {
  console.log('\n=== Test: Navigation and non-content filtering ===');
  
  const html = `
    <!DOCTYPE html>
    <html>
      <body>
        <nav>
          <p>Home About Contact Login Subscribe Menu Navigation</p>
        </nav>
        <header>
          <p>Cookie Policy Privacy Terms of Service Accept cookies</p>
        </header>
        <article>
          <h1>Climate Change Effects on Biodiversity</h1>
          <p>This study examines the effects of climate change on biodiversity in temperate forests. We conducted a longitudinal analysis over 10 years with comprehensive data collection.</p>
          <p>Our findings indicate significant changes in species distribution and abundance, with implications for conservation strategies and ecosystem management.</p>
        </article>
        <footer>
          <p>Copyright 2024 All rights reserved Terms Privacy</p>
        </footer>
      </body>
    </html>
  `;
  
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  // Extract article content
  const articleParagraphs = Array.from(document.querySelectorAll('article p'));
  const articleText = articleParagraphs.map(p => p.textContent?.trim()).join(' ');
  
  // Extract navigation content
  const navElements = Array.from(document.querySelectorAll('nav, header, footer'));
  const navText = navElements.map(el => el.textContent?.trim()).join(' ');
  
  const cleanedArticle = cleanExtractedText(articleText);
  const cleanedNav = cleanExtractedText(navText);
  
  const articleHasScience = /\b(study|research|data|analysis|findings?)\b/i.test(articleText);
  const navHasScience = /\b(study|research|data|analysis|findings?)\b/i.test(navText);
  
  console.log(`✓ Article text length: ${articleText.length}`);
  console.log(`✓ Navigation text length: ${navText.length}`);
  console.log(`✓ Article has scientific terms: ${articleHasScience}`);
  console.log(`✓ Navigation has scientific terms: ${navHasScience}`);
  console.log(`✓ Cleaned article length: ${cleanedArticle.length}`);
  console.log(`✓ Cleaned nav length: ${cleanedNav.length}`);
  
  const passed = articleText.length > 100 && 
                 articleHasScience && 
                 !navHasScience &&
                 cleanedNav.length < navText.length; // Cleaning should remove some nav text
  
  if (passed) {
    console.log('✅ TEST PASSED');
  } else {
    console.log('❌ TEST FAILED');
  }
  
  return passed;
}

function testContentValidation() {
  console.log('\n=== Test: Scientific content validation ===');
  
  const scientificText = `
    Background: This study investigates the efficacy of a novel treatment approach.
    Methods: We conducted a randomized controlled trial with 500 participants over 12 months.
    Results: Significant improvement was observed in the treatment group (p < 0.001).
    Conclusion: This treatment represents a major advancement in patient care.
  `;
  
  const nonScientificText = `
    Welcome to our website! We offer the best products at competitive prices.
    Subscribe to our newsletter for exclusive deals. Contact us today to learn more.
    Follow us on social media for updates. Terms and conditions apply.
  `;
  
  const isScientific = isSubstantiveScientificContent(scientificText);
  const isNonScientific = isSubstantiveScientificContent(nonScientificText);
  
  console.log(`✓ Scientific text validated as scientific: ${isScientific}`);
  console.log(`✓ Non-scientific text validated as non-scientific: ${!isNonScientific}`);
  
  const passed = isScientific && !isNonScientific;
  
  if (passed) {
    console.log('✅ TEST PASSED');
  } else {
    console.log('❌ TEST FAILED');
  }
  
  return passed;
}

// Run all tests
console.log('===============================================');
console.log('  Content Extraction Improvements - Unit Tests');
console.log('===============================================');

const results = [
  testModernLancetExtraction(),
  testClassicSemanticStructure(),
  testNavigationFiltering(),
  testContentValidation()
];

const passed = results.filter(r => r).length;
const total = results.length;

console.log('\n===============================================');
console.log(`  Results: ${passed}/${total} tests passed`);
console.log('===============================================');

if (passed === total) {
  console.log('✅ ALL TESTS PASSED');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED');
  process.exit(1);
}
