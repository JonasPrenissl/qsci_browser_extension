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
          sendResponse({ 
            success: false, 
            error: 'Insufficient content found. Please ensure you are on a paper details page with abstract or content.' 
          });
        }
      }, EXTRACTION_DELAY);
      
    } catch (error) {
      console.error('Q-SCI Content Script: Extraction error:', error);
      sendResponse({ 
        success: false, 
        error: error.message || 'Failed to extract page content' 
      });
    }
  }
  
  // Extract page data from current page
  function extractPageData() {
    const hostname = window.location.hostname.toLowerCase();
    console.log('Q-SCI Content Script: Extracting from hostname:', hostname);
    
    let title = '';
    let abstract = '';
    let fullText = '';
    let pdfUrls = [];
    
    // Site-specific extraction for better accuracy
    if (hostname.includes('pmc.ncbi.nlm.nih.gov')) {
      return extractPMCData();
    } else if (hostname.includes('pubmed.ncbi.nlm.nih.gov')) {
      return extractPubMedData();
    } else if (hostname.includes('arxiv.org')) {
      return extractArXivData();
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
      analysisText = abstract + '\n\n' + fullText.substring(0, 2000); // Limit full text
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
      analysisText = abstract + '\n\n' + fullText.substring(0, 2000); // Limit full text
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

