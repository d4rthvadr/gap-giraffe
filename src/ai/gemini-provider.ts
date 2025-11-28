// Gemini API Provider Implementation

import { AIProvider } from './ai-provider';
import type {
  AIModelConfig,
  JobAnalysisRequest,
  JobAnalysisResult,
  AIResponse,
  ModelCapabilities,
  OptimizationSuggestion
} from './types';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export class GeminiProvider extends AIProvider {
  
  getCapabilities(): ModelCapabilities {
    return {
      maxInputTokens: 1000000, // Gemini 1.5 Flash has 1M context
      maxOutputTokens: 8192,
      costPerInputToken: 0.000000075, // $0.075 per 1M tokens
      costPerOutputToken: 0.0000003,  // $0.30 per 1M tokens
      supportsStreaming: true
    };
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/models?key=${this.config.apiKey}`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async analyzeJob(request: JobAnalysisRequest): Promise<AIResponse<JobAnalysisResult>> {
    try {
      const prompt = this.buildAnalysisPrompt(request);
      const tokensUsed = this.estimateTokens(prompt);
      
      const response = await this.callGeminiAPI(prompt);
      
      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || 'Failed to analyze job'
        };
      }

      const analysis = this.parseAnalysisResponse(response.data);
      const cost = this.estimateCost(tokensUsed, this.estimateTokens(JSON.stringify(analysis)));

      return {
        success: true,
        data: analysis,
        tokensUsed,
        cost
      };
    } catch (error) {
      console.error('Gemini analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private buildAnalysisPrompt(request: JobAnalysisRequest): string {
    // If we have a resume, analyze match; otherwise just analyze the job
    if (request.resumeContent) {
      return `You are an expert resume optimization assistant. Analyze the following job posting against the candidate's resume and provide detailed feedback.

JOB POSTING:
Title: ${request.jobTitle}
Company: ${request.jobCompany || 'Not specified'}
Description: ${request.jobDescription}

RESUME:
${request.resumeContent}

Provide a comprehensive analysis in the following JSON format:
{
  "matchScore": <number 0-100, overall fit for this role>,
  "certaintyScore": <number 0-100, how confident you are in this analysis>,
  "keyRequirements": [<array of main job requirements extracted from posting>],
  "missingSkills": [<array of required skills the candidate lacks>],
  "strengths": [<array of candidate's strong points for this role>],
  "analysis": {
    "technicalFit": <number 0-100, technical skills match>,
    "experienceFit": <number 0-100, experience level match>,
    "culturalFit": <number 0-100, based on job description tone and candidate background>
  },
  "suggestions": [
    {
      "id": "<unique-id>",
      "type": "add|modify|remove|reorder",
      "section": "summary|experience|skills|education",
      "priority": "high|medium|low",
      "current": "<current text if modifying>",
      "suggested": "<suggested improvement>",
      "reason": "<why this change helps>",
      "impact": <expected score improvement 0-20>
    }
  ]
}

Be specific and actionable. Focus on:
1. ATS optimization (keyword matching)
2. Quantifiable achievements
3. Relevant experience highlighting
4. Skills alignment
5. Format and structure improvements

Provide at least 5-10 concrete suggestions.`;
    } else {
      // No resume yet - just analyze the job requirements
      return `You are an expert job requirements analyst. Analyze the following job posting and extract key information.

JOB POSTING:
Title: ${request.jobTitle}
Company: ${request.jobCompany || 'Not specified'}
Description: ${request.jobDescription}

Provide an analysis in the following JSON format:
{
  "matchScore": 0,
  "certaintyScore": 90,
  "keyRequirements": [<array of main job requirements and skills needed>],
  "missingSkills": [],
  "strengths": [],
  "analysis": {
    "technicalFit": 0,
    "experienceFit": 0,
    "culturalFit": 0
  },
  "suggestions": [
    {
      "id": "req-1",
      "type": "add",
      "section": "skills",
      "priority": "high",
      "suggested": "<skill or experience needed>",
      "reason": "Required for this position",
      "impact": 10
    }
  ]
}

Focus on extracting technical requirements, required experience level, and key qualifications.`;
    }
  }

  private async callGeminiAPI(prompt: string): Promise<AIResponse<string>> {
    try {
      const url = `${GEMINI_API_BASE}/models/${this.config.modelName}:generateContent?key=${this.config.apiKey}`;
      console.log(" Gemini API URL:", url);
      console.log(" Gemini API Prompt:", prompt);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: this.config.temperature || 0.7,
            // maxOutputTokens: this.config.maxTokens || 8192,  // Increased to prevent truncation
            maxOutputTokens: 8192,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${error}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('No response from Gemini API');
      }

      console.log(" Gemini API Response:", text);

      // TODO: wrap json extraction in try/catch
      const analysisData = JSON.parse(text);
      console.log(" Gemini API Analysis Data:", analysisData);
      return {
        success: true,
        data: text
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'API call failed'
      };
    }
  }

  private parseAnalysisResponse(jsonText: string): JobAnalysisResult {
    try {
      // Try to parse JSON directly
      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch (parseError) {
        // If JSON is truncated, try to fix it
        console.warn('JSON parse failed, attempting to fix truncated response');
        const fixed = this.fixTruncatedJSON(jsonText);
        parsed = JSON.parse(fixed);
      }
      
      // Ensure all required fields exist with defaults
      return {
        matchScore: parsed.matchScore || 0,
        certaintyScore: parsed.certaintyScore || 0,
        keyRequirements: parsed.keyRequirements || [],
        missingSkills: parsed.missingSkills || [],
        strengths: parsed.strengths || [],
        analysis: {
          technicalFit: parsed.analysis?.technicalFit || 0,
          experienceFit: parsed.analysis?.experienceFit || 0,
          culturalFit: parsed.analysis?.culturalFit || 0
        },
        suggestions: (parsed.suggestions || []).map((s: OptimizationSuggestion, i: number) => ({
          id: s.id || `suggestion-${i}`,
          type: s.type || 'add',
          section: s.section || 'skills',
          priority: s.priority || 'medium',
          current: s.current,
          suggested: s.suggested || '',
          reason: s.reason || '',
          impact: s.impact || 5
        }))
      };
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      console.error('Raw response:', jsonText);
      // Return empty analysis on parse error
      return {
        matchScore: 0,
        certaintyScore: 0,
        keyRequirements: [],
        missingSkills: [],
        strengths: [],
        analysis: {
          technicalFit: 0,
          experienceFit: 0,
          culturalFit: 0
        },
        suggestions: []
      };
    }
  }

  /**
   * Attempt to fix truncated JSON by closing open structures
   */
  private fixTruncatedJSON(jsonText: string): string {
    let fixed = jsonText.trim();
    
    // Count open vs closed braces/brackets
    const openBraces = (fixed.match(/{/g) || []).length;
    const closeBraces = (fixed.match(/}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/]/g) || []).length;
    
    // Close missing brackets and braces
    for (let i = 0; i < (openBrackets - closeBrackets); i++) {
      fixed += ']';
    }
    for (let i = 0; i < (openBraces - closeBraces); i++) {
      fixed += '}';
    }
    
    return fixed;
  }
}
