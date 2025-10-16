// Q-SCI Browser Extension - Content Script
// Automatically detects scientific papers and triggers analysis

(function() {
  'use strict';
  
  // Prevent multiple injections
  if (window.qsciExtensionLoaded) {
    return;
  }
  window.qsciExtensionLoaded = true;
  
  console.log('Q-SCI Content Script loaded on:', window.location.hostname);
  
  // Configuration
  const CONFIG = {
    autoAnalyzeDelay: 3000, // 3 seconds delay
    retryAttempts: 3,
    retryDelay: 2000
  };
  
  // State management
  let analysisInProgress = false;
  let currentAnalysis = null;
  let qsciWidget = null;
  let settings = {};
  
  // Initialize the extension
  init();
  
  async function init() {
    try {
      // Load settings
      settings = await getSettings();
      
      // Detect the current site and paper
      const siteInfo = detectSite();
      if (!siteInfo) {
        console.log('Q-SCI: Site not supported or no paper detected');
        return;
      }
      
      console.log('Q-SCI: Detected site:', siteInfo.site);
      
      // Wait for page to fully load
      if (document.readyState !== 'complete') {
        window.addEventListener('load', () => {
          setTimeout(() => startAnalysis(siteInfo), CONFIG.autoAnalyzeDelay);
        });
      } else {
        setTimeout(() => startAnalysis(siteInfo), CONFIG.autoAnalyzeDelay);
      }
      
    } catch (error) {
      console.error('Q-SCI initialization error:', error);
    }
  }
  
  // Detect which scientific site we're on and extract paper information
  function detectSite() {
    const hostname = window.location.hostname;
    const url = window.location.href;
    
    // PubMed detection
    if (hostname.includes('pubmed.ncbi.nlm.nih.gov')) {
      return detectPubMed();
    }
    
    // arXiv detection
    if (hostname.includes('arxiv.org')) {
      return detectArXiv();
    }
    
    // Google Scholar detection
    if (hostname.includes('scholar.google.com')) {
      return detectGoogleScholar();
    }
    
    // Nature journals
    if (hostname.includes('nature.com')) {
      return detectNature();
    }
    
    // Science journals
    if (hostname.includes('science.org')) {
      return detectScience();
    }
    
    // Cell journals
    if (hostname.includes('cell.com')) {
      return detectCell();
    }
    
    // The Lancet
    if (hostname.includes('thelancet.com')) {
      return detectLancet();
    }
    
    // JAMA Network
    if (hostname.includes('jamanetwork.com')) {
      return detectJAMA();
    }
    
    // NEJM
    if (hostname.includes('nejm.org')) {
      return detectNEJM();
    }
    
    // PLOS journals
    if (hostname.includes('journals.plos.org')) {
      return detectPLOS();
    }
    
    // BMJ
    if (hostname.includes('bmj.com')) {
      return detectBMJ();
    }
    
    // ScienceDirect
    if (hostname.includes('sciencedirect.com')) {
      return detectScienceDirect();
    }
    
    // Wiley Online Library
    if (hostname.includes('onlinelibrary.wiley.com')) {
      return detectWiley();
    }
    
    // Springer Link
    if (hostname.includes('link.springer.com')) {
      return detectSpringer();
    }
    
    // Generic detection for other sites
    return detectGeneric();
  }
  
  // Site-specific detection functions
  function detectPubMed() {
    // Check if we're on an article page
    const pmid = extractPMID();
    if (!pmid) return null;
    
    const title = document.querySelector('h1.heading-title')?.textContent?.trim() ||
                  document.querySelector('.abstract-title')?.textContent?.trim();
    
    const abstract = document.querySelector('.abstract-content')?.textContent?.trim();
    
    // Look for PDF links
    const pdfLinks = findPDFLinks();
    
    return {
      site: 'pubmed',
      pmid: pmid,
      title: title,
      abstract: abstract,
      pdfUrls: pdfLinks,
      url: window.location.href,
      insertionPoint: document.querySelector('.abstract') || document.querySelector('.article-details')
    };
  }
  
  function detectArXiv() {
    // Check if we're on a paper page
    if (!window.location.pathname.includes('/abs/') && !window.location.pathname.includes('/pdf/')) {
      return null;
    }
    
    const title = document.querySelector('h1.title')?.textContent?.replace('Title:', '').trim();
    const abstract = document.querySelector('blockquote.abstract')?.textContent?.replace('Abstract:', '').trim();
    
    // arXiv PDF URL
    const arxivId = window.location.pathname.match(/\/(abs|pdf)\/(.+)/)?.[2];
    const pdfUrl = arxivId ? `https://arxiv.org/pdf/${arxivId}.pdf` : null;
    
    return {
      site: 'arxiv',
      arxivId: arxivId,
      title: title,
      abstract: abstract,
      pdfUrls: pdfUrl ? [pdfUrl] : [],
      url: window.location.href,
      insertionPoint: document.querySelector('.abstract') || document.querySelector('.submission-history')
    };
  }
  
  function detectGoogleScholar() {
    // Look for individual paper results
    const paperElements = document.querySelectorAll('[data-lid]');
    if (paperElements.length === 0) return null;
    
    // For now, analyze the first paper result
    const firstPaper = paperElements[0];
    const title = firstPaper.querySelector('h3 a')?.textContent?.trim();
    const snippet = firstPaper.querySelector('.gs_rs')?.textContent?.trim();
    
    const pdfLinks = Array.from(firstPaper.querySelectorAll('a'))
      .filter(a => a.textContent.includes('[PDF]') || a.href.includes('.pdf'))
      .map(a => a.href);
    
    return {
      site: 'scholar',
      title: title,
      snippet: snippet,
      pdfUrls: pdfLinks,
      url: window.location.href,
      insertionPoint: firstPaper
    };
  }
  
  function detectNature() {
    // Check if we're on an article page
    if (!window.location.pathname.includes('/articles/')) return null;
    
    const title = document.querySelector('h1[data-test="article-title"]')?.textContent?.trim() ||
                  document.querySelector('.c-article-title')?.textContent?.trim();
    
    const abstract = document.querySelector('[data-test="abstract-section"]')?.textContent?.trim() ||
                     document.querySelector('.c-article-section__content')?.textContent?.trim();
    
    const pdfLinks = findPDFLinks();
    
    return {
      site: 'nature',
      title: title,
      abstract: abstract,
      pdfUrls: pdfLinks,
      url: window.location.href,
      insertionPoint: document.querySelector('.c-article-header') || document.querySelector('.c-article-info-details')
    };
  }
  
  function detectScience() {
    if (!window.location.pathname.includes('/doi/')) return null;
    
    const title = document.querySelector('.article-title')?.textContent?.trim() ||
                  document.querySelector('h1.highwire-cite-title')?.textContent?.trim();
    
    const abstract = document.querySelector('.section.abstract')?.textContent?.trim();
    
    const pdfLinks = findPDFLinks();
    
    return {
      site: 'science',
      title: title,
      abstract: abstract,
      pdfUrls: pdfLinks,
      url: window.location.href,
      insertionPoint: document.querySelector('.article-header') || document.querySelector('.article-metadata')
    };
  }
  
  function detectCell() {
    if (!window.location.pathname.includes('/fulltext/')) return null;
    
    const title = document.querySelector('h1.article-header__title')?.textContent?.trim();
    const abstract = document.querySelector('.abstract-content')?.textContent?.trim();
    
    const pdfLinks = findPDFLinks();
    
    return {
      site: 'cell',
      title: title,
      abstract: abstract,
      pdfUrls: pdfLinks,
      url: window.location.href,
      insertionPoint: document.querySelector('.article-header') || document.querySelector('.article-info')
    };
  }
  
  function detectLancet() {
    if (!window.location.pathname.includes('/article/')) return null;
    
    const title = document.querySelector('h1')?.textContent?.trim();
    const abstract = document.querySelector('.summary')?.textContent?.trim() ||
                     document.querySelector('.abstract')?.textContent?.trim();
    
    const pdfLinks = findPDFLinks();
    
    return {
      site: 'lancet',
      title: title,
      abstract: abstract,
      pdfUrls: pdfLinks,
      url: window.location.href,
      insertionPoint: document.querySelector('.article-header') || document.querySelector('.article-info')
    };
  }
  
  function detectJAMA() {
    if (!window.location.pathname.includes('/article/')) return null;
    
    const title = document.querySelector('h1.meta-article-title')?.textContent?.trim();
    const abstract = document.querySelector('.abstract-content')?.textContent?.trim();
    
    const pdfLinks = findPDFLinks();
    
    return {
      site: 'jama',
      title: title,
      abstract: abstract,
      pdfUrls: pdfLinks,
      url: window.location.href,
      insertionPoint: document.querySelector('.article-header') || document.querySelector('.article-metadata')
    };
  }
  
  function detectNEJM() {
    if (!window.location.pathname.includes('/doi/')) return null;
    
    const title = document.querySelector('h1.article-title')?.textContent?.trim();
    const abstract = document.querySelector('.abstract-content')?.textContent?.trim();
    
    const pdfLinks = findPDFLinks();
    
    return {
      site: 'nejm',
      title: title,
      abstract: abstract,
      pdfUrls: pdfLinks,
      url: window.location.href,
      insertionPoint: document.querySelector('.article-header') || document.querySelector('.article-metadata')
    };
  }
  
  function detectPLOS() {
    if (!window.location.pathname.includes('/article/')) return null;
    
    const title = document.querySelector('h1#artTitle')?.textContent?.trim();
    const abstract = document.querySelector('.abstract')?.textContent?.trim();
    
    const pdfLinks = findPDFLinks();
    
    return {
      site: 'plos',
      title: title,
      abstract: abstract,
      pdfUrls: pdfLinks,
      url: window.location.href,
      insertionPoint: document.querySelector('.article-meta') || document.querySelector('.article-header')
    };
  }
  
  function detectBMJ() {
    if (!window.location.pathname.includes('/content/')) return null;
    
    const title = document.querySelector('h1.article-title')?.textContent?.trim();
    const abstract = document.querySelector('.abstract')?.textContent?.trim();
    
    const pdfLinks = findPDFLinks();
    
    return {
      site: 'bmj',
      title: title,
      abstract: abstract,
      pdfUrls: pdfLinks,
      url: window.location.href,
      insertionPoint: document.querySelector('.article-header') || document.querySelector('.article-metadata')
    };
  }
  
  function detectScienceDirect() {
    if (!window.location.pathname.includes('/article/')) return null;
    
    const title = document.querySelector('h1.title-text')?.textContent?.trim();
    const abstract = document.querySelector('.abstract')?.textContent?.trim();
    
    const pdfLinks = findPDFLinks();
    
    return {
      site: 'sciencedirect',
      title: title,
      abstract: abstract,
      pdfUrls: pdfLinks,
      url: window.location.href,
      insertionPoint: document.querySelector('.article-header') || document.querySelector('.article-info')
    };
  }
  
  function detectWiley() {
    if (!window.location.pathname.includes('/doi/')) return null;
    
    const title = document.querySelector('h1.citation__title')?.textContent?.trim();
    const abstract = document.querySelector('.article-section__content')?.textContent?.trim();
    
    const pdfLinks = findPDFLinks();
    
    return {
      site: 'wiley',
      title: title,
      abstract: abstract,
      pdfUrls: pdfLinks,
      url: window.location.href,
      insertionPoint: document.querySelector('.article-header') || document.querySelector('.citation')
    };
  }
  
  function detectSpringer() {
    if (!window.location.pathname.includes('/article/')) return null;
    
    const title = document.querySelector('h1.c-article-title')?.textContent?.trim();
    const abstract = document.querySelector('.c-article-section__content')?.textContent?.trim();
    
    const pdfLinks = findPDFLinks();
    
    return {
      site: 'springer',
      title: title,
      abstract: abstract,
      pdfUrls: pdfLinks,
      url: window.location.href,
      insertionPoint: document.querySelector('.c-article-header') || document.querySelector('.c-article-info')
    };
  }
  
  function detectGeneric() {
    // Generic detection for other scientific sites
    const title = document.querySelector('h1')?.textContent?.trim();
    const abstract = document.querySelector('.abstract, [class*="abstract"], [id*="abstract"]')?.textContent?.trim();
    
    if (!title && !abstract) return null;
    
    const pdfLinks = findPDFLinks();
    
    return {
      site: 'generic',
      title: title,
      abstract: abstract,
      pdfUrls: pdfLinks,
      url: window.location.href,
      insertionPoint: document.querySelector('main') || document.body
    };
  }
  
  // Utility functions
  function extractPMID() {
    const pmidMatch = window.location.href.match(/\/(\d+)\/?$/);
    return pmidMatch ? pmidMatch[1] : null;
  }
  
  function findPDFLinks() {
    const pdfSelectors = [
      'a[href*=".pdf"]',
      'a[href*="pdf"]',
      'a[title*="PDF"]',
      'a[aria-label*="PDF"]',
      '.pdf-link',
      '.download-pdf',
      '[data-track-action="PDF"]'
    ];
    
    const pdfLinks = [];
    
    pdfSelectors.forEach(selector => {
      const links = document.querySelectorAll(selector);
      links.forEach(link => {
        if (link.href && !pdfLinks.includes(link.href)) {
          pdfLinks.push(link.href);
        }
      });
    });
    
    return pdfLinks;
  }
  
  async function getSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
        resolve(response?.settings || {});
      });
    });
  }
  
  // Start the analysis process
  async function startAnalysis(siteInfo) {
    if (analysisInProgress || !settings.autoAnalyze) {
      return;
    }
    
    analysisInProgress = true;
    
    try {
      console.log('Q-SCI: Starting analysis for:', siteInfo.title);
      
      // Create and show the widget
      createQSCIWidget(siteInfo);
      showAnalysisProgress();
      
      // Prepare analysis data
      const analysisData = {
        url: siteInfo.url,
        title: siteInfo.title,
        text: siteInfo.abstract || siteInfo.snippet || '',
        pdfUrl: siteInfo.pdfUrls?.[0] || null
      };
      
      // Send analysis request
      const response = await sendAnalysisRequest(analysisData);
      
      if (response.success) {
        currentAnalysis = response.analysis;
        displayAnalysisResults(response.analysis, response.cached);
      } else {
        showAnalysisError(response.error);
      }
      
    } catch (error) {
      console.error('Q-SCI analysis error:', error);
      showAnalysisError(error.message);
    } finally {
      analysisInProgress = false;
    }
  }
  
  function sendAnalysisRequest(data) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: 'ANALYZE_PAPER',
        data: data
      }, resolve);
    });
  }
  
  // Widget creation and management
  function createQSCIWidget(siteInfo) {
    if (qsciWidget) {
      qsciWidget.remove();
    }
    
    qsciWidget = document.createElement('div');
    qsciWidget.id = 'qsci-widget';
    qsciWidget.className = 'qsci-widget';
    
    // Insert the widget
    if (siteInfo.insertionPoint) {
      siteInfo.insertionPoint.parentNode.insertBefore(qsciWidget, siteInfo.insertionPoint.nextSibling);
    } else {
      document.body.appendChild(qsciWidget);
    }
  }
  
  function showAnalysisProgress() {
    if (!qsciWidget) return;
    
    qsciWidget.innerHTML = `
      <div class="qsci-header">
        <div class="qsci-logo">
          <div class="qsci-logo-icon">Q-SCI</div>
          <span>Scientific Paper Quality Analysis</span>
        </div>
        <button class="qsci-close" onclick="this.closest('.qsci-widget').style.display='none'">×</button>
      </div>
      <div class="qsci-content">
        <div class="qsci-loading">
          <div class="qsci-spinner"></div>
          <p>Analyzing paper quality with AI...</p>
          <div class="qsci-progress">
            <div class="qsci-progress-bar"></div>
          </div>
        </div>
      </div>
    `;
  }
  
  function displayAnalysisResults(analysis, cached = false) {
    if (!qsciWidget || !analysis) return;
    
    const qualityColor = getQualityColor(analysis.overall_score);
    const qualityLabel = getQualityLabel(analysis.overall_score);
    
    qsciWidget.innerHTML = `
      <div class="qsci-header">
        <div class="qsci-logo">
          <div class="qsci-logo-icon">Q-SCI</div>
          <span>Scientific Paper Quality Analysis ${cached ? '(Cached)' : ''}</span>
        </div>
        <button class="qsci-close" onclick="this.closest('.qsci-widget').style.display='none'">×</button>
      </div>
      <div class="qsci-content">
        <div class="qsci-score-section">
          <div class="qsci-score-circle ${qualityColor}">
            <div class="qsci-score-value">${analysis.overall_score}%</div>
            <div class="qsci-score-label">${qualityLabel}</div>
          </div>
        </div>
        
        ${analysis.journal_info ? `
        <div class="qsci-journal-section">
          <h3>📊 Journal Information</h3>
          <div class="qsci-journal-info">
            <div class="qsci-journal-name">${analysis.journal_info.journal_name}</div>
            <div class="qsci-impact-factor">
              <span class="qsci-if-value">${analysis.journal_info.impact_factor}</span>
              <span class="qsci-if-label">Impact Factor</span>
            </div>
            <div class="qsci-quartile ${analysis.journal_info.quartile?.toLowerCase()}">${analysis.journal_info.quartile} ${analysis.journal_info.category}</div>
          </div>
        </div>
        ` : ''}
        
        <div class="qsci-aspects-section">
          <div class="qsci-positive-aspects">
            <h3>✅ Positive Aspects</h3>
            <ul>
              ${analysis.positive_aspects?.map(aspect => `
                <li class="qsci-aspect-item" data-source="${aspect.source_text || ''}">${aspect.aspect || aspect}</li>
              `).join('') || '<li>No specific positive aspects identified</li>'}
            </ul>
          </div>
          
          <div class="qsci-negative-aspects">
            <h3>⚠️ Areas for Improvement</h3>
            <ul>
              ${analysis.areas_for_improvement?.map(aspect => `
                <li class="qsci-aspect-item" data-source="${aspect.source_text || ''}">${aspect.aspect || aspect}</li>
              `).join('') || '<li>No specific areas for improvement identified</li>'}
            </ul>
          </div>
        </div>
        
        <div class="qsci-footer">
          <small>Analysis powered by Q-SCI AI • <a href="#" onclick="window.open('https://5000-ihmfmbky6vuzr7p1xzq48-64c33bd5.manusvm.computer', '_blank')">Learn More</a></small>
        </div>
      </div>
    `;
    
    // Add click handlers for source text display
    addSourceTextHandlers();
  }
  
  function showAnalysisError(error) {
    if (!qsciWidget) return;
    
    qsciWidget.innerHTML = `
      <div class="qsci-header">
        <div class="qsci-logo">
          <div class="qsci-logo-icon">Q-SCI</div>
          <span>Scientific Paper Quality Analysis</span>
        </div>
        <button class="qsci-close" onclick="this.closest('.qsci-widget').style.display='none'">×</button>
      </div>
      <div class="qsci-content">
        <div class="qsci-error">
          <div class="qsci-error-icon">⚠️</div>
          <h3>Analysis Failed</h3>
          <p>${error}</p>
          <button class="qsci-retry-btn" onclick="location.reload()">Retry</button>
        </div>
      </div>
    `;
  }
  
  function addSourceTextHandlers() {
    const aspectItems = qsciWidget.querySelectorAll('.qsci-aspect-item[data-source]');
    
    aspectItems.forEach(item => {
      const sourceText = item.getAttribute('data-source');
      if (sourceText && sourceText.trim()) {
        item.style.cursor = 'pointer';
        item.title = 'Click to see source text';
        
        item.addEventListener('click', () => {
          showSourceTextModal(item.textContent, sourceText);
        });
      }
    });
  }
  
  function showSourceTextModal(aspect, sourceText) {
    const modal = document.createElement('div');
    modal.className = 'qsci-modal';
    modal.innerHTML = `
      <div class="qsci-modal-content">
        <div class="qsci-modal-header">
          <h3>Source Text</h3>
          <button class="qsci-modal-close">×</button>
        </div>
        <div class="qsci-modal-body">
          <div class="qsci-aspect-text">
            <strong>Evaluation Point:</strong>
            <p>${aspect}</p>
          </div>
          <div class="qsci-source-text">
            <strong>Source Text:</strong>
            <p>${sourceText}</p>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal handlers
    modal.querySelector('.qsci-modal-close').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  // Utility functions for display
  function getQualityColor(score) {
    if (score >= 80) return 'green';
    if (score >= 50) return 'yellow';
    return 'red';
  }
  
  function getQualityLabel(score) {
    if (score >= 80) return 'High Quality';
    if (score >= 50) return 'Medium Quality';
    return 'Poor Quality';
  }
  
  console.log('Q-SCI Content Script initialized');
  
})();

