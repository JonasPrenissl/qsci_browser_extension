# Content Extraction Fix: Full Article Text for Quality Analysis

## Problem Identified

The Q-SCI browser extension is currently extracting only the **abstract/summary** section from The Lancet and similar journal websites, resulting in incomplete quality analysis. When users click "Analyze", the extension returns:
- 0% quality score
- Error: "The provided text does not contain any substantive content from the study"

## Root Cause

In `content-script.js`, the `extractLancetData()` function extracts:
1. Title
2. Abstract/Summary section
3. Limited full text from `section.article-body`

However, the current logic combines these with:
```javascript
let analysisText = abstract || fullText || title;
if (abstract && fullText && fullText !== abstract) {
  analysisText = abstract + '\n\n' + fullText.substring(0, MAX_FULLTEXT_LENGTH); // Limit full text to 2000 chars
}
```

The issue: `MAX_FULLTEXT_LENGTH = 2000` severely limits the content sent for analysis, cutting off critical sections like Methods, Results, Discussion, etc.

## Solution Strategy

Modify the extraction logic to:

1. **Remove the 2000 character limit** on full text extraction
2. **Prioritize full article content** over just the abstract
3. **Extract from broader containers** that include all article sections
4. **Apply intelligent content filtering** to remove navigation/ads while keeping all scientific content

## Implementation Plan

### Changes to `extractLancetData()` function:

1. **Increase content extraction limit**: Change `MAX_FULLTEXT_LENGTH` to a much higher value (50,000+ characters) or remove the limit entirely for full articles

2. **Improve selector priority**: Extract from containers that include the entire article:
   - `main` element (contains full article)
   - `article` element
   - All `section` elements within the article body

3. **Better content combination logic**: Instead of limiting to 2000 chars, send the complete article text for analysis

4. **Apply the same fix to other journal extractors**: PMC, PubMed, arXiv, and generic extraction functions

## Expected Outcome

After the fix:
- Extension will extract complete article text including Methods, Results, Discussion, Conclusions
- Quality analysis will have access to study design details, sample sizes, statistical methods, etc.
- Users will receive accurate quality scores based on the full publication content
