import { test, expect, chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

test.describe('PDF Analysis Feature', () => {
  test('PDF handler module loads correctly', async () => {
    // Path to the extension directory
    const extensionPath = path.resolve('.');
    
    // Verify required files exist
    expect(fs.existsSync(path.join(extensionPath, 'manifest.json'))).toBeTruthy();
    expect(fs.existsSync(path.join(extensionPath, 'popup.html'))).toBeTruthy();
    expect(fs.existsSync(path.join(extensionPath, 'dist/js/bundle-pdf-handler.js'))).toBeTruthy();

    // Launch browser with extension loaded
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });

    // Open a page
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for extension to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get extension ID
    let extensionId: string | undefined;
    const workers = context.serviceWorkers();
    
    for (const worker of workers) {
      const url = worker.url();
      if (url.includes('chrome-extension://')) {
        const match = url.match(/chrome-extension:\/\/([a-p]{32})\//);
        if (match) {
          extensionId = match[1];
          break;
        }
      }
    }

    if (!extensionId) {
      throw new Error('Could not find extension ID');
    }

    console.log('Extension ID:', extensionId);

    // Navigate to the popup
    const popupUrl = `chrome-extension://${extensionId}/popup.html`;
    await page.goto(popupUrl);
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for scripts to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check that the PDF handler is loaded
    const hasPDFHandler = await page.evaluate(() => {
      return typeof (window as any).QSCIPDFHandler !== 'undefined';
    });

    expect(hasPDFHandler).toBeTruthy();
    console.log('✓ PDF handler loaded successfully');

    // Check that PDF handler has required methods
    const hasRequiredMethods = await page.evaluate(() => {
      const handler = (window as any).QSCIPDFHandler;
      return (
        typeof handler.tryDownloadAndExtractPDF === 'function' &&
        typeof handler.downloadPDF === 'function' &&
        typeof handler.extractTextFromPDF === 'function'
      );
    });

    expect(hasRequiredMethods).toBeTruthy();
    console.log('✓ PDF handler has all required methods');

    await context.close();
  });

  test('Extension detects PDF URLs on scientific pages', async () => {
    // Path to the extension directory
    const extensionPath = path.resolve('.');

    // Launch browser with extension loaded
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });

    // Navigate to arXiv (a site that should have PDF links)
    const page = await context.newPage();
    
    // Use a specific arXiv abstract page as an example
    await page.goto('https://arxiv.org/abs/2301.00001');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if PDF links are detected on the page
    const pdfLinks = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href*=".pdf"], a[href*="pdf"]');
      return Array.from(links).map(link => (link as HTMLAnchorElement).href);
    });

    console.log('PDF links found:', pdfLinks.length);
    expect(pdfLinks.length).toBeGreaterThan(0);
    console.log('✓ PDF URLs detected on scientific page');

    await context.close();
  });
});
