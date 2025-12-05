# Gap Giraffe - Development Roadmap

This document outlines the technical development stages and future plans for Gap Giraffe.

---

## Development Stages

### ✅ Stage 1: Foundation (Complete)
- Project setup and build configuration
- TypeScript configuration
- Chrome extension manifest
- Basic popup UI

### ✅ Stage 2: Data Layer (Complete)
- IndexedDB adapter implementation
- Database schema design
- Storage abstraction layer
- Type definitions

### ✅ Stage 3: AI Integration (Complete)
- Google Gemini API integration
- Job analysis prompts
- Structured output parsing
- Error handling and retries

### ✅ Stage 4: Resume Management (Complete)
- Resume upload and parsing
- PDF/TXT/DOCX support
- Resume storage
- Version tracking

### ✅ Stage 5: Application Tracking (Complete)
- Save jobs to applications
- Status management system
- Status history tracking
- Tracker dashboard (List/Board views)
- Search and filter functionality
- Analytics dashboard
- Export to CSV

### ✅ Stage 6: UI Redesign (Complete)
- Minimal design system
- CSS variables and tokens
- Remove gradients and emojis
- Professional, clean aesthetic
- Consistent spacing and typography

---

## Future Enhancements

### 🔄 Stage 7: Reminders & Notifications (Planned)
- Follow-up reminders
- Chrome notifications
- Reminder management UI
- Notification click handlers

### 🔮 Stage 8: Advanced Features (Ideas)
- **Resume Optimization**
  - AI-powered resume rewriting
  - Keyword optimization
  - ATS-friendly formatting
  
- **Cover Letter Generation**
  - Auto-generate cover letters
  - Customize per job
  - Template management

- **Interview Prep**
  - Common questions for role
  - STAR method examples
  - Company research notes

- **Salary Insights**
  - Market rate data
  - Negotiation tips
  - Compensation tracking

- **Network Tracking**
  - Referral management
  - Contact notes
  - Follow-up scheduling

### 🌐 Stage 9: Cloud Sync (Future)
- Optional cloud backup
- Multi-device sync
- Data export/import
- Account management

### 📱 Stage 10: Mobile Companion (Future)
- Mobile app for tracking
- Quick status updates
- Notifications on mobile
- Interview prep on-the-go

---

## Technical Debt & Improvements

### Performance
- [ ] Lazy load analytics charts
- [ ] Virtualize long application lists
- [ ] Optimize database queries
- [ ] Cache AI responses

### Code Quality
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Improve error messages
- [ ] Add logging system

### User Experience
- [ ] Keyboard shortcuts
- [ ] Bulk actions (delete, export)
- [ ] Custom status types
- [ ] Dark mode support

### Developer Experience
- [ ] Hot reload in development
- [ ] Better build error messages
- [ ] Documentation improvements
- [ ] Contributing guidelines

---

## Database Schema Evolution

### Current Schema (v2)
```typescript
interface Job {
  id: number;
  url: string;
  title: string;
  company: string;
  description: string;
  requirements: string;
  analyzed: boolean;
  analysis_result: string; // JSON
  match_score: number;
  scraped_at: string;
}

interface Application {
  id: number;
  job_id: number;
  resume_version_id: number;
  status: ApplicationStatus;
  status_history: StatusHistoryEntry[];
  applied_at: string;
  interview_date: string;
  interview_notes: string;
  reminders: Reminder[];
  updated_at: string;
  notes: string;
}

interface Resume {
  id: number;
  name: string;
  original_content: string;
  parsed_content: string;
  file_type: string;
  is_master: boolean;
  created_at: string;
}
```

### Planned Schema Changes (v3)
- Add `tags` to applications
- Add `salary_range` to jobs
- Add `contacts` table for networking
- Add `interview_questions` table
- Add `cover_letters` table

---

## API Integration Plans

### Current
- Google Gemini 2.5 Flash

### Future Options
- OpenAI GPT-4 (alternative)
- Anthropic Claude (alternative)
- Local LLM support (privacy-focused)

---

## Build & Deployment

### Current Build Process
1. TypeScript compilation via esbuild
2. CSS bundling
3. Asset copying
4. Manifest validation

### Future Improvements
- [ ] Automated testing in CI/CD
- [ ] Chrome Web Store publishing
- [ ] Version management
- [ ] Release notes automation

---

## Performance Targets

### Current Metrics
- Extension size: ~500KB
- Initial load: <100ms
- Analysis time: 2-5 seconds
- Database queries: <50ms

### Target Improvements
- Extension size: <400KB
- Initial load: <50ms
- Analysis time: 1-3 seconds
- Database queries: <20ms

---

## Security Considerations

### Current
- ✅ Local data storage
- ✅ User-controlled API keys
- ✅ No external tracking
- ✅ Minimal permissions

### Future
- [ ] API key encryption
- [ ] Data export encryption
- [ ] Security audit
- [ ] Privacy policy

---

## Browser Support

### Current
- ✅ Chrome (Manifest V3)

### Future
- [ ] Firefox (Manifest V3)
- [ ] Edge (Chromium-based)
- [ ] Safari (if feasible)

---

**Last Updated:** December 5, 2025  
**Current Version:** 1.0.0  
**Next Milestone:** Stage 7 (Reminders)
