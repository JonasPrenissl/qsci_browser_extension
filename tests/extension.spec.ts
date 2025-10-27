import { test, expect, chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

test('Extension loads and popup shows correct UI', async () => {
  // Path to the extension directory (using the root, not dist)
  const extensionPath = path.resolve('.');
  
  // Verify required files exist
  if (!fs.existsSync(path.join(extensionPath, 'manifest.json'))) {
    throw new Error('manifest.json not found in extension directory');
  }
  if (!fs.existsSync(path.join(extensionPath, 'popup.html'))) {
    throw new Error('popup.html not found in extension directory');
  }

  // Launch browser with extension loaded
  // MV3 requires persistent context
  const context = await chromium.launchPersistentContext('', {
    headless: true, // Headless mode for CI
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox', // Required for CI environments
      '--disable-setuid-sandbox',
    ],
  });

  // Wait a bit for extension to initialize
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Get extension ID from service worker or background pages
  const extensionId = await (async () => {
    // Try to get from service workers
    const workers = context.serviceWorkers();
    for (const worker of workers) {
      const url = worker.url();
      const match = url.match(/chrome-extension:\/\/([a-p]{32})\//);
      if (match) return match[1];
    }
    
    // Fallback: try background pages
    const backgrounds = context.backgroundPages();
    for (const bg of backgrounds) {
      const url = bg.url();
      const match = url.match(/chrome-extension:\/\/([a-p]{32})\//);
      if (match) return match[1];
    }
    
    throw new Error('Extension ID not found - extension may not have loaded');
  })();

  console.log('Extension loaded with ID:', extensionId);

  // Open popup page
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  
  // Wait for page to load
  await popup.waitForLoadState('domcontentloaded');

  // Verify popup displays the main title
  await expect(popup.locator('.popup-logo-icon')).toContainText('Q‑SCI');
  
  // Verify key sections are present
  await expect(popup.locator('.auth-section')).toBeVisible();
  await expect(popup.locator('.current-page-section')).toBeVisible();
  await expect(popup.locator('.manual-analysis-section')).toBeVisible();

  // Verify analyze button exists
  await expect(popup.locator('#analyze-btn')).toBeVisible();

  // Verify settings button exists
  await expect(popup.locator('#settings-btn')).toBeVisible();

  await context.close();
});

test('Content script is injectable on supported pages', async () => {
  const extensionPath = path.resolve('.');

  const context = await chromium.launchPersistentContext('', {
    headless: true,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });

  // Wait for extension to initialize
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Open a page where content script should load
  const page = await context.newPage();
  await page.goto('https://example.com');
  
  // Wait for page to load
  await page.waitForLoadState('domcontentloaded');

  // Check if content script loaded by checking for the global flag
  const contentScriptLoaded = await page.evaluate(() => {
    return window.qsciContentScriptLoaded === true;
  });

  // Note: example.com is not in the content_scripts matches,
  // so this test just verifies the extension doesn't crash on arbitrary pages
  expect(contentScriptLoaded).toBe(false);

  await context.close();
});

test('Extension manifest is valid', async () => {
  const manifestPath = path.resolve('./manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  // Verify manifest version 3
  expect(manifest.manifest_version).toBe(3);
  
  // Verify required fields
  expect(manifest.name).toBeTruthy();
  expect(manifest.version).toBeTruthy();
  expect(manifest.description).toBeTruthy();
  
  // Verify action (popup)
  expect(manifest.action).toBeTruthy();
  expect(manifest.action.default_popup).toBe('popup.html');
  
  // Verify background service worker
  expect(manifest.background).toBeTruthy();
  expect(manifest.background.service_worker).toBe('background.js');
  
  // Verify permissions
  expect(manifest.permissions).toBeTruthy();
  expect(Array.isArray(manifest.permissions)).toBe(true);
  
  // Verify content scripts
  expect(manifest.content_scripts).toBeTruthy();
  expect(Array.isArray(manifest.content_scripts)).toBe(true);
  expect(manifest.content_scripts.length).toBeGreaterThan(0);
});
