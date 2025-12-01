// Database types and interfaces

import type { ConfidenceLevel } from '../types';

export interface Resume {
  id?: number;
  name: string;
  original_content: string;
  file_type: 'text' | 'pdf' | 'docx';
  created_at: string;
  updated_at: string;
  is_master: boolean;
}

export interface ResumeVersion {
  id?: number;
  resume_id: number;
  job_id: number | null;
  modified_content: string;
  certainty_score: number | null;
  changes_summary: string | null;
  created_at: string;
}

export interface Job {
  id?: number;
  url: string;
  title: string;
  title_confidence: ConfidenceLevel | null;
  company: string | null;
  company_confidence: ConfidenceLevel | null;
  description: string;
  description_confidence: ConfidenceLevel | null;
  requirements: string | null;
  scraped_at: string;
  analyzed: boolean;
  analysis_result?: string;  // JSON string of JobAnalysisResult
  match_score?: number;      // Quick access to score (0-100)
}

export interface Application {
  id?: number;
  job_id: number;
  resume_version_id: number | null;
  status: ApplicationStatus;
  status_history: StatusHistoryEntry[];  // Track all status changes
  applied_at: string | null;
  interview_date: string | null;         // When interview is scheduled
  interview_notes: string | null;        // Notes from interview
  reminders: Reminder[];                 // Follow-up reminders
  updated_at: string;
  notes: string | null;
}

export interface StatusHistoryEntry {
  status: ApplicationStatus;
  timestamp: number;                     // Unix timestamp
  note?: string;                         // Optional note about the change
}

export interface Reminder {
  id: string;                            // Unique ID (UUID)
  title: string;                         // e.g., "Follow up on application"
  due_date: number;                      // Unix timestamp
  completed: boolean;
  created_at: number;
}

export type ApplicationStatus = 
  | 'saved'
  | 'applied'
  | 'screening'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export interface ModelConfig {
  id?: number;
  provider: 'gemini' | 'openai' | 'anthropic';
  model_name: string;
  api_key: string | null;
  cost_per_token: number | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Metadata {
  key: string;
  value: string;
}
