// AI Model Provider Types and Interfaces

export type AIProvider = 'gemini' | 'openai' | 'anthropic';

export interface AIModelConfig {
  provider: AIProvider;
  modelName: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
}

export interface JobAnalysisRequest {
  jobTitle: string;
  jobCompany: string | null;
  jobDescription: string;
  resumeContent?: string; // Optional for now, required in Stage 4
}

export interface JobAnalysisResult {
  matchScore: number; // 0-100
  certaintyScore: number; // 0-100
  keyRequirements: string[];
  missingSkills: string[];
  strengths: string[];
  suggestions: OptimizationSuggestion[];
  analysis: {
    technicalFit: number;
    experienceFit: number;
    culturalFit: number;
  };
}

export interface OptimizationSuggestion {
  id: string;
  type: 'add' | 'modify' | 'remove' | 'reorder';
  section: 'summary' | 'experience' | 'skills' | 'education';
  priority: 'high' | 'medium' | 'low';
  current?: string;
  suggested: string;
  reason: string;
  impact: number; // Expected improvement in match score
}

export interface AIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  tokensUsed?: number;
  cost?: number;
}

export interface ModelCapabilities {
  maxInputTokens: number;
  maxOutputTokens: number;
  costPerInputToken: number;
  costPerOutputToken: number;
  supportsStreaming: boolean;
}
