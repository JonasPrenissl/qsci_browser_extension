# Local PDF File Support

## Overview

The Q-SCI browser extension now supports analyzing PDF files stored locally on your computer! This means you can analyze scientific papers that you've downloaded to your Downloads folder, Documents, or any other local directory.

## Quick Setup (Required for Local Files)

To enable this feature, you need to give the extension permission to access local files:

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/` in Chrome
   - Or click the puzzle icon → "Manage Extensions"

2. **Find Q-SCI Extension**
   - Look for "Q-SCI: Scientific Paper Quality Evaluator"

3. **Enable File Access**
   - Click the **"Details"** button
   - Scroll down to find **"Allow access to file URLs"**
   - **Toggle the switch to ON** (it will turn blue)

That's it! The extension can now read local PDF files.

## How to Use

### Method 1: Drag and Drop
1. Drag a PDF file from your computer into Chrome
2. Chrome will open the PDF in its built-in viewer
3. Click the Q-SCI extension icon
4. Click "Analyze Paper"
5. The extension will extract and analyze the PDF content

### Method 2: File → Open
1. In Chrome, press `Ctrl+O` (Windows/Linux) or `Cmd+O` (Mac)
2. Browse to your PDF file and open it
3. Click the Q-SCI extension icon
4. Click "Analyze Paper"

### Method 3: Direct URL
1. In Chrome's address bar, type or paste a file URL:
   ```
   file:///C:/Users/YourName/Downloads/paper.pdf
   ```
2. Press Enter to open the PDF
3. Click the Q-SCI extension icon
4. Click "Analyze Paper"

## Supported Formats

✅ All PDF files opened in Chrome's built-in PDF viewer  
✅ Files in Downloads, Documents, Desktop, or any folder  
✅ Files with spaces in the path (e.g., `Downloads extern`)  
✅ Files with special characters in the name  
✅ Files on external drives (D:, E:, etc.)

## Examples of Supported File Paths

```
file:///C:/Users/John/Downloads/research-paper.pdf
file:///D:/Downloads%20extern/e002246.full.pdf
file:///E:/Scientific Papers/2024/nature-article.pdf
file:///home/user/Documents/papers/study.pdf
```

## Important Security Note

⚠️ **User Permission Required**: Chrome requires you to explicitly enable file access for each extension. This is a security feature to protect your local files. The Q-SCI extension will **ONLY** work with local PDFs after you enable "Allow access to file URLs" in the extension settings.

## Troubleshooting

### Extension doesn't work with local PDFs

**Problem**: The extension icon is disabled or grayed out when viewing a local PDF.

**Solution**: 
- Make sure you enabled "Allow access to file URLs" in `chrome://extensions/`
- Look for the Q-SCI extension
- Click "Details"
- Toggle "Allow access to file URLs" to ON

### PDF opens but extension can't extract text

**Problem**: The extension runs but says it can't find text in the PDF.

**Possible causes**:
- The PDF might be scanned images without OCR text
- The PDF might be password-protected
- The PDF viewer hasn't finished rendering

**Solution**: 
- Wait a few seconds for the PDF to fully load
- Try clicking "Analyze Paper" again
- If it's a scanned PDF, consider using OCR software first

### File URL doesn't work

**Problem**: Typing a file:// URL doesn't open the PDF.

**Solution**:
- Make sure the path is correct
- Use forward slashes (/) not backslashes (\)
- For Windows: `file:///C:/Users/...` (note the three slashes)
- For Mac/Linux: `file:///home/...` (note the three slashes)
- Spaces in paths should be encoded as `%20`

## Feature Comparison

| Feature | Online PDFs | Local PDFs |
|---------|-------------|------------|
| PDF Text Extraction | ✅ Yes | ✅ Yes |
| Scientific Quality Analysis | ✅ Yes | ✅ Yes |
| Usage Limits Apply | ✅ Yes | ✅ Yes |
| Requires Login | ✅ Yes | ✅ Yes |
| **Requires File Access Permission** | ❌ No | ✅ **Yes** |

## Privacy

Your local PDF files are processed entirely within your browser. The extension:
- ✅ Extracts text from the PDF in your browser
- ✅ Sends only the text (not the PDF file) to the analysis API
- ✅ Does not upload or store your PDF files
- ✅ Does not access files outside of what you explicitly open in Chrome

## Technical Details

The extension uses Chrome's built-in PDF.js viewer to extract text from local PDFs, the same technology that Chrome uses to display PDFs. The analysis process is identical to analyzing PDFs from websites.

## Version Information

This feature was added in version 12.0.0 of the Q-SCI browser extension.

## Need Help?

If you encounter any issues with local PDF analysis:
1. Check that "Allow access to file URLs" is enabled
2. Verify the PDF opens correctly in Chrome's built-in viewer
3. Try reopening the PDF
4. Check the browser console for error messages (F12 → Console tab)

For additional support, refer to the main documentation files:
- [INSTALLATION.md](INSTALLATION.md) - Complete installation guide
- [README.md](README.md) - Project overview and features
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and solutions
