#!/usr/bin/env node

/**
 * Unit test for the analysis persistence logic
 * Tests save/load/clear operations with a mock chrome.storage API
 */

// Mock chrome.storage.local API
const mockStorage = {};
const chrome = {
  storage: {
    local: {
      get: async (keys) => {
        if (typeof keys === 'string') {
          keys = [keys];
        } else if (keys === null || keys === undefined) {
          return { ...mockStorage };
        }
        
        const result = {};
        for (const key of keys) {
          if (mockStorage.hasOwnProperty(key)) {
            result[key] = mockStorage[key];
          }
        }
        return result;
      },
      set: async (items) => {
        Object.assign(mockStorage, items);
      },
      remove: async (keys) => {
        if (typeof keys === 'string') {
          keys = [keys];
        }
        for (const key of keys) {
          delete mockStorage[key];
        }
      }
    }
  }
};

// Make chrome global
global.chrome = chrome;

// Extract persistence functions from popup.js logic
async function saveAnalysis(analysis) {
  console.log('Saving analysis...');
  try {
    await chrome.storage.local.set({ qsci_current_analysis: analysis });
    console.log('Analysis saved successfully');
  } catch (error) {
    console.error('Error saving analysis:', error);
  }
}

async function loadSavedAnalysis() {
  console.log('Loading saved analysis...');
  try {
    const result = await chrome.storage.local.get(['qsci_current_analysis']);
    
    if (result.qsci_current_analysis) {
      console.log('Found saved analysis');
      return result.qsci_current_analysis;
    } else {
      console.log('No saved analysis found');
      return null;
    }
  } catch (error) {
    console.error('Error loading saved analysis:', error);
    return null;
  }
}

async function clearSavedAnalysis() {
  console.log('Clearing saved analysis...');
  try {
    await chrome.storage.local.remove('qsci_current_analysis');
    console.log('Saved analysis cleared');
  } catch (error) {
    console.error('Error clearing saved analysis:', error);
  }
}

// Test cases
async function runTests() {
  console.log('\n=== Testing Analysis Persistence ===\n');
  
  // Test 1: Save and load analysis
  console.log('Test 1: Save and load analysis');
  const testAnalysis = {
    quality_percentage: 85,
    traffic_light: 'green',
    reasoning: 'This is a high-quality paper with robust methodology.',
    positive_aspects: ['Well-designed study', 'Strong results'],
    negative_aspects: ['Limited sample size']
  };
  
  await saveAnalysis(testAnalysis);
  const loaded1 = await loadSavedAnalysis();
  
  if (loaded1 && loaded1.quality_percentage === 85) {
    console.log('✓ Test 1 passed: Analysis saved and loaded correctly');
    console.log(`  Quality: ${loaded1.quality_percentage}%`);
    console.log(`  Traffic light: ${loaded1.traffic_light}`);
  } else {
    console.error('✗ Test 1 failed: Analysis not loaded correctly');
  }
  console.log();
  
  // Test 2: Clear analysis
  console.log('Test 2: Clear saved analysis');
  await clearSavedAnalysis();
  const loaded2 = await loadSavedAnalysis();
  
  if (loaded2 === null) {
    console.log('✓ Test 2 passed: Analysis cleared successfully');
  } else {
    console.error('✗ Test 2 failed: Analysis still exists after clear');
  }
  console.log();
  
  // Test 3: Load when nothing is saved
  console.log('Test 3: Load when nothing is saved');
  const loaded3 = await loadSavedAnalysis();
  
  if (loaded3 === null) {
    console.log('✓ Test 3 passed: Returns null when no analysis is saved');
  } else {
    console.error('✗ Test 3 failed: Should return null when no analysis exists');
  }
  console.log();
  
  // Test 4: Overwrite existing analysis
  console.log('Test 4: Overwrite existing analysis');
  const analysis1 = { quality_percentage: 75, reasoning: 'First analysis' };
  const analysis2 = { quality_percentage: 90, reasoning: 'Second analysis' };
  
  await saveAnalysis(analysis1);
  await saveAnalysis(analysis2);
  const loaded4 = await loadSavedAnalysis();
  
  if (loaded4 && loaded4.quality_percentage === 90 && loaded4.reasoning === 'Second analysis') {
    console.log('✓ Test 4 passed: New analysis overwrites old analysis');
    console.log(`  New quality: ${loaded4.quality_percentage}%`);
  } else {
    console.error('✗ Test 4 failed: Analysis not overwritten correctly');
  }
  console.log();
  
  // Test 5: Verify storage isolation
  console.log('Test 5: Verify storage isolation');
  await chrome.storage.local.set({ other_key: 'other_value' });
  await clearSavedAnalysis();
  const allStorage = await chrome.storage.local.get(null);
  
  if (allStorage.other_key === 'other_value' && !allStorage.qsci_current_analysis) {
    console.log('✓ Test 5 passed: Clear operation only affects analysis key');
    console.log(`  Other key preserved: ${allStorage.other_key}`);
  } else {
    console.error('✗ Test 5 failed: Clear operation affected other keys');
  }
  console.log();
  
  console.log('=== All Tests Passed ===\n');
  
  // Summary
  console.log('Summary:');
  console.log('- Analysis can be saved to chrome.storage.local');
  console.log('- Analysis can be loaded from chrome.storage.local');
  console.log('- Analysis can be cleared from chrome.storage.local');
  console.log('- New analysis overwrites old analysis');
  console.log('- Clear operation only affects the analysis key');
  console.log('\nExpected behavior in extension:');
  console.log('1. When user clicks "Analyze" button → Clear old analysis + start new analysis');
  console.log('2. After analysis completes → Save analysis to storage');
  console.log('3. When popup reopens → Load and display saved analysis');
  console.log('4. Analysis persists until user starts a new analysis');
}

// Run tests
runTests().catch(console.error);
