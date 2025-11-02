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
  const EXTRACTION_DELAY = 2000; // Wait for page to fully load (increased from 1000ms)
  const MAX_FULLTEXT_LENGTH = 100000; // Maximum characters to include from full text when combining with abstract (increased to capture full articles for quality analysis)
  const PDF_EXTRACTION_DELAY = 3000; // Wait longer for PDF viewers to render text
  // Dynamic content delay: increased to 7.0s for The Lancet and similar complex sites
  // - Simple static sites: 1-2 seconds (don't use dynamic detection)
  // - Standard React/Vue apps: 2-3 seconds
  // - Complex sites like The Lancet with heavy content: 5-7 seconds required
  // - We use 7.0s for Lancet specifically to handle slow networks and complex rendering
  // - Trade-off: slightly longer wait vs. reliable extraction
  // Future enhancement: Use MutationObserver for intelligent waiting or configurable site-specific delays
  const DYNAMIC_CONTENT_DELAY = 5000; // Wait for dynamically loaded content (React, Vue, etc.)
  const LANCET_CONTENT_DELAY = 7000; // Extra delay for The Lancet due to complex React rendering (TODO: make configurable)
  const MIN_SUBSTANTIVE_LENGTH = 200; // Minimum length for substantive scientific content
  const META_FALLBACK_THRESHOLD = 100; // Trigger meta tag fallback when extracted content is below this length
  
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
      
      // Check if page might have dynamic content (React, Vue, etc.)
      const hasDynamicContent = document.querySelector('[data-react-root], [data-reactroot], #root, #app, [ng-app], [data-vue-app]') !== null;
      
      // Check if this is The Lancet website (needs extra time for complex React rendering)
      // TODO: Extract to configurable site-specific delay map for better maintainability
      const isLancet = window.location.hostname.toLowerCase().includes('thelancet.com');
      
      // Determine appropriate delay based on page characteristics
      // Priority: PDF > Lancet+Dynamic > Dynamic > Regular
      let delay = EXTRACTION_DELAY;
      if (isPdf) {
        delay = PDF_EXTRACTION_DELAY;
      } else if (isLancet && hasDynamicContent) {
        delay = LANCET_CONTENT_DELAY;
      } else if (hasDynamicContent) {
        delay = DYNAMIC_CONTENT_DELAY;
      }
      
      console.log('Q-SCI Content Script: Using extraction delay:', delay, 'ms', 
        isPdf ? '(PDF page)' : 
        (isLancet && hasDynamicContent ? '(Lancet dynamic content)' : 
        (hasDynamicContent ? '(dynamic content detected)' : '(regular page)')));
      
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
    
    // Strategy 1: Try to extract text from PDF.js text layer if available
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
    
    // Strategy 2: Try to extract from various viewer-specific elements
    if (!text || text.length < 100) {
      console.log('Q-SCI Content Script: Trying viewer-specific text extraction');
      
      // Common PDF viewer text container selectors
      const viewerTextSelectors = [
        '.pdfViewer .textLayer',
        '#viewer .textLayer',
        '[class*="pdf"] [class*="text"]',
        '[class*="viewer"] [class*="text"]',
        '.page .textLayer',
        '.pdf-page .textLayer',
        '[data-page-number] .textLayer',
        // Some sites use canvas + text overlays
        '.canvasWrapper + .textLayer',
        // Generic text container patterns
        '[role="document"] [class*="text"]',
        '.document-content',
        '.pdf-content'
      ];
      
      for (const selector of viewerTextSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          let combinedText = '';
          elements.forEach(el => {
            const elText = el.textContent || '';
            if (elText.trim()) {
              combinedText += elText + '\n';
            }
          });
          
          if (combinedText.length > 100) {
            text = combinedText.trim();
            console.log('Q-SCI Content Script: Extracted from viewer selector', selector, '-', text.length, 'characters');
            break;
          }
        }
      }
    }
    
    // Strategy 3: Try to extract from main content areas with comprehensive selectors
    if (!text || text.length < 100) {
      console.log('Q-SCI Content Script: Trying main content extraction');
      
      const mainContentSelectors = [
        'main',
        '[role="main"]',
        '#main',
        '.main',
        '#content',
        '.content',
        'article',
        '[role="article"]',
        '.article',
        '#mainContent',
        '.main-content'
      ];
      
      for (const selector of mainContentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const elText = element.textContent || '';
          if (elText.trim().length > 100) {
            text = elText.trim();
            console.log('Q-SCI Content Script: Extracted from main content selector', selector, '-', text.length, 'characters');
            break;
          }
        }
      }
    }
    
    // Strategy 4: Extract all visible text from body as last resort
    if (!text || text.length < 100) {
      console.log('Q-SCI Content Script: Trying body text extraction as fallback');
      
      // Get all text nodes without cloning - more efficient
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function(node) {
            // Skip text nodes inside script, style, noscript tags
            const parent = node.parentElement;
            if (parent && ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED'].includes(parent.tagName)) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );
      
      let bodyText = '';
      let node;
      while (node = walker.nextNode()) {
        const nodeText = node.textContent || '';
        if (nodeText.trim()) {
          bodyText += nodeText;
        }
      }
      
      if (bodyText.trim().length > 100) {
        text = bodyText.trim();
        console.log('Q-SCI Content Script: Extracted from body:', text.length, 'characters');
      }
    }
    
    // Log information about iframes/embeds even if we can't access them
    if (!text || text.length < 100) {
      const pdfIframe = document.querySelector('iframe[src*="pdf"], iframe[src*="showPdf"]');
      if (pdfIframe) {
        console.log('Q-SCI Content Script: Found PDF iframe, but cannot access content due to cross-origin restrictions');
      }
      
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
  
  /**
   * Clean and validate extracted text to ensure it contains substantive scientific content.
   * Removes navigation, headers, footers, cookie banners, and other non-content text.
   * @param {string} text - extracted text
   * @returns {string} cleaned text
   */
  function cleanExtractedText(text) {
    if (!text) return '';
    
    // Remove common non-content patterns
    const patternsToRemove = [
      // Navigation and menu patterns
      /\b(Home|About|Contact|Login|Sign in|Sign up|Register|Subscribe|Menu|Navigation)\b/gi,
      // Cookie consent patterns
      /\b(Cookie|Cookies|We use cookies|Accept cookies|Privacy Policy|Terms of Service)\b.*?(\.|$)/gi,
      // Social media patterns  
      /\b(Share|Tweet|Facebook|Twitter|LinkedIn|Email this|Print)\b/gi,
      // Common website footer patterns
      /\b(Copyright|©|\(c\)|All rights reserved|Terms|Privacy)\b.*?(\.|$)/gi,
      // Journal navigation patterns
      /\b(Previous article|Next article|Back to|View PDF|Download PDF)\b/gi,
      // Subscription/paywall patterns
      /\b(Subscribe now|Get access|Purchase|Buy article)\b.*?(\.|$)/gi
    ];
    
    let cleaned = text;
    for (const pattern of patternsToRemove) {
      cleaned = cleaned.replace(pattern, '');
    }
    
    // Remove excessive whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }
  
  /**
   * Check if text is just a loading placeholder.
   * Returns true if the text appears to be a "loading" message rather than actual content.
   * @param {string} text - text to check
   * @returns {boolean} true if text is a loading placeholder
   */
  function isLoadingPlaceholder(text) {
    if (!text || text.length === 0) return true;
    
    const loadingPatterns = [
      /^\s*loading\.{0,3}\s*$/i,
      /^\s*please wait\.{0,3}\s*$/i,
      /^\s*loading (article|content|page)\.{0,3}\s*$/i,
      /^\s*loading\.{3,}\s*$/i,
      /^[\s.]*$/, // Only whitespace or dots
    ];
    
    const trimmed = text.trim().toLowerCase();
    
    // Check if text is very short and matches loading patterns
    if (trimmed.length < 50) {
      for (const pattern of loadingPatterns) {
        if (pattern.test(trimmed)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Validate that extracted text contains substantive scientific content.
   * Checks for scientific indicators like methods, results, study design terms.
   * @param {string} text - text to validate
   * @returns {boolean} true if text appears to be scientific content
   */
  function isSubstantiveScientificContent(text) {
    if (!text || text.length < MIN_SUBSTANTIVE_LENGTH) {
      return false;
    }
    
    // Check for scientific content indicators
    const scientificIndicators = [
      // Study design indicators
      /\b(study|trial|experiment|research|investigation|analysis|survey|cohort|sample)\b/i,
      // Methods indicators
      /\b(method|methodology|procedure|protocol|measurement|data|statistical|participants?|patients?)\b/i,
      // Results indicators
      /\b(result|finding|outcome|conclusion|significant|p\s*[<>=]|effect|correlation)\b/i,
      // Abstract/paper structure indicators
      /\b(abstract|introduction|background|methods?|results?|discussion|conclusion)\b/i,
      // Medical/scientific terminology
      /\b(treatment|intervention|diagnosis|clinical|medical|therapeutic|disease|condition|syndrome)\b/i
    ];
    
    // Count how many indicators are present
    let indicatorCount = 0;
    for (const indicator of scientificIndicators) {
      if (indicator.test(text)) {
        indicatorCount++;
      }
    }
    
    // Text should match at least 2 scientific indicators to be considered substantive
    return indicatorCount >= 2;
  }
  
  /**
   * Extract content from meta tags as a fallback when DOM selectors fail.
   * This handles cases where React/Vue hasn't rendered yet but meta tags exist.
   * @param {string} currentTitle - currently extracted title
   * @param {string} currentAbstract - currently extracted abstract
   * @returns {Object} object with {title, abstract, text} from meta tags
   */
  function extractMetaTagFallback(currentTitle, currentAbstract) {
    console.log('Q-SCI Content Script: Attempting meta tag fallback extraction');
    
    const metaTitle = document.querySelector('meta[name="citation_title"]')?.getAttribute('content') || '';
    const metaAbstract = document.querySelector('meta[name="citation_abstract"]')?.getAttribute('content') || '';
    const ogDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
    const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    
    let title = currentTitle;
    let abstract = currentAbstract;
    let text = '';
    
    // Use title from meta if not already found
    if (!title && metaTitle) {
      title = metaTitle;
      console.log('Q-SCI Content Script: Using meta citation_title as fallback');
    }
    
    // Build fallback text from meta tags (in priority order)
    let metaText = '';
    if (metaAbstract) {
      metaText = metaAbstract;
      console.log('Q-SCI Content Script: Using meta citation_abstract as fallback');
    } else if (ogDescription) {
      metaText = ogDescription;
      console.log('Q-SCI Content Script: Using og:description as fallback');
    } else if (metaDescription) {
      metaText = metaDescription;
      console.log('Q-SCI Content Script: Using meta description as fallback');
    }
    
    // Combine meta title and description for better analysis
    if (metaTitle && metaText) {
      text = metaTitle + '. ' + metaText;
    } else if (metaText) {
      text = metaText;
    } else if (metaTitle) {
      text = metaTitle;
    }
    
    // If we got something from meta tags, use it as abstract too if we don't have one
    if (metaText && !abstract) {
      abstract = metaText;
    }
    
    if (text) {
      console.log('Q-SCI Content Script: Meta tag fallback provided', text.length, 'characters');
    } else {
      console.log('Q-SCI Content Script: Meta tag fallback found no content');
    }
    
    return { title, abstract, text };
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
    
    // Lancet title selectors - try multiple approaches including modern framework patterns
    const lancetTitleSelectors = [
      'h1.article-header__title', // Lancet article header
      'h1.article-title', // Alternative article title
      '.article-header h1', // Header h1
      'header h1', // Generic header h1
      '[data-component="article-header"] h1', // Data component header
      '[data-testid="article-title"]', // Test ID pattern
      '[data-component="article-title"]', // Data component title
      'h1[itemprop="headline"]', // Schema.org markup
      'h1[itemprop="name"]', // Schema.org name
      '.citation__title', // Citation title
      '[class*="article-title"]', // Pattern matching
      '[class*="ArticleTitle"]', // CamelCase variant
      'meta[name="citation_title"]', // Meta tag for title
      'meta[property="og:title"]', // Open Graph title
      'h1', // Generic fallback
      '.title h1', // Title container
      '#article-title' // ID-based selector
    ];
    
    for (const selector of lancetTitleSelectors) {
      // Handle meta tags differently
      if (selector.startsWith('meta')) {
        const element = document.querySelector(selector);
        if (element && element.getAttribute('content')?.trim()) {
          title = element.getAttribute('content').trim();
          console.log('Q-SCI Content Script: Found Lancet title with selector:', selector);
          break;
        }
      } else {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          title = element.textContent.trim();
          console.log('Q-SCI Content Script: Found Lancet title with selector:', selector);
          break;
        }
      }
    }
    
    // Lancet abstract/summary selectors - enhanced for modern frameworks
    // The Lancet often uses "Summary" instead of "Abstract"
    const lancetAbstractSelectors = [
      'section.summary', // Lancet summary section
      '.summary', // Summary class
      'section.abstract', // Abstract section
      '.abstract', // Abstract class
      '[data-component="abstract"]', // Data component abstract
      '[data-component="summary"]', // Data component summary
      '[data-testid="abstract"]', // Test ID abstract
      '[data-testid="summary"]', // Test ID summary
      '.article-section__abstract', // Article section abstract
      '.article-section.abstract', // Alternative
      '#abstract', // Abstract ID
      '#summary', // Summary ID
      'section[id*="abstract"]', // ID pattern matching
      'section[id*="summary"]', // ID pattern matching
      'section[id*="Abstract"]', // CamelCase Abstract
      'section[id*="Summary"]', // CamelCase Summary
      'div[id*="abstract"]', // Div ID pattern
      'div[id*="summary"]', // Div ID pattern
      '[class*="abstract"]', // Pattern matching
      '[class*="summary"]', // Pattern matching
      '[class*="Summary"]', // CamelCase Summary
      'section[aria-label*="abstract"]', // Semantic
      'section[aria-label*="summary"]', // Semantic
      'div[role="region"][aria-label*="abstract"]', // ARIA region
      'div[role="region"][aria-label*="summary"]', // ARIA region
      '[itemprop="abstract"]', // Schema.org abstract
      '[itemprop="description"]', // Schema.org description
      'meta[name="citation_abstract"]' // Meta tag for abstract
    ];
    
    for (const selector of lancetAbstractSelectors) {
      // Handle meta tags differently
      if (selector.startsWith('meta')) {
        const element = document.querySelector(selector);
        if (element && element.getAttribute('content')?.trim()) {
          abstract = element.getAttribute('content').trim();
          console.log('Q-SCI Content Script: Found Lancet abstract with selector:', selector);
          break;
        }
      } else {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          abstract = element.textContent.trim();
          console.log('Q-SCI Content Script: Found Lancet abstract with selector:', selector);
          break;
        }
      }
    }
    
    // Lancet full text selectors - enhanced for modern frameworks
    // The Lancet uses section.article-body for main content
    const lancetContentSelectors = [
      'section.article-body', // Lancet main article body
      '.article-body', // Alternative article body
      '[data-component="article-body"]', // Data component body
      '[data-testid="article-body"]', // Test ID body
      'article.article-content', // Article content
      '.article-content', // Article content class
      '[data-component="article-content"]', // Data component content
      'main.main-content', // Main content
      '.main-content', // Main content class
      'main', // Generic main
      '[role="main"]', // Semantic main
      'article', // Article tag
      '.article', // Article class
      '[itemprop="articleBody"]', // Schema.org article body
      '[class*="article-body"]', // Pattern matching
      '[class*="ArticleBody"]', // CamelCase variant
      '[class*="articleBody"]', // camelCase variant
      '#article-content', // ID-based selector
      '#main-content', // Main content ID
      '.fulltext-view', // Full text view
      '.full-text', // Full text
      '[data-component="fulltext"]', // Data component fulltext
      '[data-component="full-text"]' // Data component full-text
    ];
    
    for (const selector of lancetContentSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        fullText = element.textContent.trim();
        console.log('Q-SCI Content Script: Found Lancet content with selector:', selector);
        break;
      }
    }
    
    // If no full text found, try extracting paragraphs from various containers
    if (!fullText && !abstract) {
      console.log('Q-SCI Content Script: Trying Lancet paragraph extraction');
      
      // Try to find section containers with content - cast wider net
      const sectionContainers = document.querySelectorAll(
        'section[id*="section"], ' +
        'section[id*="Section"], ' +
        'section[class*="section"], ' +
        'section[class*="Section"], ' +
        'div[class*="section"], ' +
        'div[class*="Section"], ' +
        'div[id*="section"], ' +
        'div[id*="content"], ' +
        'div[data-component*="section"], ' +
        'div[data-component*="content"], ' +
        'article, main, [role="main"], ' +
        '[itemprop="articleBody"]'
      );
      
      if (sectionContainers.length > 0) {
        let combinedText = '';
        sectionContainers.forEach(container => {
          // Skip navigation, header, footer containers
          if (container.closest('nav, header, footer, aside')) {
            return;
          }
          
          const paragraphs = container.querySelectorAll('p');
          paragraphs.forEach(p => {
            // Skip paragraphs in navigation, header, footer
            if (p.closest('nav, header, footer, aside')) {
              return;
            }
            
            const pText = p.textContent || '';
            if (pText.trim().length > 50) {
              combinedText += pText.trim() + '\n\n';
            }
          });
        });
        
        if (combinedText.length > 100) {
          fullText = combinedText.trim();
          console.log('Q-SCI Content Script: Extracted Lancet text from section paragraphs:', fullText.length, 'characters');
        }
      }
      
      // If still no content, try extracting from div with text content
      if (!fullText || fullText.length < 100) {
        console.log('Q-SCI Content Script: Trying div-based extraction for Lancet');
        const contentDivs = document.querySelectorAll(
          'div[class*="content"]:not([class*="nav"]):not([class*="menu"]):not([class*="header"]):not([class*="footer"]), ' +
          'div[class*="Content"]:not([class*="Nav"]):not([class*="Menu"]):not([class*="Header"]):not([class*="Footer"]), ' +
          'div[class*="text"]:not([class*="nav"]):not([class*="menu"]), ' +
          'div[class*="body"]:not([class*="nav"]):not([class*="menu"]), ' +
          'div[class*="Body"]:not([class*="Nav"]):not([class*="Menu"]), ' +
          'div[data-component]:not([data-component*="nav"]):not([data-component*="menu"]):not([data-component*="header"]):not([data-component*="footer"])'
        );
        
        let combinedText = '';
        contentDivs.forEach(div => {
          // Skip navigation sections
          if (div.closest('nav, header, footer, aside')) {
            return;
          }
          
          const divText = div.textContent || '';
          if (divText.trim().length > 100) {
            combinedText += divText.trim() + '\n\n';
          }
        });
        
        if (combinedText.length > 100) {
          fullText = combinedText.trim();
          console.log('Q-SCI Content Script: Extracted Lancet text from content divs:', fullText.length, 'characters');
        }
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
    
    // Clean the extracted text
    abstract = cleanExtractedText(abstract);
    fullText = cleanExtractedText(fullText);
    
    // Combine text for analysis (prefer abstract, fallback to full text, then title)
    let analysisText = abstract || fullText || title;
    
    // If we have both abstract and some full text, combine them
    if (abstract && fullText && fullText !== abstract) {
      analysisText = abstract + '\n\n' + fullText.substring(0, MAX_FULLTEXT_LENGTH); // Limit full text
    }
    
    // Check if the extracted text is just a loading placeholder
    if (isLoadingPlaceholder(analysisText)) {
      console.log('Q-SCI Content Script: Detected loading placeholder, attempting meta tag fallback');
      analysisText = '';
    }
    
    // If no substantial content found, try to use meta tags as fallback
    // This handles cases where React/Vue hasn't rendered the DOM yet but meta tags exist
    if (!analysisText || analysisText.length < META_FALLBACK_THRESHOLD) {
      console.log('Q-SCI Content Script: Insufficient content from selectors, trying meta tag fallback');
      const metaFallback = extractMetaTagFallback(title, abstract);
      title = metaFallback.title;
      abstract = metaFallback.abstract;
      analysisText = metaFallback.text || analysisText;
    }
    
    // Validate that we have substantive scientific content
    const isSubstantive = isSubstantiveScientificContent(analysisText);
    console.log('Q-SCI Content Script: Lancet content validation -', 
      'Length:', analysisText.length, 
      'Substantive:', isSubstantive,
      'Preview:', analysisText.substring(0, 200) + '...');
    
    // Log a warning if content seems insufficient
    if (!isSubstantive && analysisText.length < MIN_SUBSTANTIVE_LENGTH) {
      console.warn('Q-SCI Content Script: WARNING - Lancet extraction may have failed.',
        'Content length:', analysisText.length,
        'Consider waiting longer for page to load or checking selectors.');
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
    
    // Extract title using multiple selectors including modern framework patterns
    const titleSelectors = [
      'h1.heading-title', // PubMed
      'h1.title', // arXiv
      'h1[data-test="article-title"]', // Nature
      'h1[data-testid="article-title"]', // Alternative Nature
      '[data-component="article-title"]', // Data component pattern
      '[data-testid="title"]', // Test ID pattern
      'h1[itemprop="headline"]', // Schema.org headline
      'h1[itemprop="name"]', // Schema.org name
      '.article-title', // Science
      'h1.article-header__title', // Cell, Lancet
      'h1.c-article-title', // Springer
      'h1#artTitle', // PLOS
      '.meta-article-title', // JAMA
      'h1.article-title', // BMJ, NEJM
      '.citation__title', // Wiley
      '[class*="article-title"]', // Generic pattern matching
      '[class*="ArticleTitle"]', // CamelCase variants
      'meta[name="citation_title"]', // Meta tag for title
      'meta[property="og:title"]', // Open Graph title
      'header h1', // Header with h1
      'h1', // Generic fallback
      '.title', // Generic fallback
      '#article-title' // ID-based selector
    ];
    
    for (const selector of titleSelectors) {
      // Handle meta tags differently
      if (selector.startsWith('meta')) {
        const element = document.querySelector(selector);
        if (element && element.getAttribute('content')?.trim()) {
          title = element.getAttribute('content').trim();
          console.log('Q-SCI Content Script: Found title with selector:', selector);
          break;
        }
      } else {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          title = element.textContent.trim();
          console.log('Q-SCI Content Script: Found title with selector:', selector);
          break;
        }
      }
    }
    
    // Extract abstract using multiple selectors including modern framework patterns
    const abstractSelectors = [
      '.abstract-content', // PubMed, JAMA
      'blockquote.abstract', // arXiv
      '[data-test="abstract-section"]', // Nature
      '[data-testid="abstract-section"]', // Alternative Nature
      '[data-component="abstract"]', // Data component pattern
      '[data-component="summary"]', // Summary component
      '[data-testid="abstract"]', // Test ID pattern
      '[data-testid="summary"]', // Summary test ID
      '[itemprop="abstract"]', // Schema.org abstract
      '[itemprop="description"]', // Schema.org description
      '.section.abstract', // Science
      'section.abstract', // Alternative
      'section.summary', // Summary section
      '.abstract', // Generic
      '.summary', // Lancet summary
      '.c-article-section__content', // Springer
      '#abstract', // Generic ID
      '#summary', // Summary ID
      '.article-section__content', // Wiley
      '.abstract-text', // Alternative
      '.article-abstract', // Alternative
      '[class*="abstract"]', // Generic pattern matching
      '[class*="Abstract"]', // CamelCase variants
      '[class*="summary"]', // Summary variants
      '[class*="Summary"]', // Summary CamelCase
      '[id*="abstract"]', // ID pattern matching
      '[id*="Abstract"]', // ID CamelCase
      '[id*="summary"]', // ID summary
      '[id*="Summary"]', // ID summary CamelCase
      'section[id*="abstract"]', // Section ID pattern
      'section[id*="summary"]', // Section ID summary
      'div[id*="abstract"]', // Div ID pattern
      'div[id*="summary"]', // Div ID summary
      '[role="region"][aria-label*="abstract"]', // Semantic abstract
      '[role="region"][aria-label*="summary"]', // Semantic summary
      'section[aria-label*="abstract"]', // Section with label
      'section[aria-label*="summary"]', // Section summary label
      'meta[name="citation_abstract"]' // Meta tag for abstract
    ];
    
    for (const selector of abstractSelectors) {
      // Handle meta tags differently
      if (selector.startsWith('meta')) {
        const element = document.querySelector(selector);
        if (element && element.getAttribute('content')?.trim()) {
          abstract = element.getAttribute('content').trim();
          console.log('Q-SCI Content Script: Found abstract with selector:', selector);
          break;
        }
      } else {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          abstract = element.textContent.trim();
          console.log('Q-SCI Content Script: Found abstract with selector:', selector);
          break;
        }
      }
    }
    
    // Extract full text content for analysis with comprehensive selectors including modern patterns
    const contentSelectors = [
      'section.article-body', // Lancet and others
      '.article-body', // Common article body
      '[data-component="article-body"]', // Data component body
      '[data-testid="article-body"]', // Test ID body
      '[itemprop="articleBody"]', // Schema.org article body
      '.article-content', // Common article content
      'article.article-content', // Article tag with content class
      '[data-component="article-content"]', // Data component content
      '.main-content', // Main content
      'main.main-content', // Main tag with content class
      '.content', // Generic content
      '.full-text', // Full text class
      '.fulltext-view', // Full text view
      'main', // Generic main tag
      '[role="main"]', // Semantic main
      '.paper-content', // Paper content
      '.article', // Generic article
      'article', // Article tag
      '[class*="article-body"]', // Pattern matching
      '[class*="ArticleBody"]', // CamelCase variants
      '[class*="articleBody"]', // camelCase variants
      '[class*="content"]', // Generic content pattern
      '[class*="Content"]', // CamelCase content
      '[class*="fulltext"]', // Full text pattern
      '[class*="full-text"]', // Full-text pattern
      '.document-content', // Document content
      '#main-content', // Main content ID
      '#content', // Content ID
      '#article-content', // Article content ID
      '.body-content', // Body content
      '[data-component*="content"]', // Data component with content
      '[data-component="fulltext"]', // Data component fulltext
      '[data-component="full-text"]' // Data component full-text
    ];
    
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        fullText = element.textContent.trim();
        console.log('Q-SCI Content Script: Found full text with selector:', selector);
        break;
      }
    }
    
    // If still no content, try to extract from all paragraphs and sections
    if (!fullText && !abstract) {
      console.log('Q-SCI Content Script: Trying paragraph and section extraction as fallback');
      
      // Try extracting all paragraphs within article-like containers first
      const articleContainers = document.querySelectorAll(
        'article, main, [role="main"], ' +
        '.article, .paper, ' +
        '[data-component*="article"], ' +
        '[data-component*="content"], ' +
        '[itemprop="articleBody"], ' +
        'section[id*="section"], ' +
        'section[id*="Section"], ' +
        'div[class*="article"], ' +
        'div[class*="Article"], ' +
        'div[id*="content"], ' +
        'div[id*="article"]'
      );
      
      if (articleContainers.length > 0) {
        let combinedText = '';
        articleContainers.forEach(container => {
          // Skip navigation, header, footer containers
          if (container.closest('nav, header, footer, aside')) {
            return;
          }
          
          const paragraphs = container.querySelectorAll('p');
          paragraphs.forEach(p => {
            // Skip paragraphs in navigation, headers, footers
            if (p.closest('nav, header, footer, aside')) {
              return;
            }
            
            const pText = p.textContent || '';
            if (pText.trim().length > 50) {
              combinedText += pText.trim() + '\n\n';
            }
          });
        });
        
        if (combinedText.length > 100) {
          fullText = combinedText.trim();
          console.log('Q-SCI Content Script: Extracted from paragraphs in containers:', fullText.length, 'characters');
        }
      }
      
      // Try extracting all paragraphs from body as last resort
      if (!fullText) {
        const allParagraphs = document.querySelectorAll('body p');
        let combinedText = '';
        allParagraphs.forEach(p => {
          const pText = p.textContent || '';
          // Skip navigation, headers, footers, and short paragraphs
          if (pText.trim().length > 50 && 
              !p.closest('nav') && 
              !p.closest('header') && 
              !p.closest('footer') &&
              !p.closest('aside')) {
            combinedText += pText.trim() + '\n\n';
          }
        });
        
        if (combinedText.length > 100) {
          fullText = combinedText.trim();
          console.log('Q-SCI Content Script: Extracted from all paragraphs:', fullText.length, 'characters');
        }
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
    
    // Clean the extracted text
    abstract = cleanExtractedText(abstract);
    fullText = cleanExtractedText(fullText);

    // Combine text for analysis (prefer abstract, fallback to full text, then title)
    let analysisText = abstract || fullText || title;

    // If we have both abstract and some full text, combine them
    if (abstract && fullText && fullText !== abstract) {
      analysisText = abstract + '\n\n' + fullText.substring(0, MAX_FULLTEXT_LENGTH); // Limit full text
    }
    
    // Check if the extracted text is just a loading placeholder
    if (isLoadingPlaceholder(analysisText)) {
      console.log('Q-SCI Content Script: Detected loading placeholder, attempting meta tag fallback');
      analysisText = '';
    }
    
    // If no substantial content found, try to use meta tags as fallback
    // This handles cases where React/Vue hasn't rendered the DOM yet but meta tags exist
    if (!analysisText || analysisText.length < META_FALLBACK_THRESHOLD) {
      console.log('Q-SCI Content Script: Insufficient content from selectors, trying meta tag fallback');
      const metaFallback = extractMetaTagFallback(title, abstract);
      title = metaFallback.title;
      abstract = metaFallback.abstract;
      analysisText = metaFallback.text || analysisText;
    }
    
    // Validate that we have substantive scientific content
    const isSubstantive = isSubstantiveScientificContent(analysisText);
    console.log('Q-SCI Content Script: Generic content validation -', 
      'Length:', analysisText.length, 
      'Substantive:', isSubstantive,
      'Preview:', analysisText.substring(0, 150) + '...');
    
    // Log a warning if content seems insufficient
    if (!isSubstantive && analysisText.length < MIN_SUBSTANTIVE_LENGTH) {
      console.warn('Q-SCI Content Script: WARNING - Content extraction may be insufficient.',
        'Content length:', analysisText.length,
        'Site:', hostname);
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
      hostname: result.hostname,
      isSubstantive: isSubstantive
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

