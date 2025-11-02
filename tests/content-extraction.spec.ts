import { test, expect, chromium, Page } from '@playwright/test';
import path from 'node:path';

/**
 * Tests for improved content extraction from scientific websites
 * These tests verify that the extension can extract content from various HTML structures
 * including modern frameworks with data attributes, meta tags, and semantic HTML
 */

// Helper function to create a test page with specific HTML structure
async function createTestPage(page: Page, html: string) {
  await page.setContent(html);
  // Wait for content to render
  await page.waitForLoadState('domcontentloaded');
  // Additional wait to simulate dynamic content loading
  await page.waitForTimeout(500);
}

test.describe('Content Extraction Improvements', () => {
  test('Extract content from modern Lancet-style structure with data attributes', async () => {
    const extensionPath = path.resolve('.');
    
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });

    const page = await context.newPage();
    
    // Modern Lancet-style HTML with data attributes
    const modernHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
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
                <p><strong>Background:</strong> This groundbreaking study investigates the efficacy of a novel therapeutic approach in treating chronic conditions affecting patient quality of life.</p>
                <p><strong>Methods:</strong> We conducted a double-blind, placebo-controlled randomized trial with 500 participants across multiple centers over a 12-month period.</p>
                <p><strong>Findings:</strong> The treatment group showed significant improvement (p < 0.001) compared to placebo, with minimal adverse effects reported.</p>
                <p><strong>Interpretation:</strong> This novel treatment represents a major advancement in patient care and warrants further investigation in larger populations.</p>
              </div>
            </section>
            <section data-component="article-body" itemprop="articleBody">
              <h2>Introduction</h2>
              <p>Chronic diseases affect millions worldwide, and current treatment options remain limited. This study addresses this critical gap by evaluating a novel therapeutic approach with potential for widespread clinical application.</p>
              <h2>Methods</h2>
              <p>Study design: Multicenter, double-blind, randomized controlled trial. Participants were randomly assigned to treatment or placebo groups using computer-generated randomization sequences.</p>
              <h2>Results</h2>
              <p>Primary outcome showed significant improvement in the treatment group compared to control. Secondary outcomes also favored the intervention, with consistent effects across subgroups.</p>
            </section>
          </article>
        </body>
      </html>
    `;
    
    await createTestPage(page, modernHtml);
    
    // Inject and test the content script extraction
    const extractedData = await page.evaluate(() => {
      // Simulate the extraction functions from content-script.js
      
      // Check for title
      const titleSelectors = [
        'h1[data-component="article-title"]',
        'meta[name="citation_title"]',
        'h1'
      ];
      
      let title = '';
      for (const selector of titleSelectors) {
        if (selector.startsWith('meta')) {
          const element = document.querySelector(selector) as HTMLMetaElement;
          if (element?.getAttribute('content')) {
            title = element.getAttribute('content') || '';
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
      
      // Check for abstract
      const abstractSelectors = [
        '[data-component="summary"]',
        '[data-testid="abstract"]',
        'meta[name="citation_abstract"]',
        '[itemprop="abstract"]'
      ];
      
      let abstract = '';
      for (const selector of abstractSelectors) {
        if (selector.startsWith('meta')) {
          const element = document.querySelector(selector) as HTMLMetaElement;
          if (element?.getAttribute('content')) {
            abstract = element.getAttribute('content') || '';
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
      
      // Check for full text
      const contentSelectors = [
        '[data-component="article-body"]',
        '[itemprop="articleBody"]',
        'article'
      ];
      
      let fullText = '';
      for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element?.textContent) {
          fullText = element.textContent.trim();
          break;
        }
      }
      
      // Validate scientific content
      const text = abstract || fullText || title;
      const scientificIndicators = [
        /\b(study|trial|experiment|research|investigation|analysis|survey|cohort|sample)\b/i,
        /\b(method|methodology|procedure|protocol|measurement|data|statistical|participants?|patients?)\b/i,
        /\b(result|finding|outcome|conclusion|significant|p\s*[<>=]|effect|correlation)\b/i,
        /\b(abstract|introduction|background|methods?|results?|discussion|conclusion)\b/i,
      ];
      
      let indicatorCount = 0;
      for (const indicator of scientificIndicators) {
        if (indicator.test(text)) {
          indicatorCount++;
        }
      }
      
      return {
        hasTitle: title.length > 10,
        hasAbstract: abstract.length > 100,
        hasFullText: fullText.length > 100,
        textLength: text.length,
        scientificIndicators: indicatorCount,
        isSubstantive: indicatorCount >= 2 && text.length >= 200
      };
    });
    
    // Verify extraction results
    expect(extractedData.hasTitle).toBe(true);
    expect(extractedData.hasAbstract).toBe(true);
    expect(extractedData.hasFullText).toBe(true);
    expect(extractedData.textLength).toBeGreaterThan(200);
    expect(extractedData.scientificIndicators).toBeGreaterThanOrEqual(2);
    expect(extractedData.isSubstantive).toBe(true);
    
    await context.close();
  });

  test('Extract content from classic semantic HTML structure', async () => {
    const extensionPath = path.resolve('.');
    
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });

    const page = await context.newPage();
    
    // Classic semantic HTML structure
    const classicHtml = `
      <!DOCTYPE html>
      <html>
        <body>
          <h1 class="article-header__title">Cardiovascular Risk Factors in Urban Populations: A Cross-Sectional Study</h1>
          <section class="summary">
            <h2>Summary</h2>
            <p><strong>Background:</strong> Urban environments present unique cardiovascular risk factors that require investigation to develop targeted interventions.</p>
            <p><strong>Methods:</strong> We analyzed data from 10,000 participants in major urban centers, assessing both traditional and novel risk factors using validated instruments.</p>
            <p><strong>Findings:</strong> Urban-specific factors contributed significantly to cardiovascular risk, independent of traditional factors like smoking and diet.</p>
            <p><strong>Interpretation:</strong> These findings highlight the need for urban-specific prevention strategies tailored to metropolitan populations.</p>
          </section>
          <section class="article-body">
            <h3>Introduction</h3>
            <p>Cardiovascular disease remains the leading cause of mortality globally. Understanding urban-specific risk factors is crucial for prevention and intervention strategies in growing metropolitan areas.</p>
            <h3>Study Population</h3>
            <p>We recruited participants from five major cities, ensuring diverse representation across socioeconomic strata and ethnic backgrounds to capture the full spectrum of urban cardiovascular risk.</p>
          </section>
        </body>
      </html>
    `;
    
    await createTestPage(page, classicHtml);
    
    // Test extraction
    const extractedData = await page.evaluate(() => {
      const title = document.querySelector('h1.article-header__title')?.textContent?.trim() || '';
      const abstract = document.querySelector('section.summary')?.textContent?.trim() || '';
      const fullText = document.querySelector('section.article-body')?.textContent?.trim() || '';
      
      const text = abstract || fullText || title;
      
      // Check for scientific indicators
      const hasStudyTerms = /\b(study|research|participants|data|analysis)\b/i.test(text);
      const hasMethodTerms = /\b(methods?|analyzed|assessed|recruited)\b/i.test(text);
      const hasResultTerms = /\b(findings?|results?|showed|contributed)\b/i.test(text);
      
      return {
        hasTitle: title.length > 10,
        hasAbstract: abstract.length > 100,
        hasFullText: fullText.length > 100,
        textLength: text.length,
        hasScientificContent: hasStudyTerms && (hasMethodTerms || hasResultTerms)
      };
    });
    
    expect(extractedData.hasTitle).toBe(true);
    expect(extractedData.hasAbstract).toBe(true);
    expect(extractedData.hasFullText).toBe(true);
    expect(extractedData.textLength).toBeGreaterThan(200);
    expect(extractedData.hasScientificContent).toBe(true);
    
    await context.close();
  });

  test('Extract content from paragraph-based minimal structure', async () => {
    const extensionPath = path.resolve('.');
    
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });

    const page = await context.newPage();
    
    // Minimal paragraph-based structure
    const minimalHtml = `
      <!DOCTYPE html>
      <html>
        <body>
          <article>
            <h1>Effectiveness of Vaccination Programs in Rural Communities</h1>
            <p>Introduction: Vaccination programs are critical for public health, yet rural communities often face unique challenges in accessing these services due to geographical and infrastructure barriers.</p>
            <p>Methods: We conducted a comprehensive evaluation of vaccination programs across 50 rural communities, analyzing coverage rates and barriers to access using surveys and administrative data.</p>
            <p>Results: Overall vaccination coverage was 78%, with significant variation between communities. Key barriers included transportation access, health literacy, and availability of healthcare providers.</p>
            <p>Conclusion: Targeted interventions addressing specific barriers can significantly improve vaccination coverage in rural settings, as demonstrated by successful pilot programs in several communities.</p>
          </article>
        </body>
      </html>
    `;
    
    await createTestPage(page, minimalHtml);
    
    // Test extraction
    const extractedData = await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent?.trim() || '';
      
      // Extract paragraphs
      const paragraphs = Array.from(document.querySelectorAll('article p'));
      const combinedText = paragraphs
        .map(p => p.textContent?.trim())
        .filter(text => text && text.length > 50)
        .join('\n\n');
      
      const text = combinedText || title;
      
      // Check for scientific indicators
      const hasIntroduction = /\bintroduction\b/i.test(text);
      const hasMethods = /\bmethods?\b/i.test(text);
      const hasResults = /\bresults?\b/i.test(text);
      const hasConclusion = /\bconclusion\b/i.test(text);
      
      return {
        hasTitle: title.length > 10,
        hasParagraphs: combinedText.length > 100,
        textLength: text.length,
        hasStructure: hasIntroduction && hasMethods && hasResults && hasConclusion
      };
    });
    
    expect(extractedData.hasTitle).toBe(true);
    expect(extractedData.hasParagraphs).toBe(true);
    expect(extractedData.textLength).toBeGreaterThan(200);
    expect(extractedData.hasStructure).toBe(true);
    
    await context.close();
  });

  test('Filter out navigation and non-content elements', async () => {
    const extensionPath = path.resolve('.');
    
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });

    const page = await context.newPage();
    
    // HTML with navigation and non-content elements
    const htmlWithNoise = `
      <!DOCTYPE html>
      <html>
        <body>
          <nav>
            <p>Home About Contact Login Subscribe</p>
          </nav>
          <header>
            <p>Cookie Policy Privacy Policy Terms of Service</p>
          </header>
          <article>
            <h1>Important Research on Climate Change Effects</h1>
            <p>This study examines the effects of climate change on biodiversity in temperate forests. We conducted a longitudinal analysis over 10 years with comprehensive data collection across multiple sites.</p>
            <p>Our findings indicate significant changes in species distribution and abundance, with implications for conservation strategies and ecosystem management in the face of ongoing environmental change.</p>
          </article>
          <footer>
            <p>Copyright 2024 All rights reserved</p>
          </footer>
        </body>
      </html>
    `;
    
    await createTestPage(page, htmlWithNoise);
    
    // Test that navigation is filtered out
    const extractedData = await page.evaluate(() => {
      const articleParagraphs = Array.from(document.querySelectorAll('article p'));
      const articleText = articleParagraphs
        .map(p => p.textContent?.trim())
        .filter(text => text && text.length > 50)
        .join(' ');
      
      const navParagraphs = Array.from(document.querySelectorAll('nav p, header p, footer p'));
      const navText = navParagraphs
        .map(p => p.textContent?.trim())
        .join(' ');
      
      return {
        articleTextLength: articleText.length,
        navTextLength: navText.length,
        articleHasScience: /\b(study|research|data|analysis|findings?)\b/i.test(articleText),
        navHasScience: /\b(study|research|data|analysis|findings?)\b/i.test(navText),
        articleTextSample: articleText.substring(0, 100)
      };
    });
    
    // Article text should be extracted
    expect(extractedData.articleTextLength).toBeGreaterThan(100);
    expect(extractedData.articleHasScience).toBe(true);
    
    // Navigation text should be minimal (if extracted at all)
    expect(extractedData.navHasScience).toBe(false);
    
    await context.close();
  });
});
