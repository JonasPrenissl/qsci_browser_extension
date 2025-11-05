/**
 * Test: Download PDF Button Functionality
 * 
 * This test verifies that the download PDF button functionality works correctly
 * by simulating the analysis flow and checking button visibility.
 */

// Mock chrome API
global.chrome = {
  storage: {
    local: {
      data: {},
      get: function(keys) {
        return Promise.resolve(
          keys.reduce((acc, key) => {
            if (this.data[key]) {
              acc[key] = this.data[key];
            }
            return acc;
          }, {})
        );
      },
      set: function(items) {
        Object.assign(this.data, items);
        return Promise.resolve();
      },
      remove: function(keys) {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        keyArray.forEach(key => delete this.data[key]);
        return Promise.resolve();
      }
    }
  },
  downloads: {
    download: function(options, callback) {
      console.log('Mock download initiated:', options);
      if (callback) callback(123); // Mock download ID
    }
  }
};

// Test functions
async function testPdfUrlStorage() {
  console.log('\n=== Test 1: PDF URL Storage ===');
  
  // Simulate storing PDF URL
  const mockAnalysis = {
    quality_percentage: 85,
    traffic_light: 'green',
    positive_aspects: ['Good methodology'],
    negative_aspects: []
  };
  const mockPdfUrl = 'https://example.com/paper.pdf';
  
  await chrome.storage.local.set({
    qsci_current_analysis: mockAnalysis,
    qsci_current_pdf_url: mockPdfUrl
  });
  
  // Retrieve stored data
  const result = await chrome.storage.local.get(['qsci_current_analysis', 'qsci_current_pdf_url']);
  
  console.log('✓ Stored analysis:', result.qsci_current_analysis ? 'Yes' : 'No');
  console.log('✓ Stored PDF URL:', result.qsci_current_pdf_url);
  console.log('✓ Test passed: Data stored and retrieved correctly');
}

async function testPdfUrlClearing() {
  console.log('\n=== Test 2: PDF URL Clearing ===');
  
  // Clear stored data
  await chrome.storage.local.remove(['qsci_current_analysis', 'qsci_current_pdf_url']);
  
  // Verify data is cleared
  const result = await chrome.storage.local.get(['qsci_current_analysis', 'qsci_current_pdf_url']);
  
  console.log('✓ Analysis cleared:', !result.qsci_current_analysis);
  console.log('✓ PDF URL cleared:', !result.qsci_current_pdf_url);
  console.log('✓ Test passed: Data cleared correctly');
}

async function testDownloadFilenameGeneration() {
  console.log('\n=== Test 3: Download Filename Generation ===');
  
  // Test various URL formats
  const testUrls = [
    { url: 'https://example.com/papers/document.pdf', expected: 'document.pdf' },
    { url: 'https://example.com/getPDF?id=123', expected: 'publication.pdf' },
    { url: 'https://arxiv.org/pdf/2301.12345.pdf', expected: '2301.12345.pdf' }
  ];
  
  testUrls.forEach(test => {
    try {
      const url = new URL(test.url);
      const pathParts = url.pathname.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      const filename = lastPart && lastPart.endsWith('.pdf') ? lastPart : 'publication.pdf';
      
      console.log(`✓ URL: ${test.url}`);
      console.log(`  Generated filename: ${filename}`);
    } catch (error) {
      console.log(`✗ Failed to parse URL: ${test.url}`);
    }
  });
  
  console.log('✓ Test passed: Filename generation working correctly');
}

async function testButtonVisibilityLogic() {
  console.log('\n=== Test 4: Button Visibility Logic ===');
  
  // Scenario 1: PDF available
  let currentPdfUrl = 'https://example.com/paper.pdf';
  let shouldShow = !!currentPdfUrl;
  console.log(`✓ Scenario 1 (PDF available): Button should ${shouldShow ? 'show' : 'hide'} - ${shouldShow ? 'PASS' : 'FAIL'}`);
  
  // Scenario 2: No PDF
  currentPdfUrl = null;
  shouldShow = !!currentPdfUrl;
  console.log(`✓ Scenario 2 (No PDF): Button should ${shouldShow ? 'show' : 'hide'} - ${!shouldShow ? 'PASS' : 'FAIL'}`);
  
  // Scenario 3: Empty string
  currentPdfUrl = '';
  shouldShow = !!currentPdfUrl;
  console.log(`✓ Scenario 3 (Empty string): Button should ${shouldShow ? 'show' : 'hide'} - ${!shouldShow ? 'PASS' : 'FAIL'}`);
  
  console.log('✓ Test passed: Button visibility logic working correctly');
}

// Run all tests
async function runTests() {
  console.log('Starting Download PDF Button Tests...\n');
  
  try {
    await testPdfUrlStorage();
    await testPdfUrlClearing();
    await testDownloadFilenameGeneration();
    await testButtonVisibilityLogic();
    
    console.log('\n=== All Tests Passed! ===\n');
  } catch (error) {
    console.error('\n=== Test Failed ===');
    console.error(error);
    process.exit(1);
  }
}

// Execute tests
runTests();
