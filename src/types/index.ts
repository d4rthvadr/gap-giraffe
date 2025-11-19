// Type definitions for Job Resume Optimizer Extension

export interface JobData {
  url: string;
  extractedAt: string;
  title: ExtractedField;
  company: ExtractedField;
  description: ExtractedField;
}

export interface ExtractedField {
  value: string;
  confidence: ConfidenceLevel;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ModelConfig {
  provider: ModelProvider;
  modelName: string;
  isDefault: boolean;
  apiKey?: string;
}

export type ModelProvider = 'gemini' | 'openai' | 'anthropic';

export interface AnalysisResult {
  matchScore: number;
  certaintyScore: number;
  suggestions?: string[];
  jobId?: string;
}

export interface StorageData {
  modelConfig?: ModelConfig;
  apiKeys?: Record<ModelProvider, string>;
  initialized?: boolean;
  installDate?: string;
}

// Message types for communication between components
export type MessageType = 
  | 'ANALYZE_JOB'
  | 'JOB_EXTRACTED'
  | 'GET_CONFIG'
  | 'SAVE_CONFIG';

export interface Message<T = unknown> {
  type: MessageType;
  data?: T;
}

export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
