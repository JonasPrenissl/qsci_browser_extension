# Download PDF Button Feature

## Overview
This feature adds a "Download PDF" button next to the "Export Analysis" button in the Q-SCI extension. When a user analyzes a publication that was downloaded as a PDF, they can now download that same PDF file directly from the extension.

## User Experience

### When the Button Appears
The "Download PDF" button is only visible when:
1. An analysis has been performed on the current page
2. The analysis used a PDF file (not just HTML content)
3. The PDF URL is available and valid

### When the Button is Hidden
The button is automatically hidden when:
1. No analysis has been performed yet
2. The analysis was performed on HTML content only (no PDF)
3. The PDF URL is not available

### How to Use
1. Navigate to a scientific paper website (e.g., PubMed, arXiv, Nature, etc.)
2. Click "Analyze Paper" in the extension popup
3. Wait for the analysis to complete
4. If the analysis used a PDF, you'll see both buttons:
   - 📥 Export Analysis (exports the analysis results as PDF)
   - 📄 Download PDF (downloads the original publication PDF)
5. Click "Download PDF" to download the original research paper
6. Choose where to save the file when prompted

## Technical Implementation

### Key Components

#### 1. Storage
The PDF URL is stored in Chrome's local storage alongside the analysis results:
```javascript
chrome.storage.local.set({ 
  qsci_current_analysis: analysis,
  qsci_current_pdf_url: currentPdfUrl
});
```

#### 2. PDF URL Capture
When analysis is performed using a PDF, the URL is captured from the PDF handler:
```javascript
const pdfResult = await window.QSCIPDFHandler.tryDownloadAndExtractPDF(pageData.pdfUrls);
if (pdfResult.success) {
  currentPdfUrl = pdfResult.pdfUrl || null;
}
```

#### 3. Button Visibility Control
The button visibility is controlled in `displayAnalysisResults()`:
```javascript
if (elements.downloadPdfBtn) {
  if (currentPdfUrl) {
    elements.downloadPdfBtn.style.display = 'inline-block';
  } else {
    elements.downloadPdfBtn.style.display = 'none';
  }
}
```

#### 4. Download Function
The download is triggered using Chrome's downloads API:
```javascript
chrome.downloads.download({
  url: currentPdfUrl,
  filename: filename,
  saveAs: true
}, callback);
```

### Files Modified

1. **popup.html**
   - Added download PDF button with i18n support
   - Used flexbox layout for side-by-side buttons

2. **popup.js**
   - Added `currentPdfUrl` global variable
   - Modified `saveAnalysis()` to store PDF URL
   - Modified `loadSavedAnalysis()` to load PDF URL
   - Modified `clearSavedAnalysis()` to clear PDF URL
   - Added `downloadPdf()` function
   - Added event listener for download button
   - Updated `displayAnalysisResults()` to control button visibility

3. **i18n.js**
   - Added German translation: `'detailed.downloadPdf': 'PDF herunterladen'`
   - Added English translation: `'detailed.downloadPdf': 'Download PDF'`
   - Added translations for export button as well

## Security Considerations

### URL Validation
The implementation includes robust URL validation:
1. Checks if URL is not null/empty
2. Validates URL format using `new URL()`
3. Ensures protocol is HTTP or HTTPS
4. Catches and handles validation errors gracefully

### No Remote Code Execution
The feature only downloads files, it doesn't execute any code from external sources.

### User Control
The `saveAs: true` option ensures users can:
1. Choose where to save the file
2. Cancel the download if desired
3. See the filename before saving

## Internationalization

The button text is fully localized:
- German: "PDF herunterladen"
- English: "Download PDF"

The i18n system automatically applies the correct translation based on user's language preference.

## Error Handling

The implementation handles various error scenarios:
1. **No PDF URL**: Shows error message
2. **Invalid URL**: Validates and shows error
3. **Download failure**: Catches Chrome API errors
4. **Network issues**: Handled by Chrome's download manager
5. **Permission issues**: Chrome handles permission prompts

## Testing

### Unit Tests
Run the test suite:
```bash
node test-download-pdf-button.js
```

Tests cover:
- PDF URL storage and retrieval
- Data clearing functionality
- Filename generation logic
- Button visibility logic

### UI Tests
Open the test page in a browser:
```bash
# Start local server
python3 -m http.server 8080

# Open in browser
# http://localhost:8080/test-download-pdf-button.html
```

The test page demonstrates:
- Both buttons visible (PDF available)
- Only export button (no PDF)
- Mobile/narrow layout
- Button interactions (hover, click)

## Browser Compatibility

This feature requires:
- Chrome/Chromium 90+ (for downloads API)
- Manifest V3 support
- Downloads permission in manifest.json

The extension already has the `downloads` permission, so no additional permissions are needed.

## Future Enhancements

Potential improvements:
1. Show download progress indicator
2. Add option to download PDF without save dialog
3. Remember user's preferred download location
4. Support batch downloads for multiple papers
5. Add PDF preview before download

## Troubleshooting

### Button doesn't appear
- Ensure the analysis was performed on a PDF
- Check browser console for errors
- Verify the page URL includes a PDF

### Download fails
- Check internet connection
- Verify the PDF URL is still accessible
- Check browser's download settings
- Ensure sufficient disk space

### Wrong filename
- The filename is extracted from the URL
- Falls back to journal name if available
- Uses "publication.pdf" as last resort

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify you're on a supported scientific paper website
3. Ensure the paper page actually has a PDF available
4. Try refreshing the page and analyzing again
