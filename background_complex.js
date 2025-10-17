// Q-SCI Browser Extension - Background Service Worker
// Handles extension lifecycle, API communication, and cross-tab coordination

// Default: production site – change to your deployed website
let QSCI_API_BASE = 'https://your-domain.com';

// Try to read a configured override from chrome.storage.sync (useful for local development)
try {
  if (chrome && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(['QSCI_API_BASE'], (res) => {
      if (res && res.QSCI_API_BASE) {
        QSCI_API_BASE = res.QSCI_API_BASE;
        console.log('Q-SCI: using configured API base', QSCI_API_BASE);
      }
    });
  }
} catch (e) {
  console.warn('Q-SCI: chrome.storage not available, using default API base', QSCI_API_BASE);
}

// Example usage:
// fetch(`${QSCI_API_BASE}/api/extension?action=login-url`)

// Extension installation and update handling
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Q-SCI Extension installed/updated:', details.reason);
  
  // Set default settings
  chrome.storage.sync.set({
    autoAnalyze: true,
    showNotifications: true,
    analysisDelay: 2000, // 2 seconds delay before auto-analysis
    enabledSites: {
      pubmed: true,
      arxiv: true,
      scholar: true,
      nature: true,
      science: true,
      cell: true,
      lancet: true,
      jama: true,
      nejm: true,
      plos: true,
      bmj: true
    }
  });
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request.type);
  
  switch (request.type) {
    case 'ANALYZE_PAPER':
      handlePaperAnalysis(request.data, sendResponse);
      return true; // Keep message channel open for async response
      
    case 'GET_SETTINGS':
      chrome.storage.sync.get(null, (settings) => {
        sendResponse({ success: true, settings });
      });
      return true;
      
    case 'UPDATE_SETTINGS':
      chrome.storage.sync.set(request.settings, () => {
        sendResponse({ success: true });
      });
      return true;
      
    case 'GET_ANALYSIS_CACHE':
      getAnalysisFromCache(request.url, sendResponse);
      return true;
      
    case 'STORE_ANALYSIS_CACHE':
      storeAnalysisInCache(request.url, request.analysis, sendResponse);
      return true;
      
    default:
      console.warn('Unknown message type:', request.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

// Handle paper analysis requests
async function handlePaperAnalysis(data, sendResponse) {
  try {
    console.log('Q-SCI Background: Starting paper analysis for:', data.url || 'text content');
    console.log('Q-SCI Background: Analysis data:', {
      hasTitle: !!data.title,
      hasText: !!data.text,
      textLength: data.text ? data.text.length : 0,
      hasPdfUrl: !!data.pdfUrl
    });
    
    // Check cache first
    const cacheKey = data.url || data.text?.substring(0, 100);
    const cachedResult = await getCachedAnalysis(cacheKey);
    if (cachedResult) {
      console.log('Q-SCI Background: Returning cached analysis');
      sendResponse({ success: true, analysis: cachedResult, cached: true });
      return;
    }
    
    // Validate input data
    if (!data.text || data.text.trim().length < 50) {
      throw new Error('Insufficient text content for analysis. Please ensure you are on a paper details page with abstract or content.');
    }
    
    // Prepare analysis request
    const analysisRequest = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        text: data.text.trim(),
        pdf_url: data.pdfUrl || null,
        source_url: data.url || '',
        title: data.title || 'Unknown Title'
      })
    };
    
    console.log('Q-SCI Background: Sending request to API');
    
    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 30000); // 30 second timeout
    
    try {
      // Send to Q-SCI API with timeout
      const response = await fetch(`${QSCI_API_BASE}/api/evaluate`, {
        ...analysisRequest,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('Q-SCI Background: API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Q-SCI Background: API error response:', errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Q-SCI Background: API result received:', {
        success: result.success,
        hasResult: !!result.result,
        score: result.result?.quality_percentage || result.result?.score
      });
      
      if (result.success && result.result) {
        // Normalize the result format
        const normalizedResult = {
          score: result.result.quality_percentage || result.result.score || 0,
          quality_percentage: result.result.quality_percentage || result.result.score || 0,
          traffic_light: result.result.traffic_light || 'Unknown',
          positive_aspects: result.result.positive_aspects || [],
          negative_aspects: result.result.negative_aspects || [],
          areas_for_improvement: result.result.areas_for_improvement || result.result.negative_aspects || [],
          journal_info: result.result.journal_info || {}
        };
        
        // Cache the result
        if (cacheKey) {
          await cacheAnalysis(cacheKey, normalizedResult);
        }
        
        console.log('Q-SCI Background: Analysis completed successfully');
        sendResponse({ 
          success: true, 
          analysis: normalizedResult,
          cached: false 
        });
      } else {
        throw new Error(result.error || 'Analysis failed - invalid response format');
      }
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Analysis timed out after 30 seconds. Please try again with a shorter text or check your connection.');
      } else {
        throw fetchError;
      }
    }
    
  } catch (error) {
    console.error('Q-SCI Background: Analysis error:', error);
    sendResponse({ 
      success: false, 
      error: error.message || 'Analysis failed - please try again'
    });
  }
}

// Cache management functions
async function getCachedAnalysis(url) {
  if (!url) return null;
  
  return new Promise((resolve) => {
    const cacheKey = `analysis_${hashUrl(url)}`;
    chrome.storage.local.get([cacheKey], (result) => {
      const cached = result[cacheKey];
      if (cached && cached.timestamp > Date.now() - (24 * 60 * 60 * 1000)) { // 24 hours
        resolve(cached.analysis);
      } else {
        resolve(null);
      }
    });
  });
}

async function cacheAnalysis(url, analysis) {
  if (!url) return;
  
  const cacheKey = `analysis_${hashUrl(url)}`;
  const cacheData = {
    analysis: analysis,
    timestamp: Date.now(),
    url: url
  };
  
  chrome.storage.local.set({ [cacheKey]: cacheData });
}

function getAnalysisFromCache(url, sendResponse) {
  getCachedAnalysis(url).then(analysis => {
    sendResponse({ success: true, analysis });
  });
}

function storeAnalysisInCache(url, analysis, sendResponse) {
  cacheAnalysis(url, analysis).then(() => {
    sendResponse({ success: true });
  });
}

// Utility function to hash URLs for cache keys
function hashUrl(url) {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// Handle tab updates to trigger analysis on supported sites
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if this is a supported scientific site
    const supportedSites = [
      'pubmed.ncbi.nlm.nih.gov',
      'arxiv.org',
      'scholar.google.com',
      'nature.com',
      'science.org',
      'cell.com',
      'thelancet.com',
      'jamanetwork.com',
      'nejm.org',
      'journals.plos.org',
      'bmj.com'
    ];
    
    const isSupportedSite = supportedSites.some(site => tab.url.includes(site));
    
    if (isSupportedSite) {
      // Inject content script if not already present
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content-script.js']
      }).catch(() => {
        // Script might already be injected, ignore error
      });
    }
  }
});

// Clean up old cache entries periodically
chrome.alarms.create('cleanCache', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanCache') {
    cleanOldCacheEntries();
  }
});

function cleanOldCacheEntries() {
  chrome.storage.local.get(null, (items) => {
    const keysToRemove = [];
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
    
    for (const [key, value] of Object.entries(items)) {
      if (key.startsWith('analysis_') && value.timestamp < cutoffTime) {
        keysToRemove.push(key);
      }
    }
    
    if (keysToRemove.length > 0) {
      chrome.storage.local.remove(keysToRemove);
      console.log(`Cleaned ${keysToRemove.length} old cache entries`);
    }
  });
}

console.log('Q-SCI Background Service Worker initialized');

