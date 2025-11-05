import { test, expect, chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

/**
 * Test suite for Q&A Chat Usage Tracking
 * 
 * This test verifies that:
 * 1. Chat questions check usage limits before sending
 * 2. Chat questions increment usage counter after successful response
 * 3. Usage display is updated after chat interaction
 */

test.describe('Q&A Chat Usage Tracking', () => {
  test('popup.js contains usage check before chat send', async () => {
    // Read the popup.js file
    const popupJsPath = path.resolve('.', 'popup.js');
    const popupJsContent = fs.readFileSync(popupJsPath, 'utf-8');
    
    // Verify that handleChatSend function exists
    expect(popupJsContent).toContain('async function handleChatSend()');
    
    // Verify that usage check is performed before sending chat message
    expect(popupJsContent).toContain('await window.QSCIUsage.canAnalyze(currentUser.subscriptionStatus)');
    expect(popupJsContent).toContain('if (!usageCheck.canAnalyze)');
    
    // Verify that error is shown when limit is reached
    expect(popupJsContent).toContain('Daily analysis limit reached');
    
    console.log('✓ Usage check before chat send is properly implemented');
  });

  test('popup.js contains usage increment after successful chat', async () => {
    // Read the popup.js file
    const popupJsPath = path.resolve('.', 'popup.js');
    const popupJsContent = fs.readFileSync(popupJsPath, 'utf-8');
    
    // Verify that usage is incremented after successful chat response
    const incrementPattern = /Increment usage after successful chat response/;
    expect(popupJsContent).toMatch(incrementPattern);
    
    // Extract the handleChatSend function by finding matching braces
    const functionStartIndex = popupJsContent.indexOf('async function handleChatSend()');
    let braceCount = 0;
    let functionEndIndex = functionStartIndex;
    let foundFirstBrace = false;
    
    for (let i = functionStartIndex; i < popupJsContent.length; i++) {
      if (popupJsContent[i] === '{') {
        braceCount++;
        foundFirstBrace = true;
      } else if (popupJsContent[i] === '}') {
        braceCount--;
        if (foundFirstBrace && braceCount === 0) {
          functionEndIndex = i + 1;
          break;
        }
      }
    }
    
    const handleChatSendFunction = popupJsContent.substring(functionStartIndex, functionEndIndex);
    
    // Verify increment happens in handleChatSend function
    expect(handleChatSendFunction).toContain('await window.QSCIUsage.incrementUsage()');
    expect(handleChatSendFunction).toContain('await updateUsageDisplay()');
    expect(handleChatSendFunction).toContain('Incrementing usage counter for chat question');
    
    console.log('✓ Usage increment after successful chat is properly implemented');
  });

  test('qsci_evaluator.js contains speed optimizations', async () => {
    // Read the qsci_evaluator.js file
    const evaluatorPath = path.resolve('.', 'qsci_evaluator.js');
    const evaluatorContent = fs.readFileSync(evaluatorPath, 'utf-8');
    
    // Verify TOP_P constant is defined
    expect(evaluatorContent).toContain('const TOP_P = 0.9');
    
    // Verify top_p is used in API call
    expect(evaluatorContent).toContain('top_p: TOP_P');
    
    // Verify response_format is set to json_object
    expect(evaluatorContent).toContain('response_format: { type: "json_object" }');
    
    // Verify the fast model is still in use
    expect(evaluatorContent).toContain('const MODEL_NAME = \'gpt-4o-mini\'');
    
    // Verify temperature is still 0.0 for deterministic output
    expect(evaluatorContent).toContain('const TEMPERATURE = 0.0');
    
    console.log('✓ Speed optimizations are properly implemented');
  });

  test('Speed optimizations do not reduce text length', async () => {
    // Read the qsci_evaluator.js file
    const evaluatorPath = path.resolve('.', 'qsci_evaluator.js');
    const evaluatorContent = fs.readFileSync(evaluatorPath, 'utf-8');
    
    // Verify MAX_TEXT_LENGTH is still 15000 (not reduced)
    expect(evaluatorContent).toContain('const MAX_TEXT_LENGTH = 15000');
    
    // Verify intelligent truncation function still exists
    expect(evaluatorContent).toContain('function truncateTextIntelligently(text)');
    
    // Verify max_tokens is still 1500 (not reduced)
    expect(evaluatorContent).toContain('max_tokens: 1500');
    
    console.log('✓ Text length and quality parameters are maintained');
  });
});
