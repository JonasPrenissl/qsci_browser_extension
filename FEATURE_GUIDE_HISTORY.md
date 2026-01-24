# Analysis History & Offline Chat - Feature Guide

## 📚 What's New?

You can now **revisit past analyses** and **use the chat feature offline**! This means you can:
- View any paper you've previously analyzed without analyzing it again
- Ask questions about papers even when you're not on the publication website
- Build a library of analyzed papers for easy reference

## 🎯 Key Features

### 1. Automatic History Saving
Every time you analyze a paper, it's automatically saved to your history (up to 50 papers).

### 2. Browse Your Analysis History
Click "📚 View Analysis History" to see all papers you've analyzed, showing:
- Paper title
- Date and time of analysis
- Quality score (percentage)
- Traffic light rating (green/yellow/red)
- Original URL

### 3. Load Historical Analyses
Click "View" on any history item to:
- See the full analysis again
- View all positive and negative aspects
- Read the quality reasoning
- Download the PDF (if available)

### 4. Offline Chat
The best part! When you load a historical analysis, you can:
- Ask questions about the paper
- Get AI-powered answers based on the paper content
- All without being on the original publication page!

### 5. Easy Navigation
When viewing a historical analysis:
- A yellow banner shows you it's from history
- Click "← Return to Current Page" to go back to recent analysis
- Delete old analyses you no longer need

## 📖 How to Use

### Analyzing a New Paper
1. Navigate to a scientific publication
2. Click the Q-SCI extension icon
3. Click "Analyze Paper"
4. The analysis is saved automatically to your history

### Viewing Your History
1. Click the Q-SCI extension icon
2. Click "📚 View Analysis History"
3. Browse your past analyses
4. Click "View" to load any analysis
5. Click "Delete" to remove unwanted entries

### Using Chat with Historical Papers
1. Load a historical analysis (or use current analysis)
2. Scroll to "Questions about the Publication"
3. Type your question (e.g., "What was the sample size?")
4. Get instant AI-powered answers based on the paper

### Returning to Current Analysis
1. When viewing history, click "Close" to return
2. When viewing a historical analysis, click "← Return to Current Page"

## 💡 Use Cases

### Research Organization
"I analyzed 10 papers last week. Now I can quickly compare them without re-analyzing!"

### Follow-up Questions
"I analyzed this paper yesterday. Today I have more questions, and I can still ask them!"

### Quota Management (Free Users)
"I'm on the free plan (10 analyses/day). By revisiting history, I don't waste my quota!"

### Literature Review
"I'm writing a paper and need to reference multiple studies I analyzed. They're all in my history!"

## 🔒 Privacy & Storage

### What's Stored Locally
- Analysis results (quality scores, aspects, reasoning)
- Paper metadata (title, URL, timestamp)
- Paper text content (for offline chat)

### What's NOT Stored
- Your login credentials
- API keys
- Payment information
- Any personal data

### Storage Limits
- Maximum 50 analyses
- Oldest analyses automatically removed when limit reached
- Total storage: ~500 KB to 2.5 MB (very small)

### Data Location
- All data stored locally in your browser
- Not synced to cloud
- Private to your browser only

## ⚙️ Technical Details

### Storage Keys
- `qsci_current_analysis`: Most recent analysis
- `qsci_analysis_history`: Array of up to 50 historical analyses

### Data Structure
Each history entry contains:
```
{
  "id": unique_timestamp,
  "timestamp": "2026-01-24T15:30:00.000Z",
  "analysis": { quality, aspects, reasoning, etc. },
  "paperContext": { title, text, url },
  "pageUrl": "original_publication_url",
  "pageTitle": "original_tab_title"
}
```

## 🌐 Language Support

All new features are available in:
- 🇩🇪 German (Deutsch)
- 🇬🇧 English

Switch language using the dropdown in the extension popup.

## 🐛 Troubleshooting

### History not showing?
- Make sure you've analyzed at least one paper
- Try clicking "Refresh" to reload
- Check that you're logged in

### Chat not working with historical analysis?
- Verify the paper has paper context saved
- If paper was analyzed before this update, chat may be limited
- Try re-analyzing the paper to get full chat support

### Can't delete a history item?
- Make sure you're logged in
- Try refreshing the history view
- Report persistent issues

## 🎉 Benefits Summary

✅ **Save Time**: No need to re-analyze papers  
✅ **Save Quota**: Free users can reference past analyses  
✅ **Offline Research**: Ask questions anytime, anywhere  
✅ **Better Organization**: All analyses in one place  
✅ **Easy Comparison**: Quickly switch between papers  
✅ **Privacy Protected**: All data stays in your browser  

## 🚀 Future Enhancements

Potential future features (not yet implemented):
- Search and filter in history
- Export history to CSV/JSON
- Sort by date, quality, or journal
- Sync across devices
- Categories and tags
- Share analyses

## 📞 Support

If you encounter issues or have questions:
1. Check this guide first
2. Try the troubleshooting section
3. Contact support at www.q-sci.org
4. Report bugs on GitHub

---

**Enjoy your new analysis history and offline chat features!**

*Last updated: January 24, 2026*
