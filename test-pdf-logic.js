/**
 * Simple unit test for PDF detection logic
 */

// Test the isPDFViewerPage logic
function testPDFDetection() {
    console.log('Testing PDF detection logic...\n');
    
    const testCases = [
        {
            name: 'Lancet showPdf URL',
            url: 'https://www.thelancet.com/action/showPdf?pii=S0140-6736%2825%2901176-6',
            expected: true
        },
        {
            name: 'Direct PDF URL',
            url: 'https://example.com/paper.pdf',
            expected: true
        },
        {
            name: 'PDF query parameter',
            url: 'https://example.com/view?pdf=true',
            expected: true
        },
        {
            name: 'getPDF URL',
            url: 'https://journal.com/getPDF/12345',
            expected: true
        },
        {
            name: 'Regular article page',
            url: 'https://pubmed.ncbi.nlm.nih.gov/12345678/',
            expected: false
        },
        {
            name: 'Abstract page',
            url: 'https://www.nature.com/articles/nature12345',
            expected: false
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    testCases.forEach(testCase => {
        const urlLower = testCase.url.toLowerCase();
        const detected = urlLower.includes('/showpdf') || 
                        urlLower.includes('/getpdf') || 
                        urlLower.includes('/downloadpdf') ||
                        urlLower.includes('/viewpdf') ||
                        urlLower.includes('.pdf') ||
                        urlLower.includes('pdf=');
        
        const result = detected === testCase.expected ? '✓ PASS' : '✗ FAIL';
        
        if (detected === testCase.expected) {
            passed++;
        } else {
            failed++;
        }
        
        console.log(`${result}: ${testCase.name}`);
        console.log(`  URL: ${testCase.url}`);
        console.log(`  Expected: ${testCase.expected}, Got: ${detected}\n`);
    });
    
    console.log(`\nResults: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
    
    return failed === 0;
}

// Test error message generation
function testErrorMessages() {
    console.log('\n\nTesting error message generation...\n');
    
    const testCases = [
        {
            name: 'PDF viewer with no text',
            pageData: {
                text: '',
                isPdfViewer: true,
                pdfUrls: ['https://example.com/paper.pdf']
            },
            shouldContainPdfGuidance: true
        },
        {
            name: 'Regular page with no text',
            pageData: {
                text: '',
                isPdfViewer: false,
                pdfUrls: []
            },
            shouldContainPdfGuidance: false
        },
        {
            name: 'PDF viewer with PDF URLs but no text',
            pageData: {
                text: 'short',
                isPdfViewer: false,
                pdfUrls: ['https://example.com/paper.pdf']
            },
            shouldContainPdfGuidance: true
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    testCases.forEach(testCase => {
        let errorMsg = 'Insufficient content found on the page (less than 50 characters).';
        
        if (testCase.pageData.isPdfViewer || (testCase.pageData.pdfUrls && testCase.pageData.pdfUrls.length > 0)) {
            errorMsg += ' This appears to be a PDF viewer page. PDF text extraction from embedded viewers is limited. Please try one of these alternatives:\n\n';
            errorMsg += '1. Wait a few seconds for the PDF to fully load, then try again\n';
            errorMsg += '2. Use the Manual Analysis feature below by copying text from the PDF\n';
            errorMsg += '3. Visit the article\'s abstract/landing page instead of the PDF viewer';
        } else {
            errorMsg += ' Please ensure you are on a paper details page with visible content, or use the Manual Analysis feature below.';
        }
        
        const containsPdfGuidance = errorMsg.includes('PDF viewer page') || errorMsg.includes('PDF text extraction');
        const result = containsPdfGuidance === testCase.shouldContainPdfGuidance ? '✓ PASS' : '✗ FAIL';
        
        if (containsPdfGuidance === testCase.shouldContainPdfGuidance) {
            passed++;
        } else {
            failed++;
        }
        
        console.log(`${result}: ${testCase.name}`);
        console.log(`  Expected PDF guidance: ${testCase.shouldContainPdfGuidance}, Got: ${containsPdfGuidance}\n`);
    });
    
    console.log(`\nResults: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
    
    return failed === 0;
}

// Run all tests
console.log('========================================');
console.log('Q-SCI PDF Detection Unit Tests');
console.log('========================================\n');

const test1Pass = testPDFDetection();
const test2Pass = testErrorMessages();

console.log('\n========================================');
console.log('Final Results');
console.log('========================================');

if (test1Pass && test2Pass) {
    console.log('✓ All tests passed!');
    process.exit(0);
} else {
    console.log('✗ Some tests failed');
    process.exit(1);
}
