# Job Resume Optimizer - Chrome Extension

## Stage 1: Basic Extension Setup ✓

A Chrome browser extension that helps job seekers optimize their resumes by analyzing job postings using AI.

## Current Features (Stage 1)

✅ **Basic Chrome Extension Structure**
- Manifest V3 configuration
- Background service worker
- Browser action popup with modern UI
- Content script injection system

✅ **Job Analysis Trigger**
- Manual trigger via popup "Analyze This Job" button
- Current page URL detection
- Loading states and user feedback

✅ **Generic Job Scraping**
- Intelligent heuristic-based extraction
- Multi-strategy approach for job title, company, and description
- Confidence scoring for each extracted field
- Visual feedback on job posting pages

## Installation Instructions

### Load Extension in Chrome (Developer Mode)

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Or: Menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle "Developer mode" switch in top-right corner

3. **Load Unpacked Extension**
   - Click "Load unpacked" button
   - Navigate to: `/Users/mac/Documents/Ghost rider/frontend masters/job-tracker/extension`
   - Click "Select"

4. **Verify Installation**
   - Extension should appear in extensions list
   - Pin the extension icon to toolbar (optional but recommended)

### Test the Extension

1. **Navigate to Any Job Posting**
   - Open LinkedIn, Indeed, or any job posting page
   - Example: https://www.linkedin.com/jobs/

2. **Click Extension Icon**
   - Look for the purple gradient icon in toolbar
   - Popup window should appear showing current URL

3. **Click "Analyze This Job"**
   - Button triggers content script injection
   - Watch for notification on page: "🔍 Analyzing job posting..."
   - Should see success notification after extraction

4. **Check Console**
   - Open DevTools (F12 or Cmd+Option+I)
   - Check Console tab for extraction logs
   - Verify job title, company, and description extracted

## File Structure

```
extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker
├── popup/
│   ├── popup.html        # Popup UI
│   ├── popup.css         # Popup styles
│   └── popup.js          # Popup logic
├── content/
│   └── content.js        # Job extraction script
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## What Works Now

- ✅ Extension loads in Chrome
- ✅ Popup displays with current page URL
- ✅ "Analyze This Job" button triggers content script injection
- ✅ Content script extracts job details using heuristics
- ✅ Visual feedback on job pages (notifications)
- ✅ Console logging for debugging

## What's Next (Upcoming Stages)

- ⏳ SQLite database integration for storage
- ⏳ Resume upload and parsing
- ⏳ AI model integration (Gemini Flash)
- ⏳ Resume optimization suggestions
- ⏳ Version management
- ⏳ Application tracking

## Debugging

**View Background Service Worker Console:**
- Go to `chrome://extensions/`
- Click "Service worker" link under extension
- Background script logs appear here

**View Content Script Console:**
- Open any job page
- Press F12 (or Cmd+Option+I)
- Console tab shows content script logs

**View Popup Console:**
- Open popup by clicking extension icon
- Right-click inside popup → "Inspect"
- DevTools opens for popup window

## Known Limitations (Stage 1)

- Mock results displayed (85% match, 92% certainty)
- No actual AI analysis yet
- No database storage
- No resume management
- Settings page not implemented yet

---

**Status:** Stage 1 Complete - Ready for Review ✓
