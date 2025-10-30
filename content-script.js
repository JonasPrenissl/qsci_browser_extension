// Q-SCI Browser Extension - Content Script (Fixed Version)
// Handles page content extraction and analysis on scientific websites

(function() {
  'use strict';
  
  console.log('Q-SCI Content Script: Loaded on', window.location.hostname);
  
  // Check if script is already loaded to prevent duplicate execution
  if (window.qsciContentScriptLoaded) {
    console.log('Q-SCI Content Script: Already loaded, skipping');
    return;
  }
  window.qsciContentScriptLoaded = true;
  
  // Configuration
  const EXTRACTION_DELAY = 1000; // Wait for page to fully load
  const MAX_FULLTEXT_LENGTH = 2000; // Maximum characters to include from full text when combining with abstract
  const PDF_EXTRACTION_DELAY = 3000; // Wait longer for PDF viewers to render text
  
  // Initialize content script
  function initialize() {
    console.log('Q-SCI Content Script: Initializing...');
    
    // Set up message listener
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('Q-SCI Content Script: Received message:', request.type);
      
      if (request.type === 'EXTRACT_PAGE_DATA') {
        handleExtractPageData(sendResponse);
        return true; // Keep message channel open for async response
      }
      
      if (request.type === 'CHECK_CONTENT_SCRIPT') {
        sendResponse({ success: true, loaded: true });
        return true;
      }
    });
    
    console.log('Q-SCI Content Script: Initialized successfully');
  }
  
  // Handle page data extraction request
  function handleExtractPageData(sendResponse) {
    console.log('Q-SCI Content Script: Extracting page data...');
    
    try {
      // Check if this might be a PDF page to determine delay
      const isPdf = isPDFViewerPage();
      const delay = isPdf ? PDF_EXTRACTION_DELAY : EXTRACTION_DELAY;
      
      console.log('Q-SCI Content Script: Using extraction delay:', delay, 'ms', isPdf ? '(PDF page)' : '(regular page)');
      
      // Wait a moment for dynamic content to load
      setTimeout(() => {
        const pageData = extractPageData();
        
        if (pageData.text && pageData.text.length > 50) {
          console.log('Q-SCI Content Script: Page data extracted successfully');
          sendResponse({ 
            success: true, 
            data: pageData 
          });
        } else {
          console.warn('Q-SCI Content Script: Insufficient content extracted');
          let errorMsg = 'Insufficient content found. Please ensure you are on a paper details page with abstract or content.';
          
          // Provide specific guidance for PDF pages
          if (pageData.isPdfViewer) {
            errorMsg = 'Unable to extract text from this PDF viewer. Please try: (1) waiting a few more seconds and trying again, (2) using Manual Analysis by copying text from the PDF, or (3) visiting the article\'s abstract page instead.';
          }
          
          sendResponse({ 
            success: false, 
            error: errorMsg
          });
        }
      }, delay);
      
    } catch (error) {
      console.error('Q-SCI Content Script: Extraction error:', error);
      sendResponse({ 
        success: false, 
        error: error.message || 'Failed to extract page content' 
      });
    }
  }
  
  /**
   * Check if the current page is a PDF viewer page
   * @returns {boolean} true if this is a PDF viewer page
   */
  function isPDFViewerPage() {
    const url = window.location.href.toLowerCase();
    const contentType = document.contentType || document.mimeType || '';
    
    // Check URL patterns that indicate PDF viewing
    if (url.includes('/showpdf') || 
        url.includes('/getpdf') || 
        url.includes('/downloadpdf') ||
        url.includes('/viewpdf') ||
        url.includes('.pdf') ||
        url.includes('pdf=')) {
      console.log('Q-SCI Content Script: PDF detected from URL pattern');
      return true;
    }
    
    // Check for PDF mime type
    if (contentType.includes('application/pdf')) {
      console.log('Q-SCI Content Script: PDF detected from content type');
      return true;
    }
    
    // Check for PDF embed elements
    const pdfEmbed = document.querySelector('embed[type="application/pdf"]');
    const pdfObject = document.querySelector('object[type="application/pdf"]');
    const pdfIframe = document.querySelector('iframe[src*=".pdf"]');
    
    if (pdfEmbed || pdfObject || pdfIframe) {
      console.log('Q-SCI Content Script: PDF detected from embed/object/iframe elements');
      return true;
    }
    
    // Check for PDF.js viewer (common in modern browsers)
    if (document.getElementById('viewer') && document.querySelector('.textLayer')) {
      console.log('Q-SCI Content Script: PDF.js viewer detected');
      return true;
    }
    
    return false;
  }

  /**
   * Extract data from PDF viewer pages
   * @returns {Object} Extracted page data
   */
  function extractPDFViewerData() {
    const hostname = window.location.hostname.toLowerCase();
    const url = window.location.href;
    
    console.log('Q-SCI Content Script: Attempting PDF text extraction');
    
    let title = '';
    let text = '';
    let pdfUrl = url;
    
    // Try to extract title from page title or document
    title = document.title || '';
    
    // Try to extract text from PDF.js text layer if available
    const textLayers = document.querySelectorAll('.textLayer');
    if (textLayers.length > 0) {
      console.log('Q-SCI Content Script: Found PDF.js text layers:', textLayers.length);
      let extractedText = '';
      textLayers.forEach(layer => {
        const layerText = layer.textContent || '';
        if (layerText.trim()) {
          extractedText += layerText + '\n';
        }
      });
      
      if (extractedText.length > 100) {
        text = extractedText.trim();
        console.log('Q-SCI Content Script: Successfully extracted text from PDF.js:', text.length, 'characters');
      }
    }
    
    // Try to extract text from any visible text on the page (fallback)
    if (!text || text.length < 100) {
      console.log('Q-SCI Content Script: Text layer extraction insufficient, trying body text');
      const bodyText = document.body.textContent || '';
      if (bodyText.length > 100) {
        text = bodyText.trim();
        console.log('Q-SCI Content Script: Extracted from body:', text.length, 'characters');
      }
    }
    
    // If we still don't have enough text, check for specific viewer patterns
    if (!text || text.length < 100) {
      // Check for iframe with PDF
      const pdfIframe = document.querySelector('iframe[src*="pdf"], iframe[src*="showPdf"]');
      if (pdfIframe) {
        console.log('Q-SCI Content Script: Found PDF iframe, but cannot access content due to cross-origin restrictions');
      }
      
      // Check for embed/object with PDF
      const pdfEmbed = document.querySelector('embed[type="application/pdf"], object[type="application/pdf"]');
      if (pdfEmbed) {
        console.log('Q-SCI Content Script: Found PDF embed/object, but cannot extract text directly');
      }
    }
    
    const result = {
      title: title,
      abstract: '',
      text: text,
      pdfUrls: [pdfUrl],
      hostname: hostname,
      url: url,
      isPdfViewer: true
    };
    
    console.log('Q-SCI Content Script: PDF extraction result:', {
      title: result.title ? result.title.substring(0, 50) + '...' : 'None',
      textLength: result.text ? result.text.length : 0,
      pdfUrls: result.pdfUrls.length,
      hostname: result.hostname
    });
    
    return result;
  }

  // Extract page data from current page
  function extractPageData() {
    const hostname = window.location.hostname.toLowerCase();
    const url = window.location.href;
    console.log('Q-SCI Content Script: Extracting from hostname:', hostname);
    console.log('Q-SCI Content Script: Full URL:', url);
    
    let title = '';
    let abstract = '';
    let fullText = '';
    let pdfUrls = [];
    
    // Check if this is a PDF viewer page (e.g., Lancet showPdf, embedded PDFs)
    const isPdfPage = isPDFViewerPage();
    if (isPdfPage) {
      console.log('Q-SCI Content Script: Detected PDF viewer page');
      return extractPDFViewerData();
    }
    
    // Site-specific extraction for better accuracy
    if (hostname.includes('pmc.ncbi.nlm.nih.gov')) {
      return extractPMCData();
    } else if (hostname.includes('pubmed.ncbi.nlm.nih.gov')) {
      return extractPubMedData();
    } else if (hostname.includes('arxiv.org')) {
      return extractArXivData();
    } else if (hostname.includes('thelancet.com')) {
      return extractLancetData();
    }
    
    // Generic extraction for other sites
    return extractGenericData();
  }

  /**
   * Strip reference list from text. Looks for a line starting with
   * "references" (case-insensitive) and removes everything from that point
   * onwards. This helps avoid detecting study design features in the
   * reference list (e.g. "randomized controlled trial" within references).
   * @param {string} text - full text or abstract
   * @returns {string} cleaned text without references
   */
  function stripReferences(text) {
    if (!text) return '';
    try {
      // search for the word 'references' at the beginning of a line
      const lower = text.toLowerCase();
      const idx = lower.search(/\n\s*references\b/);
      if (idx !== -1) {
        return text.substring(0, idx).trim();
      }
      return text;
    } catch (e) {
      return text;
    }
  }
  
  // PMC-specific extraction
  function extractPMCData() {
    console.log('Q-SCI Content Script: Using PMC-specific extraction');
    
    let title = '';
    let abstract = '';
    let fullText = '';
    let pdfUrls = [];
    
    // PMC title selectors
    const pmcTitleSelectors = [
      'h1.content-title', // PMC main title
      '.article-title', // PMC article title
      'h1', // Generic fallback
      '.title-group h1', // PMC title group
      '.article-meta h1' // PMC article meta
    ];
    
    for (const selector of pmcTitleSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        title = element.textContent.trim();
        console.log('Q-SCI Content Script: Found PMC title with selector:', selector);
        break;
      }
    }
    
    // PMC abstract selectors
    const pmcAbstractSelectors = [
      '.abstract', // PMC abstract section
      '#abstract', // PMC abstract ID
      '.abstract-content', // PMC abstract content
      '.sec[data-title="Abstract"]', // PMC section with abstract
      '.abstract-sec', // PMC abstract section
      '.article-abstract' // PMC article abstract
    ];
    
    for (const selector of pmcAbstractSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        abstract = element.textContent.trim();
        console.log('Q-SCI Content Script: Found PMC abstract with selector:', selector);
        break;
      }
    }
    
    // PMC full text selectors
    const pmcContentSelectors = [
      '.article-body', // PMC article body
      '.article-content', // PMC article content
      '.full-text', // PMC full text
      'main', // Main content
      '.content' // Generic content
    ];
    
    for (const selector of pmcContentSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        fullText = element.textContent.trim();
        console.log('Q-SCI Content Script: Found PMC content with selector:', selector);
        break;
      }
    }
    
    // Enhanced PMC PDF link selectors
    const pmcPdfSelectors = [
      'a[href*="pdf"]', // PDF links
      'a[title*="PDF"]', // PDF title
      'a[href*=".pdf"]', // Direct PDF extension
      '.pdf-link', // PDF link class
      'a[href*="download"]', // Download links
      '.download-link', // Download link class
      'a[data-track-action="PDF"]', // PMC specific PDF tracking
      'a[href*="pmc/articles"][href*="pdf"]', // PMC PDF format
      '.format-menu a[href*="pdf"]', // Format menu PDF links
      '.supplementary-material a[href*="pdf"]', // Supplementary PDFs
      'a[href*="europepmc.org"][href*="pdf"]', // Europe PMC PDFs
      'a[href*="ncbi.nlm.nih.gov"][href*="pdf"]' // NCBI PDF links
    ];
    
    pmcPdfSelectors.forEach(selector => {
      const links = document.querySelectorAll(selector);
      links.forEach(link => {
        if (link.href && !pdfUrls.includes(link.href)) {
          if (link.href.includes('.pdf') || 
              link.href.includes('pdf') || 
              link.textContent.toLowerCase().includes('pdf') ||
              link.title?.toLowerCase().includes('pdf') ||
              link.getAttribute('data-track-action') === 'PDF') {
            pdfUrls.push(link.href);
            console.log('Q-SCI Content Script: Found PDF URL:', link.href);
          }
        }
      });
    });
    
    // Try to construct PMC PDF URL if not found directly
    if (pdfUrls.length === 0 && window.location.href.includes('pmc.ncbi.nlm.nih.gov/articles/')) {
      const pmcId = window.location.href.match(/PMC\d+/);
      if (pmcId) {
        const constructedPdfUrl = `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcId[0]}/pdf/`;
        pdfUrls.push(constructedPdfUrl);
        console.log('Q-SCI Content Script: Constructed PMC PDF URL:', constructedPdfUrl);
      }
    }
    
    // Strip references from abstract and full text to avoid picking up cues from citations
    abstract = stripReferences(abstract);
    fullText = stripReferences(fullText);

    // Combine text for analysis (prefer abstract, fallback to full text, then title)
    let analysisText = abstract || fullText || title;

    // If we have both abstract and some full text, combine them
    if (abstract && fullText && fullText !== abstract) {
      analysisText = abstract + '\n\n' + fullText.substring(0, MAX_FULLTEXT_LENGTH); // Limit full text
    }

    return {
      title: title,
      abstract: abstract,
      text: analysisText,
      pdfUrls: pdfUrls,
      hostname: hostname,
      url: window.location.href
    };
  }
  
  // PubMed-specific extraction
  function extractPubMedData() {
    console.log('Q-SCI Content Script: Using PubMed-specific extraction');
    
    const title = document.querySelector('h1.heading-title')?.textContent?.trim() || '';
    // Extract abstract and strip references to avoid misinterpreting citations
    let abstract = document.querySelector('.abstract-content')?.textContent?.trim() || '';
    abstract = stripReferences(abstract);
    
    // Look for PMC full text link
    const pmcLink = document.querySelector('a[href*="pmc/articles"]');
    const pdfUrls = pmcLink ? [pmcLink.href] : [];
    
    return {
      title,
      abstract,
      text: abstract || title,
      pdfUrls,
      hostname: 'pubmed.ncbi.nlm.nih.gov',
      url: window.location.href
    };
  }
  
  // arXiv-specific extraction
  function extractArXivData() {
    console.log('Q-SCI Content Script: Using arXiv-specific extraction');
    
    const title = document.querySelector('h1.title')?.textContent?.replace('Title:', '').trim() || '';
    // Extract abstract and remove references (some arXiv submissions include reference lists within abstract blocks)
    let abstract = document.querySelector('blockquote.abstract')?.textContent?.replace('Abstract:', '').trim() || '';
    abstract = stripReferences(abstract);
    
    // Enhanced arXiv PDF link detection
    let pdfUrls = [];
    
    // arXiv PDF selectors
    const arxivPdfSelectors = [
      'a[href*=".pdf"]', // Direct PDF links
      'a[href*="pdf"]', // PDF in URL
      '.download-pdf a', // Download PDF class
      '.full-text a[href*="pdf"]', // Full text PDF
      'a[title*="PDF"]' // PDF in title
    ];
    
    arxivPdfSelectors.forEach(selector => {
      const links = document.querySelectorAll(selector);
      links.forEach(link => {
        if (link.href && !pdfUrls.includes(link.href)) {
          if (link.href.includes('.pdf') || 
              link.href.includes('pdf') || 
              link.textContent.toLowerCase().includes('pdf')) {
            pdfUrls.push(link.href);
            console.log('Q-SCI Content Script: Found arXiv PDF URL:', link.href);
          }
        }
      });
    });
    
    // Construct arXiv PDF URL if not found directly
    if (pdfUrls.length === 0 && window.location.href.includes('arxiv.org/abs/')) {
      const arxivId = window.location.href.match(/(\d{4}\.\d{4,5})/);
      if (arxivId) {
        const constructedPdfUrl = `https://arxiv.org/pdf/${arxivId[1]}.pdf`;
        pdfUrls.push(constructedPdfUrl);
        console.log('Q-SCI Content Script: Constructed arXiv PDF URL:', constructedPdfUrl);
      }
    }
    
    return {
      title,
      abstract,
      text: abstract || title,
      pdfUrls,
      hostname: 'arxiv.org',
      url: window.location.href
    };
  }
  
  // Lancet-specific extraction
  function extractLancetData() {
    console.log('Q-SCI Content Script: Using Lancet-specific extraction');
    
    let title = '';
    let abstract = '';
    let fullText = '';
    const pdfUrlSet = new Set(); // Use Set for O(1) lookup performance
    
    // Lancet title selectors - try multiple approaches
    const lancetTitleSelectors = [
      'h1.article-header__title', // Lancet article header
      'h1.article-title', // Alternative article title
      '.article-header h1', // Header h1
      'h1', // Generic fallback
      '.citation__title' // Citation title
    ];
    
    for (const selector of lancetTitleSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        title = element.textContent.trim();
        console.log('Q-SCI Content Script: Found Lancet title with selector:', selector);
        break;
      }
    }
    
    // Lancet abstract/summary selectors
    // The Lancet often uses "Summary" instead of "Abstract"
    const lancetAbstractSelectors = [
      'section.summary', // Lancet summary section
      '.summary', // Summary class
      'section.abstract', // Abstract section
      '.abstract', // Abstract class
      '[data-component="abstract"]', // Data component abstract
      '.article-section__abstract', // Article section abstract
      '.article-section.abstract', // Alternative
      '#abstract' // Abstract ID
    ];
    
    for (const selector of lancetAbstractSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        abstract = element.textContent.trim();
        console.log('Q-SCI Content Script: Found Lancet abstract with selector:', selector);
        break;
      }
    }
    
    // Lancet full text selectors
    // The Lancet uses section.article-body for main content
    const lancetContentSelectors = [
      'section.article-body', // Lancet main article body
      '.article-body', // Alternative article body
      'article.article-content', // Article content
      '.article-content', // Article content class
      'main.main-content', // Main content
      '.main-content', // Main content class
      'main' // Generic main
    ];
    
    for (const selector of lancetContentSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        fullText = element.textContent.trim();
        console.log('Q-SCI Content Script: Found Lancet content with selector:', selector);
        break;
      }
    }
    
    // Lancet PDF link selectors
    const lancetPdfSelectors = [
      'a[href*=".pdf"]', // Direct PDF links
      'a[href*="pdf"]', // PDF in URL
      'a[title*="PDF"]', // PDF in title
      'a[aria-label*="PDF"]', // PDF in aria-label
      '.pdf-link', // PDF link class
      '.download-link', // Download link
      '[data-track-action="Download PDF"]', // Lancet tracking
      'a[href*="pdfplus"]', // Lancet PDF plus
      'a.downloadPdf' // Download PDF class
    ];
    
    lancetPdfSelectors.forEach(selector => {
      const links = document.querySelectorAll(selector);
      links.forEach(link => {
        if (link.href && !pdfUrlSet.has(link.href)) {
          if (link.href.includes('.pdf') || 
              link.href.includes('pdf') || 
              link.textContent.toLowerCase().includes('pdf') ||
              link.title?.toLowerCase().includes('pdf') ||
              link.getAttribute('aria-label')?.toLowerCase().includes('pdf')) {
            pdfUrlSet.add(link.href);
            console.log('Q-SCI Content Script: Found Lancet PDF URL:', link.href);
          }
        }
      });
    });
    
    // Strip references from abstract and full text
    abstract = stripReferences(abstract);
    fullText = stripReferences(fullText);
    
    // Combine text for analysis (prefer abstract, fallback to full text, then title)
    let analysisText = abstract || fullText || title;
    
    // If we have both abstract and some full text, combine them
    if (abstract && fullText && fullText !== abstract) {
      analysisText = abstract + '\n\n' + fullText.substring(0, MAX_FULLTEXT_LENGTH); // Limit full text
    }
    
    return {
      title: title,
      abstract: abstract,
      text: analysisText,
      pdfUrls: Array.from(pdfUrlSet), // Convert Set to Array
      hostname: 'thelancet.com',
      url: window.location.href
    };
  }
  
  // Generic extraction for other scientific sites
  function extractGenericData() {
    const hostname = window.location.hostname.toLowerCase();
    console.log('Q-SCI Content Script: Using generic extraction for:', hostname);
    
    let title = '';
    let abstract = '';
    let fullText = '';
    let pdfUrls = [];
    
    // Extract title using multiple selectors
    const titleSelectors = [
      'h1.heading-title', // PubMed
      'h1.title', // arXiv
      'h1[data-test="article-title"]', // Nature
      '.article-title', // Science
      'h1.article-header__title', // Cell
      'h1.c-article-title', // Springer
      'h1#artTitle', // PLOS
      '.meta-article-title', // JAMA
      'h1.article-title', // BMJ, NEJM
      '.citation__title', // Wiley
      'h1', // Generic fallback
      '.title' // Generic fallback
    ];
    
    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        title = element.textContent.trim();
        console.log('Q-SCI Content Script: Found title with selector:', selector);
        break;
      }
    }
    
    // Extract abstract using multiple selectors
    const abstractSelectors = [
      '.abstract-content', // PubMed, JAMA
      'blockquote.abstract', // arXiv
      '[data-test="abstract-section"]', // Nature
      '.section.abstract', // Science
      '.abstract', // Generic
      '.summary', // Lancet
      '.c-article-section__content', // Springer
      '#abstract', // Generic ID
      '.article-section__content', // Wiley
      '.abstract-text', // Alternative
      '.article-abstract' // Alternative
    ];
    
    for (const selector of abstractSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        abstract = element.textContent.trim();
        console.log('Q-SCI Content Script: Found abstract with selector:', selector);
        break;
      }
    }
    
    // Extract full text content for analysis
    const contentSelectors = [
      '.article-content',
      '.main-content',
      '.content',
      '.article-body',
      '.full-text',
      'main',
      '.paper-content'
    ];
    
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        fullText = element.textContent.trim();
        console.log('Q-SCI Content Script: Found full text with selector:', selector);
        break;
      }
    }
    
    // Find PDF links
    const pdfSelectors = [
      'a[href*=".pdf"]',
      'a[href*="pdf"]',
      'a[title*="PDF"]',
      'a[aria-label*="PDF"]',
      '.pdf-link',
      '.download-pdf',
      '[data-track-action="PDF"]',
      'a[href*="download"]',
      'a[href*="pmc/articles"]' // PMC links
    ];
    
    pdfSelectors.forEach(selector => {
      const links = document.querySelectorAll(selector);
      links.forEach(link => {
        if (link.href && !pdfUrls.includes(link.href)) {
          // Validate that it's likely a PDF link
          if (link.href.includes('.pdf') || 
              link.href.includes('pdf') || 
              link.textContent.toLowerCase().includes('pdf') ||
              link.title?.toLowerCase().includes('pdf')) {
            pdfUrls.push(link.href);
          }
        }
      });
    });
    
    // Strip references from abstract and full text to avoid misinterpreting
    // citations in the reference list as part of the main content
    abstract = stripReferences(abstract);
    fullText = stripReferences(fullText);

    // Combine text for analysis (prefer abstract, fallback to full text, then title)
    let analysisText = abstract || fullText || title;

    // If we have both abstract and some full text, combine them
    if (abstract && fullText && fullText !== abstract) {
      analysisText = abstract + '\n\n' + fullText.substring(0, MAX_FULLTEXT_LENGTH); // Limit full text
    }
    
    const result = {
      title: title,
      abstract: abstract,
      text: analysisText,
      pdfUrls: pdfUrls,
      hostname: hostname,
      url: window.location.href
    };
    
    console.log('Q-SCI Content Script: Extraction result:', {
      title: result.title ? result.title.substring(0, 50) + '...' : 'None',
      abstract: result.abstract ? result.abstract.substring(0, 50) + '...' : 'None',
      text: result.text ? result.text.substring(0, 50) + '...' : 'None',
      textLength: result.text ? result.text.length : 0,
      pdfUrls: result.pdfUrls.length,
      hostname: result.hostname
    });
    
    return result;
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  console.log('Q-SCI Content Script: Setup complete');
})();

