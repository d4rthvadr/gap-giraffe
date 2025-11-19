# Gap Giraffe 🦒

A Chrome browser extension that helps job seekers optimize their resumes by analyzing job postings using AI.

## 🎯 Project Goal

Automatically analyze job descriptions and help applicants tailor their resumes for better matches. The extension will:
- Extract job requirements from any job posting page
- Compare job requirements with your resume
- Use AI (Gemini Flash) to suggest resume optimizations
- Track resume versions for different jobs
- Monitor application status over time

## 📊 Current Status: Stage 1 Complete ✅

**What's Working:**
- ✅ Chrome extension structure (Manifest V3)
- ✅ TypeScript codebase with full type safety
- ✅ Manual job analysis trigger via popup
- ✅ Intelligent job scraping (title, company, description)
- ✅ Confidence scoring for extracted data
- ✅ Modern UI with animations

**What's Coming:**
- ⏳ **Stage 2**: SQLite database + Resume management
- ⏳ **Stage 3**: AI model integration (Gemini Flash)
- ⏳ **Stage 4**: Resume optimization & versioning
- ⏳ **Stage 5**: Application tracking dashboard

## 🚀 Quick Start

### Prerequisites
- Node.js installed
- Google Chrome browser

### Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:d4rthvadr/gap-giraffe.git
   cd gap-giraffe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build TypeScript**
   ```bash
   npm run build
   ```

4. **Load extension in Chrome**
   - Open Chrome → `chrome://extensions/`
   - Enable "Developer mode" (top-right toggle)
   - Click "Load unpacked"
   - Select the `extension` folder from this project

### Usage

1. Navigate to any job posting (LinkedIn, Indeed, etc.)
2. Click the Gap Giraffe extension icon
3. Click "Analyze This Job" button
4. Extension extracts job details and shows analysis

## 🛠️ Development

### Tech Stack
- **TypeScript** - Type-safe development
- **Chrome Extension API** - Manifest V3
- **Gemini Flash AI** - Resume optimization (coming in Stage 3)
- **SQLite** - Local storage (coming in Stage 2)

### Project Structure
```
gap-giraffe/
├── src/                    # TypeScript source files
│   ├── types/             # Type definitions
│   ├── background.ts      # Service worker
│   ├── popup/             # Popup logic
│   └── content/           # Job scraping
├── extension/             # Extension files (load in Chrome)
│   ├── dist/             # Compiled JS (auto-generated)
│   ├── popup/            # HTML & CSS
│   ├── icons/            # Extension icons
│   └── manifest.json     # Extension config
├── package.json
└── tsconfig.json
```

### Development Workflow

**Edit code:**
```bash
# Watch mode - auto-rebuilds on save
npm run watch

# One-time build
npm run build
```

**Test changes:**
1. Make changes in `src/` TypeScript files
2. Build compiles to `extension/dist/`
3. Reload extension in Chrome (`chrome://extensions/`)
4. Test on job posting pages

### Available Scripts
- `npm run build` - Compile TypeScript once
- `npm run watch` - Watch mode (auto-rebuild)
- `npm run clean` - Remove compiled files

## 🏗️ Development Stages

### ✅ Stage 1: Foundation (Complete)
- Chrome extension structure
- TypeScript setup
- Job scraping with heuristics
- Manual trigger workflow

### 🔄 Stage 2: Data Layer (In Progress)
- SQLite database integration
- Resume upload & storage
- Job data persistence
- Version management foundation

### 📅 Stage 3: AI Integration
- Gemini Flash API connection
- Resume analysis
- Match scoring
- Optimization suggestions

### 📅 Stage 4: Resume Optimization
- Apply AI suggestions
- Create resume versions per job
- Certainty scoring
- Diff visualization

### 📅 Stage 5: Application Tracking
- Status tracking (Applied, Interview, Offer, etc.)
- Timeline view
- Analytics dashboard
- Notes and reminders

## 🎨 Features

### Job Analysis
- Extracts job title, company, and full description
- Works on any job site (LinkedIn, Indeed, company sites)
- Confidence scoring for extraction quality
- Visual feedback on job pages

### Smart Scraping
Multiple extraction strategies:
- Meta tags and structured data
- Common HTML patterns
- Heuristic-based content detection
- Fallback to largest text blocks

### Type Safety
- Full TypeScript coverage
- Strict null checks
- Chrome API types
- Compile-time error detection

## 📝 License

MIT

## 🤝 Contributing

This is currently a personal project in active development. Feel free to open issues for bugs or suggestions!

---

**Current Version:** 1.0.0 (Stage 1)  
**Last Updated:** November 19, 2025
