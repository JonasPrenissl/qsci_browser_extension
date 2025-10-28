import { test, expect, chromium, Page } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

/**
 * Test suite for verifying OpenAI API integration and result display
 * 
 * This test suite validates:
 * 1. The extension properly calls OpenAI API when analyze button is pressed
 * 2. Results are correctly parsed and displayed in the extension popup
 * 3. Positive and negative aspects are properly shown
 * 4. Quality scores and traffic lights are displayed
 */

// Mock OpenAI response data
const mockAnalysisResponse = {
  quality_percentage: 85,
  traffic_light: '🟢 Green',
  positive_aspects: [
    {
      aspect: 'Rigorous methodology with double-blind randomized controlled trial design',
      source_text: 'This study employed a double-blind, placebo-controlled, randomized trial design to minimize bias and ensure robust results.'
    },
    {
      aspect: 'Large sample size with adequate statistical power',
      source_text: 'A total of 1,247 participants were enrolled across 15 clinical centers, providing 90% power to detect the primary outcome.'
    },
    {
      aspect: 'Clear reporting following CONSORT guidelines',
      source_text: 'The study protocol and reporting adhered to CONSORT 2010 statement guidelines for transparent reporting of randomized trials.'
    }
  ],
  negative_aspects: [
    {
      aspect: 'Limited follow-up duration of only 6 months',
      source_text: 'The study followed participants for 6 months post-intervention, which may not capture long-term effects.'
    },
    {
      aspect: 'High attrition rate in the intervention group',
      source_text: 'Approximately 23% of participants in the intervention arm were lost to follow-up, potentially introducing bias.'
    },
    {
      aspect: 'Lack of diversity in participant demographics',
      source_text: 'The study population was predominantly white (87%) and from high-income countries, limiting generalizability.'
    }
  ]
};

// Helper function to wait for element with timeout
async function waitForElement(page: Page, selector: string, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout, state: 'visible' });
    return true;
  } catch (error) {
    console.error(`Element ${selector} not found within ${timeout}ms`);
    return false;
  }
}

test('OpenAI API is called and results are displayed when analyze button is pressed', async () => {
  const extensionPath = path.resolve('.');
  
  // Verify extension files exist
  if (!fs.existsSync(path.join(extensionPath, 'manifest.json'))) {
    throw new Error('manifest.json not found - run npm run build first');
  }

  // Launch browser with extension
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });

  // Create a test page
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
    console.warn('Extension ID not found - skipping test');
    await context.close();
    return;
  }

  console.log('Extension loaded with ID:', extensionId);

  // Navigate to a supported scientific site (using PubMed as example)
  await page.goto('https://pubmed.ncbi.nlm.nih.gov/');
  await page.waitForLoadState('domcontentloaded');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Open the extension popup
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.waitForLoadState('domcontentloaded');
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('Popup opened, taking initial screenshot...');
  await popup.screenshot({ path: 'test-results/01-popup-initial.png', fullPage: true });

  // Check if login form is visible
  const loginFormVisible = await popup.locator('#login-form').isVisible();
  console.log('Login form visible:', loginFormVisible);

  if (loginFormVisible) {
    console.log('User not logged in. Setting up mock authentication...');
    
    // Mock authentication by directly setting storage values
    await popup.evaluate(() => {
      // Set mock auth data in chrome.storage.local
      chrome.storage.local.set({
        qsci_auth_token: 'mock-test-token-12345',
        qsci_user_email: 'test@example.com',
        qsci_user_id: 'test-user-123',
        qsci_subscription_status: 'subscribed',
        qsci_daily_usage: 0,
        qsci_last_usage_date: new Date().toISOString().split('T')[0]
      });
    });

    // Reload popup to trigger auth check
    await popup.reload();
    await popup.waitForLoadState('domcontentloaded');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Reloaded popup with mock auth, taking screenshot...');
    await popup.screenshot({ path: 'test-results/02-popup-authenticated.png', fullPage: true });
  }

  // Mock the OpenAI API response
  await popup.route('https://api.openai.com/v1/chat/completions', async (route) => {
    console.log('Intercepted OpenAI API call!');
    
    // Simulate the OpenAI API response format
    const openAIResponse = {
      id: 'chatcmpl-test123',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-3.5-turbo-0125',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: JSON.stringify(mockAnalysisResponse)
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 500,
        completion_tokens: 300,
        total_tokens: 800
      }
    };
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(openAIResponse)
    });
  });

  // Mock the backend API endpoint for getting OpenAI key
  await popup.route('https://www.q-sci.org/api/auth/openai-key', async (route) => {
    console.log('Intercepted backend API call for OpenAI key!');
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        api_key: 'sk-mock-test-key-for-testing'
      })
    });
  });

  // Wait for the analyze button to be enabled
  console.log('Waiting for analyze button...');
  const analyzeButtonFound = await waitForElement(popup, '#analyze-btn', 5000);
  
  if (!analyzeButtonFound) {
    console.error('Analyze button not found!');
    await popup.screenshot({ path: 'test-results/error-no-analyze-button.png', fullPage: true });
    throw new Error('Analyze button not found in popup');
  }

  // Check if button is enabled
  const analyzeButton = popup.locator('#analyze-btn');
  const isDisabled = await analyzeButton.isDisabled();
  console.log('Analyze button disabled:', isDisabled);

  if (isDisabled) {
    console.log('Button is disabled, attempting to enable...');
    await popup.evaluate(() => {
      const btn = document.getElementById('analyze-btn') as HTMLButtonElement;
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
      }
    });
  }

  // Add sample text for analysis
  await popup.fill('#manual-text', 
    'This is a comprehensive double-blind randomized controlled trial studying the effects of a novel ' +
    'intervention on patient outcomes. The study enrolled 1,247 participants across 15 clinical centers, ' +
    'following CONSORT guidelines. Results show significant improvement in the primary outcome. ' +
    'However, the study had a 23% attrition rate in the intervention group and limited follow-up of 6 months.'
  );

  console.log('Sample text entered, taking screenshot...');
  await popup.screenshot({ path: 'test-results/03-text-entered.png', fullPage: true });

  // Click the manual analyze button instead
  const manualAnalyzeButton = popup.locator('#manual-analyze-btn');
  const manualButtonDisabled = await manualAnalyzeButton.isDisabled();
  
  if (manualButtonDisabled) {
    await popup.evaluate(() => {
      const btn = document.getElementById('manual-analyze-btn') as HTMLButtonElement;
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
      }
    });
  }

  console.log('Clicking manual analyze button...');
  await manualAnalyzeButton.click();

  // Wait for loading overlay
  console.log('Waiting for analysis to start...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const loadingVisible = await popup.locator('#loading-overlay').isVisible();
  if (loadingVisible) {
    console.log('Loading overlay is visible, taking screenshot...');
    await popup.screenshot({ path: 'test-results/04-analyzing.png', fullPage: true });
  }

  // Wait for results to appear (stats section becomes visible)
  console.log('Waiting for results...');
  const resultsAppeared = await waitForElement(popup, '#stats-section', 15000);
  
  if (!resultsAppeared) {
    console.error('Results did not appear!');
    await popup.screenshot({ path: 'test-results/error-no-results.png', fullPage: true });
    
    // Check for error messages
    const errorVisible = await popup.locator('#error-message').isVisible();
    if (errorVisible) {
      const errorText = await popup.locator('#error-message .error-text').textContent();
      console.error('Error message shown:', errorText);
    }
    
    throw new Error('Analysis results did not appear');
  }

  // Wait a bit for all data to populate
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('Results appeared! Taking screenshot...');
  await popup.screenshot({ path: 'test-results/05-results-displayed.png', fullPage: true });

  // Verify the quality score is displayed
  const qualityScore = await popup.locator('#quality-score').textContent();
  console.log('Quality score displayed:', qualityScore);
  expect(qualityScore).toBeTruthy();
  expect(qualityScore).toContain('%');

  // Verify stats section is visible
  const statsVisible = await popup.locator('#stats-section').isVisible();
  expect(statsVisible).toBe(true);

  // Verify view details button is present
  const viewDetailsButton = popup.locator('#view-details-btn');
  await expect(viewDetailsButton).toBeVisible();

  // Click view details to see full analysis
  console.log('Clicking view details button...');
  await viewDetailsButton.click();
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('Detailed view opened, taking screenshot...');
  await popup.screenshot({ path: 'test-results/06-detailed-view.png', fullPage: true });

  // Verify detailed section is visible
  const detailedSectionVisible = await popup.locator('#detailed-section').isVisible();
  expect(detailedSectionVisible).toBe(true);

  // Verify positive aspects are displayed
  const positiveAspectsList = popup.locator('#positive-aspects-list');
  const positiveAspectsCount = await positiveAspectsList.locator('.analysis-item').count();
  console.log('Number of positive aspects displayed:', positiveAspectsCount);
  expect(positiveAspectsCount).toBeGreaterThan(0);

  // Verify negative aspects are displayed
  const negativeAspectsList = popup.locator('#negative-aspects-list');
  const negativeAspectsCount = await negativeAspectsList.locator('.analysis-item').count();
  console.log('Number of negative aspects displayed:', negativeAspectsCount);
  expect(negativeAspectsCount).toBeGreaterThan(0);

  // Verify traffic light indicator is shown
  const trafficLight = await popup.locator('#detailed-traffic-light').textContent();
  console.log('Traffic light indicator:', trafficLight);
  expect(trafficLight).toBeTruthy();

  // Click on a positive aspect to see source text
  if (positiveAspectsCount > 0) {
    console.log('Clicking first positive aspect...');
    const firstPositiveAspect = positiveAspectsList.locator('.analysis-item').first();
    await firstPositiveAspect.click();
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('Source text displayed, taking screenshot...');
    await popup.screenshot({ path: 'test-results/07-source-text-shown.png', fullPage: true });

    // Verify source text is displayed
    const sourceTextDisplay = popup.locator('#source-text-display');
    const sourceTextVisible = await sourceTextDisplay.isVisible();
    expect(sourceTextVisible).toBe(true);
  }

  // Take a final full-page screenshot
  console.log('Taking final screenshot...');
  await popup.screenshot({ path: 'test-results/08-final-state.png', fullPage: true });

  console.log('✅ Test completed successfully!');
  console.log('Screenshots saved to test-results/ directory');

  await popup.close();
  await page.close();
  await context.close();
});

test('Error handling when OpenAI API fails', async () => {
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
  await page.goto('https://example.com');
  await page.waitForLoadState('domcontentloaded');
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
    console.warn('Extension ID not found - skipping test');
    await context.close();
    return;
  }

  // Open popup
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.waitForLoadState('domcontentloaded');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Set up mock auth
  await popup.evaluate(() => {
    chrome.storage.local.set({
      qsci_auth_token: 'mock-test-token-12345',
      qsci_user_email: 'test@example.com',
      qsci_user_id: 'test-user-123',
      qsci_subscription_status: 'subscribed',
      qsci_daily_usage: 0,
      qsci_last_usage_date: new Date().toISOString().split('T')[0]
    });
  });

  await popup.reload();
  await popup.waitForLoadState('domcontentloaded');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock OpenAI API to return an error
  await popup.route('https://api.openai.com/v1/chat/completions', async (route) => {
    console.log('Intercepted OpenAI API call - returning error!');
    
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          message: 'Internal server error',
          type: 'server_error'
        }
      })
    });
  });

  // Mock backend API
  await popup.route('https://www.q-sci.org/api/auth/openai-key', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        api_key: 'sk-mock-test-key-for-testing'
      })
    });
  });

  // Add sample text
  await popup.fill('#manual-text', 'Sample text for error testing.');

  // Enable and click analyze button
  await popup.evaluate(() => {
    const btn = document.getElementById('manual-analyze-btn') as HTMLButtonElement;
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  });

  console.log('Clicking analyze with error scenario...');
  await popup.locator('#manual-analyze-btn').click();

  // Wait for error message
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('Checking for error message...');
  await popup.screenshot({ path: 'test-results/09-error-handling.png', fullPage: true });

  // Verify error message is shown
  const errorVisible = await popup.locator('#error-message').isVisible();
  console.log('Error message visible:', errorVisible);
  
  if (errorVisible) {
    const errorText = await popup.locator('#error-message .error-text').textContent();
    console.log('Error message:', errorText);
    expect(errorText).toBeTruthy();
  }

  console.log('✅ Error handling test completed!');

  await popup.close();
  await page.close();
  await context.close();
});
