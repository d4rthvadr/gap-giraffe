# Job Resume Optimizer - Chrome Extension (TypeScript)

A Chrome browser extension that helps job seekers optimize their resumes by analyzing job postings using AI.

## Tech Stack

- **TypeScript** - Type-safe development
- **Chrome Extension API** - Manifest V3
- **SQLite** - Local data storage (coming in Stage 2)
- **Gemini Flash** - AI model integration (coming in Stage 3)

## Project Structure

```
job-tracker/
├── src/                    # TypeScript source files
│   ├── types/
│   │   └── index.ts       # Type definitions
│   ├── background.ts      # Service worker
│   ├── popup/
│   │   └── popup.ts       # Popup logic
│   └── content/
│       └── content.ts     # Content script
├── extension/             # Extension files
│   ├── manifest.json     # Extension config
│   ├── dist/             # Compiled JavaScript (generated)
│   ├── popup/
│   │   ├── popup.html
│   │   └── popup.css
│   └── icons/
├── tsconfig.json         # TypeScript config
└── package.json          # Dependencies
```

## Development Setup

### Install Dependencies

```bash
npm install
```

### Build TypeScript

```bash
# Build once
npm run build

# Watch mode (auto-rebuild on changes)
npm run watch

# Clean build
npm run clean
```

### Load Extension in Chrome

1. Build the TypeScript first: `npm run build`
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select: `/Users/mac/Documents/Ghost rider/frontend masters/job-tracker/extension`

## Stage 1: Complete ✓

**Features:**
- ✅ TypeScript codebase with strict type checking
- ✅ Chrome extension structure (Manifest V3)
- ✅ Job scraping with confidence scoring
- ✅ Manual trigger via popup
- ✅ Modern UI with animations
- ✅ Content script injection

**Type Safety:**
- All message types defined
- Job data structures typed
- DOM manipulation type-safe
- Chrome API fully typed

## Development Workflow

1. **Edit TypeScript files** in `src/`
2. **Run build** (or use watch mode)
3. **Reload extension** in Chrome
4. **Test on job pages**

### Watch Mode (Recommended)

```bash
npm run watch
```

This automatically recompiles TypeScript when you save files. Just reload the extension in Chrome to see changes.

## Key Types

```typescript
// Job extraction
interface JobData {
  url: string;
  title: ExtractedField;
  company: ExtractedField;
  description: ExtractedField;
}

// Model configuration
interface ModelConfig {
  provider: 'gemini' | 'openai' | 'anthropic';
  modelName: string;
  isDefault: boolean;
}

// Messages between components
type MessageType = 'ANALYZE_JOB' | 'JOB_EXTRACTED' | 'GET_CONFIG' | 'SAVE_CONFIG';
```

## Testing

1. Navigate to any job posting
2. Click extension icon
3. Click "Analyze This Job"
4. Check console for extracted data (F12)
5. Verify typed data structures

## Next Stages

- **Stage 2**: Database & Resume Management
- **Stage 3**: AI Model Integration (Gemini Flash)
- **Stage 4**: Resume Optimization
- **Stage 5**: Application Tracking

## Scripts

- `npm run build` - Compile TypeScript
- `npm run watch` - Watch mode
- `npm run clean` - Remove compiled files

---

**Status:** Stage 1 Complete - TypeScript Refactor ✓
