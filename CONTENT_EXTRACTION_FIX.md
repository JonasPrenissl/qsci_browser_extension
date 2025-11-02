# Content Extraction Improvements for The Lancet and Modern Journals

## Problem Statement

The Q-SCI browser extension was failing to extract content from The Lancet website (https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(25)01432-1/fulltext) and potentially other modern journal websites, returning a 0% quality score even for high-quality publications.

## Root Cause

Modern journal websites, including The Lancet, use:

1. **Dynamic Content Loading**: Content rendered via JavaScript frameworks (React, Vue, Angular)
2. **Modern HTML Patterns**: Data attributes (`data-component`, `data-testid`) instead of semantic classes
3. **Schema.org Markup**: Structured data using `itemprop` attributes
4. **Nested Component Structures**: Complex DOM hierarchies from modern web frameworks
5. **Delayed Rendering**: Content that appears after initial page load

## Solution Implemented

### 1. Enhanced Lancet-Specific Extraction

**Title Selectors (15 total)**:
- Added `[data-component="article-title"]` for component-based frameworks
- Added `[data-testid="article-title"]` for testing-friendly markup
- Added `h1[itemprop="headline"]` for Schema.org structured data
- Added `h1[itemprop="name"]` for alternative Schema.org markup
- Added `#article-title` for ID-based selectors

**Abstract/Summary Selectors (22 total)**:
- Added `[data-component="abstract"]` and `[data-component="summary"]`
- Added `[data-testid="abstract"]` and `[data-testid="summary"]`
- Added `section[id*="abstract"]` for dynamic ID patterns
- Added `[itemprop="abstract"]` and `[itemprop="description"]` for Schema.org
- Added ARIA region selectors for accessibility-compliant sites

**Content/Body Selectors (19 total)**:
- Added `[data-component="article-body"]` for component patterns
- Added `[data-testid="article-body"]` for test IDs
- Added `[itemprop="articleBody"]` for Schema.org
- Added `.fulltext-view` for full-text display modes
- Added `[data-component="fulltext"]` for framework components

**Improved Fallback Extraction**:
- Enhanced paragraph extraction to search in sections with data attributes
- Added filtering to exclude navigation, headers, and footers
- Better handling of nested content structures
- Support for div-based content when semantic elements aren't used

### 2. Enhanced Generic Extraction

Applied the same improvements to the generic extraction function for all supported journal websites:

**Additional Selectors Added**:
- Data-attribute patterns: `[data-component]`, `[data-testid]`
- Schema.org markup: `[itemprop="headline"]`, `[itemprop="abstract"]`, `[itemprop="articleBody"]`
- ID-based patterns: `#article-title`, `#abstract`, `#content`
- Section patterns: `section[id*="abstract"]`, `div[id*="abstract"]`

**Improved Fallback Chain**:
```javascript
// Priority order for content extraction:
1. Specific selectors (data-component, data-testid)
2. Semantic classes (article-body, abstract)
3. Schema.org markup (itemprop attributes)
4. Generic containers (article, main, [role="main"])
5. Paragraph extraction with filtering
6. Last resort: all body paragraphs (filtered)
```

### 3. Dynamic Content Support

**Automatic Detection**:
The extension now detects dynamic content frameworks:
```javascript
const hasDynamicContent = document.querySelector(
  '[data-react-root], [data-reactroot], #root, #app, [ng-app], [data-vue-app]'
) !== null;
```

**Adaptive Delays**:
- Regular pages: 2000ms (increased from 1000ms)
- PDF pages: 3000ms
- Dynamic content pages: 2500ms

This gives JavaScript frameworks time to render content before extraction.

### 4. Better Content Quality

**Smart Filtering**:
Paragraph extraction now skips:
- Navigation elements (`nav`)
- Headers (`header`)
- Footers (`footer`)
- Sidebars (`aside`)
- Short paragraphs (< 50 characters)

**Comprehensive Container Search**:
```javascript
const articleContainers = document.querySelectorAll(
  'article, main, [role="main"], ' +
  '.article, .paper, ' +
  '[data-component*="article"], ' +
  '[data-component*="content"], ' +
  '[itemprop="articleBody"], ' +
  'section[id*="section"], ' +
  'div[class*="article"]'
);
```

## Testing

### Manual Testing Steps

1. **Build the Extension**:
   ```bash
   npm install
   npm run build
   ```

2. **Load in Chrome**:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension directory

3. **Test on The Lancet**:
   - Visit: https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(25)01432-1/fulltext
   - Click the Q-SCI extension icon
   - Click "Analyze Current Page"
   - Verify that content is extracted and analyzed

4. **Test on Other Journals**:
   - Nature: https://www.nature.com/articles/...
   - Science: https://www.science.org/doi/...
   - PubMed: https://pubmed.ncbi.nlm.nih.gov/...
   - BMJ: https://www.bmj.com/content/...

### Automated Testing

A test HTML page is included: `test-lancet-extraction.html`

To use it:
1. Open the file in Chrome with the extension loaded
2. The page will automatically test 4 different HTML structures:
   - Modern structure with data attributes
   - Classic structure with semantic classes
   - Nested structure with mixed selectors
   - Minimal structure (paragraph-based)
3. Review the test results to ensure all patterns are detected

### Debugging

Open the browser console (F12) when testing to see detailed extraction logs:
- Which selectors matched
- How much content was extracted
- Which extraction strategy succeeded

Example console output:
```
Q-SCI Content Script: Using Lancet-specific extraction
Q-SCI Content Script: Found Lancet title with selector: [data-component="article-title"]
Q-SCI Content Script: Found Lancet abstract with selector: [data-testid="abstract"]
Q-SCI Content Script: Found Lancet content with selector: [itemprop="articleBody"]
Q-SCI Content Script: Page data extracted successfully
```

## Compatibility

The changes are backward compatible:
- Existing selector patterns are preserved
- New patterns are added to the end of the priority list
- Fallback mechanisms ensure content is extracted even on older sites

## Performance Impact

Minimal:
- Increased delay adds 1-1.5 seconds to extraction time
- Additional selectors have negligible performance impact
- The extension still uses efficient DOM queries (querySelector, not XPath)

## Future Improvements

Potential enhancements for even better extraction:

1. **Machine Learning**: Use ML to identify article content vs. navigation
2. **Site-Specific Adapters**: Create specialized extractors for major publishers
3. **Shadow DOM Support**: Handle web components with shadow DOM
4. **Iframe Content**: Extract content from iframes when permitted
5. **Reader Mode**: Integrate browser reader mode APIs for cleaner content

## Supported Websites

The improvements benefit all supported journal websites:
- PubMed / PMC
- arXiv
- The Lancet ✨ (specifically improved)
- Nature
- Science
- Cell
- JAMA Network
- NEJM
- BMJ
- PLOS
- Springer
- Wiley
- And many more...

## Support

If content extraction still fails on a specific website:

1. Check browser console for error messages
2. Verify the page has readable content (not behind a paywall)
3. Try waiting a few seconds for content to load, then retry
4. Report the issue with:
   - The specific URL
   - Browser console logs
   - Page structure (right-click → Inspect → Elements)
