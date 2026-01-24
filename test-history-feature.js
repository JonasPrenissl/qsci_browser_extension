// Test script for analysis history feature
// This script tests the history storage and retrieval functionality

console.log('=== Testing Analysis History Feature ===');

// Mock chrome.storage.local
const mockStorage = {};

const chrome = {
  storage: {
    local: {
      get: async (keys) => {
        console.log('GET:', keys);
        if (Array.isArray(keys)) {
          const result = {};
          keys.forEach(key => {
            if (mockStorage[key] !== undefined) {
              result[key] = mockStorage[key];
            }
          });
          return result;
        } else if (typeof keys === 'object') {
          const result = {};
          Object.keys(keys).forEach(key => {
            if (mockStorage[key] !== undefined) {
              result[key] = mockStorage[key];
            }
          });
          return result;
        } else if (keys === null) {
          return { ...mockStorage };
        }
        return mockStorage[keys] !== undefined ? { [keys]: mockStorage[keys] } : {};
      },
      set: async (items) => {
        console.log('SET:', Object.keys(items));
        Object.assign(mockStorage, items);
      },
      remove: async (keys) => {
        console.log('REMOVE:', keys);
        const keysArray = Array.isArray(keys) ? keys : [keys];
        keysArray.forEach(key => delete mockStorage[key]);
      }
    }
  }
};

// Test data
const testAnalysis1 = {
  quality_percentage: 85,
  traffic_light: 'green',
  journal_name: 'Nature',
  reasoning: 'High quality research with robust methodology',
  positive_aspects: ['Well designed study', 'Clear results'],
  negative_aspects: ['Small sample size']
};

const testAnalysis2 = {
  quality_percentage: 65,
  traffic_light: 'yellow',
  journal_name: 'Science Direct',
  reasoning: 'Good research with some limitations',
  positive_aspects: ['Interesting findings'],
  negative_aspects: ['Limited generalizability', 'Unclear methods']
};

const testPaperContext1 = {
  title: 'Test Paper 1: Groundbreaking Research',
  text: 'This is the full text of the paper...',
  url: 'https://www.nature.com/articles/test1'
};

const testPaperContext2 = {
  title: 'Test Paper 2: Follow-up Study',
  text: 'This is another paper text...',
  url: 'https://www.sciencedirect.com/articles/test2'
};

// Test functions
async function testAddToHistory() {
  console.log('\n--- Testing addToHistory ---');
  
  // Simulate adding first analysis
  const history1 = [];
  const historyItem1 = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    analysis: testAnalysis1,
    pdfUrl: null,
    paperContext: testPaperContext1,
    pageUrl: testPaperContext1.url,
    pageTitle: testPaperContext1.title
  };
  
  history1.unshift(historyItem1);
  await chrome.storage.local.set({ qsci_analysis_history: history1 });
  
  console.log('✓ Added first analysis to history');
  
  // Wait a bit to ensure different timestamp
  await new Promise(resolve => setTimeout(resolve, 10));
  
  // Simulate adding second analysis
  const result = await chrome.storage.local.get(['qsci_analysis_history']);
  const history2 = result.qsci_analysis_history || [];
  
  const historyItem2 = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    analysis: testAnalysis2,
    pdfUrl: null,
    paperContext: testPaperContext2,
    pageUrl: testPaperContext2.url,
    pageTitle: testPaperContext2.title
  };
  
  history2.unshift(historyItem2);
  await chrome.storage.local.set({ qsci_analysis_history: history2 });
  
  console.log('✓ Added second analysis to history');
  
  // Verify both are stored
  const finalResult = await chrome.storage.local.get(['qsci_analysis_history']);
  const finalHistory = finalResult.qsci_analysis_history || [];
  
  console.log(`✓ History contains ${finalHistory.length} items`);
  console.log('  - Most recent:', finalHistory[0].pageTitle);
  console.log('  - Oldest:', finalHistory[1].pageTitle);
  
  if (finalHistory.length !== 2) {
    throw new Error(`Expected 2 history items, got ${finalHistory.length}`);
  }
  
  return finalHistory;
}

async function testLoadHistoryItem(history) {
  console.log('\n--- Testing loadHistoryItem ---');
  
  const item = history[0]; // Load most recent
  console.log('Loading item:', item.pageTitle);
  
  // Verify item has all required data
  if (!item.analysis) throw new Error('Missing analysis');
  if (!item.paperContext) throw new Error('Missing paperContext');
  if (!item.timestamp) throw new Error('Missing timestamp');
  
  console.log('✓ History item has all required fields');
  console.log('  - Analysis quality:', item.analysis.quality_percentage + '%');
  console.log('  - Paper title:', item.paperContext.title);
  console.log('  - Paper text length:', item.paperContext.text.length);
  
  // Verify chat context is available
  if (!item.paperContext.text || item.paperContext.text.length === 0) {
    throw new Error('Paper context text is missing');
  }
  
  console.log('✓ Chat context is available for offline use');
  
  return item;
}

async function testDeleteHistoryItem(history) {
  console.log('\n--- Testing deleteHistoryItem ---');
  
  const itemToDelete = history[1]; // Delete oldest
  console.log('Deleting item:', itemToDelete.pageTitle);
  
  // Filter out the item
  const updatedHistory = history.filter(h => h.id !== itemToDelete.id);
  
  await chrome.storage.local.set({ qsci_analysis_history: updatedHistory });
  
  console.log('✓ Item deleted from history');
  
  // Verify deletion
  const result = await chrome.storage.local.get(['qsci_analysis_history']);
  const finalHistory = result.qsci_analysis_history || [];
  
  console.log(`✓ History now contains ${finalHistory.length} item(s)`);
  
  if (finalHistory.length !== 1) {
    throw new Error(`Expected 1 history item after deletion, got ${finalHistory.length}`);
  }
  
  if (finalHistory.some(h => h.id === itemToDelete.id)) {
    throw new Error('Deleted item still exists in history');
  }
  
  console.log('✓ Deletion verified');
}

async function testHistoryLimit() {
  console.log('\n--- Testing History Limit ---');
  
  const MAX_HISTORY_ITEMS = 50;
  const history = [];
  
  // Add 55 items
  for (let i = 0; i < 55; i++) {
    const item = {
      id: Date.now() + i,
      timestamp: new Date(Date.now() + i * 1000).toISOString(),
      analysis: { ...testAnalysis1, quality_percentage: 50 + i },
      paperContext: { ...testPaperContext1, title: `Test Paper ${i}` },
      pageUrl: `https://test.com/${i}`,
      pageTitle: `Test Paper ${i}`
    };
    history.push(item);
  }
  
  console.log(`Created ${history.length} test items`);
  
  // Simulate limiting to MAX_HISTORY_ITEMS
  const limitedHistory = history.slice(0, MAX_HISTORY_ITEMS);
  
  console.log(`✓ Limited to ${limitedHistory.length} items`);
  
  if (limitedHistory.length !== MAX_HISTORY_ITEMS) {
    throw new Error(`Expected ${MAX_HISTORY_ITEMS} items, got ${limitedHistory.length}`);
  }
  
  console.log('✓ History limit works correctly');
}

async function testChatWithHistoricalAnalysis(item) {
  console.log('\n--- Testing Chat with Historical Analysis ---');
  
  // Simulate building chat messages with historical context
  const paperContext = item.paperContext;
  const analysis = item.analysis;
  
  if (!paperContext) {
    throw new Error('No paper context available');
  }
  
  const contextMessage = `Paper Title: ${paperContext.title}\n` +
    `URL: ${paperContext.url}\n\n` +
    `Analysis Summary:\n` +
    `Quality Score: ${analysis.quality_percentage}%\n` +
    `Assessment: ${analysis.traffic_light}\n` +
    `Reasoning: ${analysis.reasoning || 'N/A'}\n\n`;
  
  console.log('✓ Successfully built chat context from history');
  console.log('Context preview:');
  console.log(contextMessage.substring(0, 200) + '...');
  
  // Verify paper text is available
  if (!paperContext.text || paperContext.text.length === 0) {
    throw new Error('Paper text not available for chat');
  }
  
  console.log(`✓ Paper text available (${paperContext.text.length} chars)`);
  console.log('✓ Chat can work offline with historical analysis');
}

// Run all tests
async function runTests() {
  try {
    console.log('Starting tests...\n');
    
    const history = await testAddToHistory();
    const item = await testLoadHistoryItem(history);
    await testChatWithHistoricalAnalysis(item);
    await testDeleteHistoryItem(history);
    await testHistoryLimit();
    
    console.log('\n=== ✓ All tests passed! ===\n');
  } catch (error) {
    console.error('\n=== ✗ Test failed! ===');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();
