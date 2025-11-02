# PDF Viewer Support

## Overview

The Q-SCI browser extension now supports analyzing scientific papers displayed in PDF viewers, including common formats like Lancet's `showPdf` pages.

## Supported PDF Viewer Types

The extension can detect and extract text from:

1. **URL-based PDF viewers**
   - URLs containing `/showpdf`, `/getpdf`, `/viewpdf`, `/downloadpdf`
   - Direct PDF URLs ending in `.pdf`
   - URLs with PDF query parameters (e.g., `?pdf=true`)

2. **Embedded PDF viewers**
   - `<embed type="application/pdf">` elements
   - `<object type="application/pdf">` elements
   - `<iframe>` elements with PDF sources

3. **PDF.js viewers**
   - Modern browser PDF viewers using PDF.js
   - Extracts text from `.textLayer` elements

## How It Works

### Detection

The extension checks multiple indicators to identify PDF viewer pages:

```javascript
function isPDFViewerPage() {
  // Check URL patterns
  if (url.includes('/showpdf') || url.includes('.pdf')) {
    return true;
  }
  
  // Check MIME type
  if (document.contentType.includes('application/pdf')) {
    return true;
  }
  
  // Check for PDF embed elements
  if (document.querySelector('embed[type="application/pdf"]')) {
    return true;
  }
  
  // Check for PDF.js viewer
  if (document.querySelector('.textLayer')) {
    return true;
  }
  
  return false;
}
```

### Text Extraction

The extension attempts multiple extraction methods in order:

1. **PDF.js Text Layer** (best quality)
   - Extracts text from rendered text layers
   - Preserves text order and structure
   - Works with most modern browser PDF viewers

2. **Body Text Fallback**
   - Extracts all visible text from the page
   - Less precise but works for some viewers

3. **Graceful Failure**
   - Provides helpful error message with alternatives
   - Suggests using Manual Analysis feature
   - Recommends visiting abstract page instead

### Timing

PDF viewers need time to render text layers, so the extension uses:
- **3 seconds** delay for PDF pages (vs. 1 second for regular pages)
- Allows PDF.js to render text layers
- Improves extraction success rate

## User Experience

### Success Case

When text extraction succeeds:
1. User clicks "Analyze" on PDF viewer page
2. Extension waits 3 seconds for rendering
3. Text is extracted from PDF.js layers
4. Analysis proceeds normally

### Failure Case

When text extraction fails, the user sees a helpful error message:

```
Insufficient content found on the page (less than 50 characters). 
This appears to be a PDF viewer page. PDF text extraction from 
embedded viewers is limited. Please try one of these alternatives:

1. Wait a few seconds for the PDF to fully load, then try again
2. Use the Manual Analysis feature below by copying text from the PDF
3. Visit the article's abstract/landing page instead of the PDF viewer
```

## Examples

### Supported URLs

✅ `https://www.thelancet.com/action/showPdf?pii=S0140-6736%2825%2901176-6`
✅ `https://journal.com/article/paper.pdf`
✅ `https://nature.com/articles/nature12345.pdf`
✅ `https://pubmed.gov/getPDF/12345678`

### Best Practices

For optimal results:
1. **Use abstract pages when available** - These provide structured metadata
2. **Wait for PDF to load** - Give the viewer time to render (3-5 seconds)
3. **Use Manual Analysis** - For stubborn PDFs, copy text manually

## Technical Details

### Files Modified

- `content-script.js`: PDF detection and extraction logic
- `popup.js`: Error handling and user feedback
- Both files maintain backward compatibility

### Testing

Created comprehensive tests:
- `test-pdf-logic.js`: Unit tests for detection logic
- `test-pdf-detection.html`: Manual browser testing page

All tests pass successfully:
- 6/6 PDF detection tests ✓
- 3/3 error message tests ✓

### Browser Compatibility

The PDF detection works across:
- Chrome (with PDF.js)
- Edge (with PDF.js)
- Firefox (with built-in PDF viewer)
- Other Chromium-based browsers

## Limitations

Some PDF viewers may not expose text through the DOM:
- Cross-origin iframes may block access
- Some proprietary viewers don't use PDF.js
- Scanned PDFs without OCR won't have text layers

For these cases, users can:
- Use the Manual Analysis feature
- Visit the article's abstract or landing page
- Download and open the PDF in a supported viewer

## Future Enhancements

Potential improvements:
- Direct PDF parsing (requires PDF.js library integration)
- OCR for scanned PDFs
- Better detection of specific journal PDF viewers
- Automatic redirection to abstract pages
