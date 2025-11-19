// Abstract AI Provider Interface

import type {
  AIModelConfig,
  JobAnalysisRequest,
  JobAnalysisResult,
  AIResponse,
  ModelCapabilities
} from './types';

/**
 * Abstract base class for AI model providers
 * Implementations: Gemini, OpenAI, Anthropic
 */
export abstract class AIProvider {
  protected config: AIModelConfig;

  constructor(config: AIModelConfig) {
    this.config = config;
  }

  /**
   * Analyze a job posting (with or without resume)
   */
  abstract analyzeJob(request: JobAnalysisRequest): Promise<AIResponse<JobAnalysisResult>>;

  /**
   * Get model capabilities (tokens, cost, etc.)
   */
  abstract getCapabilities(): ModelCapabilities;

  /**
   * Validate API key
   */
  abstract validateApiKey(): Promise<boolean>;

  /**
   * Estimate cost for a request
   */
  estimateCost(inputTokens: number, outputTokens: number): number {
    const caps = this.getCapabilities();
    return (inputTokens * caps.costPerInputToken) + (outputTokens * caps.costPerOutputToken);
  }

  /**
   * Count tokens in text (rough estimation)
   */
  protected estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}
