// AI Service Manager - Orchestrates AI providers

import { GeminiProvider } from './gemini-provider';
import type { AIProvider } from './ai-provider';
import type {
  AIModelConfig,
  JobAnalysisRequest,
  JobAnalysisResult,
  AIResponse
} from './types';

class AIService {
  private provider: AIProvider | null = null;
  private config: AIModelConfig | null = null;

  /**
   * Initialize AI service with configuration
   */
  async initialize(config: AIModelConfig): Promise<void> {
    this.config = config;
    
    // Create provider based on config
    switch (config.provider) {
      case 'gemini':
        this.provider = new GeminiProvider(config);
        break;
      case 'openai':
        throw new Error('OpenAI provider not implemented yet');
      case 'anthropic':
        throw new Error('Anthropic provider not implemented yet');
      default:
        const _provider: never = config.provider;
        throw new Error(`Unknown AI provider: ${config.provider}`);
    }

    // Validate API key
    const isValid = await this.provider.validateApiKey();
    if (!isValid) {
      throw new Error('Invalid API key');
    }

    console.log(`AI Service initialized with ${config.provider} (${config.modelName})`);
  }

  /**
   * Analyze a job posting
   */
  async analyzeJob(request: JobAnalysisRequest): Promise<AIResponse<JobAnalysisResult>> {
    if (!this.provider) {
      return {
        success: false,
        error: 'AI service not initialized. Please configure API key in settings.'
      };
    }

    console.log('Analyzing job with AI:', request.jobTitle);
    return this.provider.analyzeJob(request);
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.provider !== null;
  }

  /**
   * Get current configuration
   */
  getConfig(): AIModelConfig | null {
    return this.config;
  }

  /**
   * Get provider capabilities
   */
  getCapabilities() {
    if (!this.provider) return null;
    return this.provider.getCapabilities();
  }
}

// Export singleton instance
export const aiService = new AIService();
export { GeminiProvider };
export type { AIModelConfig, JobAnalysisRequest, JobAnalysisResult };
