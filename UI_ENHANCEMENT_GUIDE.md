# Q-SCI UI Enhancement Visual Guide

## New UI Components Overview

### 1. Enhanced Reasoning Section (Already exists, now longer)
```
┌─────────────────────────────────────────────────────┐
│ Begründung: (Reasoning)                             │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [2-3 detailed paragraphs explaining the quality │ │
│ │  score comprehensively]                         │ │
│ │                                                 │ │
│ │ Paragraph 1: Overview of strengths...          │ │
│ │ Paragraph 2: Discussion of limitations...      │ │
│ │ Paragraph 3: Overall quality conclusion...     │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 2. Journal Information with Impact Factor (New)
```
┌─────────────────────────────────────────────────────┐
│ Detaillierte Analyse                                │
│                                                     │
│ Journal: Nature                                     │
│ Impact Factor: 49.962                      [NEW!]   │
│ Qualität: 85%                                       │
│ Ampel: 🟢 Green                                     │
└─────────────────────────────────────────────────────┘
```

### 3. Aspect with Explanation (New)
```
┌─────────────────────────────────────────────────────┐
│ ✅ Positive Aspekte                                 │
│                                                     │
│ • The study uses a randomized controlled design 👁️ │  [Clickable]
│                                                     │
│ [When clicked, below appears:]                      │
│                                                     │
│ Quelle (Source)                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ "Participants were randomly assigned to..."     │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Erklärung: (Explanation)                  [NEW!]   │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Randomization minimizes selection bias and      │ │
│ │ allows for causal inference. This strengthens   │ │
│ │ the validity of the study's conclusions.        │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 4. Q&A Chat Interface (New)
```
┌─────────────────────────────────────────────────────┐
│ Fragen zur Publikation                              │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Chat Messages]                                 │ │
│ │                                                 │ │
│ │ ┌─────────────────────────────────────────────┐ │ │
│ │ │ Stellen Sie Fragen zur Publikation...       │ │ │
│ │ └─────────────────────────────────────────────┘ │ │
│ │                                                 │ │
│ │ ┌─────────────────────────────────────────────┐ │ │
│ │ │ Sie: What was the sample size?            │ │ │
│ │ └─────────────────────────────────────────────┘ │ │
│ │                                                 │ │
│ │ ┌─────────────────────────────────────────────┐ │ │
│ │ │ Q-SCI: The study included 150 participants  │ │ │
│ │ │ randomly assigned to treatment groups...    │ │ │
│ │ └─────────────────────────────────────────────┘ │ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌──────────────────────────────┬────────────────┐  │
│ │ Frage eingeben...            │  [Senden]      │  │
│ └──────────────────────────────┴────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Color Scheme

### Message Types in Chat:
- **User Messages**: Purple/Indigo background (#e0e7ff) with dark purple text (#3730a3)
- **AI Responses**: Light blue background (#f0f9ff) with dark blue text (#0c4a6e)
- **Error Messages**: Light red background (#fee2e2) with dark red text (#991b1b)

### Other UI Elements:
- **Explanation Section**: Light blue background (#f0f9ff) with blue border (#3b82f6)
- **Reasoning Section**: Light purple background (#f8fafc) with purple border (#667eea)

## User Interaction Flow

### Analyzing a Paper with New Features:

1. **User clicks "Paper analysieren"**
   → Loading indicator shows "Analysiere..."

2. **Analysis completes**
   → Quality score displays (with colored background)
   → **NEW**: 2-3 paragraph reasoning appears automatically
   → Detailed analysis section opens

3. **In detailed section, user sees:**
   → Journal name and **NEW** impact factor
   → Positive aspects (clickable with 👁️ icon)
   → Negative aspects (clickable with 👁️ icon)

4. **User clicks on an aspect**
   → Source citation appears (in quotes, italic)
   → **NEW**: Explanation appears below in blue box

5. **User scrolls to chat section**
   → **NEW**: Can type questions about the publication
   → AI responds with contextual answers
   → Can ask follow-up questions
   → Chat maintains conversation context

## Technical Notes

### Responsive Design:
- Chat messages scroll independently
- Custom scrollbar for better UX
- Input field expands to fill available space
- All elements scale with popup width (400px)

### Accessibility:
- Proper focus states on input fields
- Clear visual hierarchy
- High contrast text
- Semantic HTML structure

### Performance:
- Chat history limited to 10 messages (5 exchanges)
- Lazy loading of paper context
- Efficient DOM manipulation
- Debounced API calls

## Example Complete Analysis View

```
╔═════════════════════════════════════════════════════╗
║ Q-SCI: Qualitätsprüfung                            ║
║ für wissenschaftliche Publikationen                 ║
╠═════════════════════════════════════════════════════╣
║                                                     ║
║ Analyseergebnisse                                   ║
║ ┌─────────────────────┐                            ║
║ │     85%             │                            ║
║ │   Qualität          │                            ║
║ └─────────────────────┘                            ║
║                                                     ║
║ Begründung:                                         ║
║ [2-3 detailed paragraphs...]                        ║
║                                                     ║
║ ─────────────────────────────────────────────────── ║
║                                                     ║
║ Detaillierte Analyse                                ║
║                                                     ║
║ Journal: Nature                                     ║
║ Impact Factor: 49.962                               ║
║ Qualität: 85%                                       ║
║ Ampel: 🟢 Green                                     ║
║                                                     ║
║ ✅ Positive Aspekte                                 ║
║ • Randomized controlled design 👁️                  ║
║ • Large sample size (n=500) 👁️                     ║
║ • Pre-registered protocol 👁️                       ║
║                                                     ║
║ ⚠️ Verbesserungsbereiche                           ║
║ • Short follow-up period 👁️                        ║
║ • Single-center study 👁️                           ║
║                                                     ║
║ [Source & Explanation sections appear when          ║
║  user clicks on aspects]                            ║
║                                                     ║
║ ─────────────────────────────────────────────────── ║
║                                                     ║
║ Fragen zur Publikation                              ║
║ [Chat interface with conversation history]          ║
║                                                     ║
╚═════════════════════════════════════════════════════╝
```

## Summary

The Q-SCI extension now provides:
1. **More comprehensive reasoning** for quality scores
2. **Contextual explanations** for why each finding matters
3. **Journal metrics** to assess publication venue quality
4. **Interactive Q&A** for deeper exploration of the paper

All features are seamlessly integrated into the existing UI with consistent styling and full localization support.
