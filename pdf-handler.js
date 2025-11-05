/**
 * Q-SCI PDF Handler
 * 
 * This module handles downloading and extracting text from PDF files.
 * It uses PDF.js to parse and extract text content from PDFs found on scientific websites.
 */

(function() {
  'use strict';

  console.log('Q-SCI PDF Handler: Initializing...');

  /**
   * Download a PDF from a URL and return it as an ArrayBuffer
   * @param {string} pdfUrl - URL of the PDF to download
   * @returns {Promise<ArrayBuffer>} - Promise that resolves to the PDF data
   */
  async function downloadPDF(pdfUrl) {
    console.log('Q-SCI PDF Handler: Downloading PDF from:', pdfUrl);

    // Skip file:// URLs as they violate CSP and cannot be fetched
    if (pdfUrl.startsWith('file://')) {
      console.warn('Q-SCI PDF Handler: Skipping file:// URL (not supported):', pdfUrl);
      throw new Error('Local file URLs (file://) are not supported for security reasons');
    }

    try {
      // Use background service worker to download PDFs to avoid CSP restrictions
      // Extension pages (like popup.html) have strict CSP, but background worker has broader permissions
      const response = await chrome.runtime.sendMessage({
        type: 'DOWNLOAD_PDF',
        url: pdfUrl
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to download PDF');
      }

      // Convert base64 back to ArrayBuffer
      const binary = atob(response.data);
      // Use Uint8Array.from with mapping function for better performance
      const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
      const arrayBuffer = bytes.buffer;

      console.log('Q-SCI PDF Handler: PDF downloaded successfully, size:', arrayBuffer.byteLength, 'bytes');
      return arrayBuffer;
    } catch (error) {
      console.error('Q-SCI PDF Handler: Error downloading PDF:', error);
      throw new Error(`Failed to download PDF: ${error.message}`);
    }
  }

  /**
   * Extract text from a PDF ArrayBuffer using PDF.js
   * @param {ArrayBuffer} pdfData - PDF data as ArrayBuffer
   * @returns {Promise<string>} - Promise that resolves to extracted text
   */
  async function extractTextFromPDF(pdfData) {
    console.log('Q-SCI PDF Handler: Extracting text from PDF...');

    try {
      // Dynamically import PDF.js
      // We need to use the worker-less build for browser extensions
      const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
      
      // Disable worker for extension context
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';

      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({
        data: pdfData,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true
      });

      const pdf = await loadingTask.promise;
      console.log('Q-SCI PDF Handler: PDF loaded, pages:', pdf.numPages);

      let fullText = '';

      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Combine all text items from the page
          const pageText = textContent.items
            .map(item => item.str)
            .join(' ');
          
          fullText += pageText + '\n\n';
          
          console.log(`Q-SCI PDF Handler: Extracted text from page ${pageNum}/${pdf.numPages} (${pageText.length} chars)`);
        } catch (pageError) {
          console.warn(`Q-SCI PDF Handler: Error extracting text from page ${pageNum}:`, pageError);
          // Continue with other pages even if one fails
        }
      }

      console.log('Q-SCI PDF Handler: Text extraction complete, total length:', fullText.length);

      return fullText.trim();
    } catch (error) {
      console.error('Q-SCI PDF Handler: Error extracting text from PDF:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  /**
   * Try to find and download a PDF for the current page
   * @param {Array<string>} pdfUrls - Array of potential PDF URLs
   * @returns {Promise<{success: boolean, text?: string, error?: string}>}
   */
  async function tryDownloadAndExtractPDF(pdfUrls) {
    console.log('Q-SCI PDF Handler: Attempting to download and extract PDF...');
    console.log('Q-SCI PDF Handler: PDF URLs to try:', pdfUrls.length);

    if (!pdfUrls || pdfUrls.length === 0) {
      return {
        success: false,
        error: 'No PDF URLs found'
      };
    }

    // Filter out file:// URLs and other unsupported protocols
    const validUrls = pdfUrls.filter(url => {
      if (url.startsWith('file://')) {
        console.warn('Q-SCI PDF Handler: Skipping file:// URL:', url);
        return false;
      }
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        console.warn('Q-SCI PDF Handler: Skipping unsupported protocol:', url);
        return false;
      }
      return true;
    });

    if (validUrls.length === 0) {
      return {
        success: false,
        error: 'No valid HTTP(S) PDF URLs found (file:// URLs are not supported)'
      };
    }

    console.log('Q-SCI PDF Handler: Valid PDF URLs to try:', validUrls.length);

    // Try each PDF URL until one succeeds
    for (let i = 0; i < validUrls.length; i++) {
      const pdfUrl = validUrls[i];
      console.log(`Q-SCI PDF Handler: Trying PDF URL ${i + 1}/${validUrls.length}:`, pdfUrl);

      try {
        // Download the PDF
        const pdfData = await downloadPDF(pdfUrl);

        // Extract text from the PDF
        const text = await extractTextFromPDF(pdfData);

        if (text && text.length > 100) {
          console.log('Q-SCI PDF Handler: Successfully extracted text from PDF:', text.length, 'characters');
          return {
            success: true,
            text: text,
            pdfUrl: pdfUrl
          };
        } else {
          console.warn('Q-SCI PDF Handler: PDF text too short or empty, trying next URL');
        }
      } catch (error) {
        console.warn(`Q-SCI PDF Handler: Failed to process PDF from ${pdfUrl}:`, error.message);
        // Continue with next URL
      }
    }

    return {
      success: false,
      error: 'Failed to download or extract text from any PDF URL'
    };
  }

  /**
   * Main function to attempt PDF analysis
   * This will be called from popup.js
   * @param {Array<string>} pdfUrls - Array of potential PDF URLs from page
   * @returns {Promise<{success: boolean, text?: string, pdfUrl?: string, error?: string}>}
   */
  window.QSCIPDFHandler = {
    tryDownloadAndExtractPDF: tryDownloadAndExtractPDF,
    downloadPDF: downloadPDF,
    extractTextFromPDF: extractTextFromPDF
  };

  console.log('Q-SCI PDF Handler: Initialized successfully');
})();
