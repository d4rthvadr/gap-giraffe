# Gap Giraffe 🦒

A Chrome browser extension that helps job seekers optimize their resumes using AI-powered analysis.

## 🎯 Goal

Automatically analyze job descriptions and help applicants tailor their resumes for better matches by:
- Extracting job requirements from any posting
- Comparing requirements with your resume
- Generating AI-powered optimization suggestions
- Tracking resume versions for different jobs
- Managing application status over time

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Google Chrome browser
- npm or yarn

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

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top-right toggle)
   - Click "Load unpacked"
   - Select the `extension` folder

### Usage

1. Navigate to any job posting (LinkedIn, Indeed, etc.)
2. Click the Gap Giraffe extension icon
3. Click "Analyze This Job" button
4. View job analysis and match score

## 📁 Project Structure

```
gap-giraffe/
├── src/                      # TypeScript source files
│   ├── background.ts        # Service worker (orchestration)
│   ├── popup/              # Extension popup UI
│   │   └── popup.ts
│   ├── content/            # Job scraping scripts
│   │   └── content.ts
│   ├── db/                 # Database layer
│   │   ├── storage-adapter.ts    # Abstract interface
│   │   ├── indexeddb-adapter.ts  # IndexedDB implementation
│   │   ├── database.ts           # Database manager
│   │   └── types.ts              # Database types
│   └── types/              # Shared TypeScript types
│       └── index.ts
├── extension/              # Extension files (load in Chrome)
│   ├── manifest.json      # Extension configuration
│   ├── dist/             # Compiled JavaScript (auto-generated)
│   ├── popup/
│   │   ├── popup.html
│   │   └── popup.css
│   └── icons/
├── docs/                  # Documentation
│   └── roadmap.md        # Development roadmap
├── build.js              # esbuild bundler configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## 🛠️ Development Commands

```bash
# Build once
npm run build

# Watch mode (auto-rebuild on changes)
npm run watch

# Clean build artifacts
npm run clean
```

## ✨ Features

### Current (Stage 2 Complete)

✅ **Job Analysis**
- Intelligent job scraping from any website
- Extracts title, company, and description
- Confidence scoring for extraction quality
- Visual feedback on job pages

✅ **Data Management**
- IndexedDB storage (native browser)
- Job history tracking
- Duplicate detection
- Storage adapter pattern (easy to switch backends)

✅ **User Interface**
- Modern popup with gradient design
- Loading states and error handling
- Responsive layout
- Settings and tracker navigation

### Coming Soon (Stage 3+)

⏳ **AI Integration**
- Gemini Flash 1.5 for analysis
- Resume vs job gap analysis
- Match scoring
- Optimization suggestions

⏳ **Resume Management**
- Upload and parse resumes (PDF, TXT, DOCX)
- Create job-specific versions
- Version comparison
- Download optimized resumes

⏳ **Application Tracking**
- Status tracking (Applied, Interview, Offer, etc.)
- Timeline view
- Notes and reminders
- Analytics dashboard

See [docs/roadmap.md](docs/roadmap.md) for detailed development plan.

## 🔧 Technologies

**Frontend**
- TypeScript (strict mode with full type safety)
- Chrome Extension API (Manifest V3)
- Vanilla JavaScript (no framework overhead)
- Modern CSS (gradients, animations)

**Build Tools**
- esbuild (fast JavaScript bundler)
- npm scripts for automation

**Storage**
- IndexedDB (native browser database)
- Storage adapter pattern (future: SQLite, Cloud sync)

**AI (Coming Soon)**
- Google Gemini 1.5 Flash (default)
- OpenAI GPT-4 (optional)
- Anthropic Claude (optional)

## 📊 Database Schema

**Current Tables:**
- `resumes` - Master resume storage
- `resume_versions` - Job-specific optimized versions  
- `jobs` - Extracted job postings
- `applications` - Application tracking
- `model_configs` - AI model settings

See [src/db/indexeddb-adapter.ts](src/db/indexeddb-adapter.ts) for schema details.

## 🤝 Contributing

This is currently a personal project in active development. Issues and suggestions are welcome!

## 📝 License

MIT

---

**Version:** 1.0.0 (Stage 2 Complete)  
**Status:** Active Development  
**Last Updated:** November 19, 2025
