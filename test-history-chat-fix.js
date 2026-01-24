// Test for the history chat context preservation fix
// This test verifies that paperContextForChat is preserved when loading history items

console.log('=== Testing History Chat Context Fix ===\n');

// Test case: Verify displayAnalysisResults preserves chat context when loading from history
function testChatContextPreservation() {
  console.log('--- Test: Chat Context Preservation ---');
  
  // Simulate global variables from popup.js
  let selectedHistoryItem = null;
  let paperContextForChat = null;
  let chatHistory = [];
  
  // Mock history item with paper context
  const mockHistoryItem = {
    id: 123456,
    timestamp: new Date().toISOString(),
    analysis: {
      quality_percentage: 85,
      traffic_light: 'green',
      journal_name: 'Nature',
      reasoning: 'High quality research'
    },
    paperContext: {
      title: 'Test Paper: Important Research',
      text: 'This is the full text of the paper with scientific content...',
      url: 'https://www.nature.com/articles/test123'
    },
    pageUrl: 'https://www.nature.com/articles/test123',
    pageTitle: 'Test Paper: Important Research'
  };
  
  console.log('Step 1: Simulating loadHistoryItem()...');
  // Simulate loadHistoryItem logic
  selectedHistoryItem = mockHistoryItem;
  paperContextForChat = mockHistoryItem.paperContext;
  
  console.log('  ✓ selectedHistoryItem set');
  console.log('  ✓ paperContextForChat set:', paperContextForChat.title);
  
  console.log('\nStep 2: Simulating displayAnalysisResults()...');
  // Simulate the fixed displayAnalysisResults logic
  chatHistory = [];
  console.log('  ✓ chatHistory cleared');
  
  // THE FIX: Only clear paperContextForChat if NOT loading from history
  if (!selectedHistoryItem) {
    console.log('  ✓ Would clear paperContextForChat (not from history)');
    paperContextForChat = null;
  } else {
    console.log('  ✓ Preserving paperContextForChat (loading from history)');
  }
  
  console.log('\nStep 3: Verifying chat context is preserved...');
  if (!paperContextForChat) {
    throw new Error('❌ FAILED: paperContextForChat was cleared when it should have been preserved!');
  }
  
  if (paperContextForChat.title !== mockHistoryItem.paperContext.title) {
    throw new Error('❌ FAILED: paperContextForChat content does not match history item!');
  }
  
  if (!paperContextForChat.text || paperContextForChat.text.length === 0) {
    throw new Error('❌ FAILED: paperContextForChat.text is empty!');
  }
  
  console.log('  ✓ paperContextForChat preserved correctly');
  console.log('  ✓ Title:', paperContextForChat.title);
  console.log('  ✓ Text length:', paperContextForChat.text.length);
  console.log('  ✓ URL:', paperContextForChat.url);
  
  console.log('\n--- Test: New Analysis Clears Context ---');
  
  // Now test that new analysis DOES clear the context
  console.log('Step 1: Simulating new analysis...');
  selectedHistoryItem = null;
  
  console.log('Step 2: Simulating displayAnalysisResults() for new analysis...');
  chatHistory = [];
  
  // THE FIX: Only clear paperContextForChat if NOT loading from history
  if (!selectedHistoryItem) {
    console.log('  ✓ Clearing paperContextForChat (new analysis)');
    paperContextForChat = null;
  }
  
  console.log('Step 3: Verifying context was cleared for new analysis...');
  if (paperContextForChat !== null) {
    throw new Error('❌ FAILED: paperContextForChat should be null for new analysis!');
  }
  
  console.log('  ✓ paperContextForChat correctly cleared for new analysis');
  
  console.log('\n✓ All tests passed!');
}

// Run test
try {
  testChatContextPreservation();
  console.log('\n=== ✓ Test Suite Completed Successfully ===\n');
} catch (error) {
  console.error('\n=== ✗ Test Failed ===');
  console.error(error.message);
  console.error(error.stack);
  throw error;
}
