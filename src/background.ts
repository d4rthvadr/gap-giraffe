// Background Service Worker for Job Resume Optimizer Extension

import type { Message, MessageResponse, StorageData, ModelConfig } from './types';
import type { JobData } from './types';
import { db } from './db/database';
import { aiService } from './ai/ai-service';
import type { AIModelConfig } from './ai/types';
import { ResumeService } from './resume/resume-service';

console.log('Job Resume Optimizer - Background Service Worker Started');

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    // First-time installation
    await initializeExtension();
  } else if (details.reason === 'update') {
    console.log('Extension updated to version:', chrome.runtime.getManifest().version);
    // Re-initialize database to ensure schema is up to date
    await db.initialize();
  }
});

// Initialize extension data
async function initializeExtension(): Promise<void> {
  try {
    console.log('Initializing extension...');
    
    // Initialize database first
    await db.initialize();
    console.log('Database initialized');
    
    // Set default configuration in Chrome storage
    const defaultConfig: ModelConfig = {
      provider: 'gemini',
      modelName: 'gemini-1.5-flash',
      isDefault: true
    };
    
    const storageData: StorageData = {
      modelConfig: defaultConfig,
      initialized: true,
      installDate: new Date().toISOString()
    };
    
    await chrome.storage.local.set(storageData);
    console.log('Extension initialized successfully');
  } catch (error) {
    console.error('Error initializing extension:', error);
  }
}

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((
  message: Message,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: MessageResponse) => void
): boolean => {
  console.log('=== MESSAGE RECEIVED ===');
  console.log('Type:', message.type);
  console.log('From:', sender.tab ? `Tab ${sender.tab.id}` : 'Extension');
  console.log('Data:', message.data);
  
  switch (message.type) {
    case 'ANALYZE_JOB':
      console.log('Handling ANALYZE_JOB request');
      handleAnalyzeJob(sendResponse);
      return true; // Keep channel open for async response
      
    case 'GET_CONFIG':
      handleGetConfig(sendResponse);
      return true;
      
    case 'SAVE_CONFIG':
      handleSaveConfig(message.data as Partial<StorageData>, sendResponse);
      return true;
      
    case 'JOB_EXTRACTED':
      console.log('Handling JOB_EXTRACTED - starting async processing');
      handleJobExtracted(message.data, sendResponse);
      return true;
      
    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
      return false;
  }
});

// Handle job analysis request
async function handleAnalyzeJob(sendResponse: (response: MessageResponse) => void): Promise<void> {
  try {
    // Get the active tab (since popup doesn't have sender.tab)
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      throw new Error('No active tab found');
    }
    
    console.log('Starting job analysis for tab:', tab.id, tab.url);
    
    // Inject content script into the current tab
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['dist/content/content.js']
    });
    
    sendResponse({ success: true, message: 'Content script injected' });
  } catch (error) {
    console.error('Error analyzing job:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    sendResponse({ success: false, error: errorMessage });
  }
}

// Handle extracted job data from content script
async function handleJobExtracted(
  jobData: unknown,
  sendResponse: (response: MessageResponse) => void
): Promise<void> {
  console.log('=== HANDLE JOB EXTRACTED STARTED ===');
  console.log('Received job data:', jobData);
  
  try {
    console.log('Job data received from content script:', jobData);
    
    const job = jobData as JobData;
    
    // Ensure database is initialized
    await db.initialize();
    
    // Check if job already exists
    const existingJob = await db.getJobByUrl(job.url);
    
    if (existingJob) {
      console.log('Job already exists in database:', existingJob.id, 'analyzed:', existingJob.analyzed);
      
      // Broadcast to popup (so it doesn't timeout)
      chrome.runtime.sendMessage({
        type: 'JOB_EXTRACTED',
        data: {
          jobId: existingJob.id,
          analyzed: existingJob.analyzed,
          cached: true
        }
      }).catch(() => console.log('Popup closed'));
      
      sendResponse({ 
        success: true, 
        message: existingJob.analyzed ? 'Job already analyzed (cached)' : 'Job already saved',
        data: { jobId: existingJob.id, analyzed: existingJob.analyzed }
      });
      return;
    }
    
    // Create new job record
    const jobId = await db.createJob({
      url: job.url,
      title: job.title.value,
      title_confidence: job.title.confidence,
      company: job.company.value || null,
      company_confidence: job.company.confidence || null,
      description: job.description.value,
      description_confidence: job.description.confidence,
      requirements: null,
      scraped_at: job.extractedAt,
      analyzed: false
    });
    
    console.log('Job saved to database with ID:', jobId);
    
    // Try to analyze with AI if configured
    try {
      const aiConfig = await chrome.storage.local.get(['aiConfig']);
      
      if (aiConfig.aiConfig) {
        console.log('AI configured, starting analysis...');
        
        // Initialize AI service if not already done
        if (!aiService.isReady()) {
          await aiService.initialize(aiConfig.aiConfig as AIModelConfig);
        }
        
        // Try to get master resume for full analysis
        const masterResume = await ResumeService.getMasterResume();
        
        // Analyze job with AI (with or without resume)
        const analysisResult = await aiService.analyzeJob({
          jobTitle: job.title.value,
          jobCompany: job.company.value,
          jobDescription: job.description.value,
          resumeContent: masterResume?.resume.original_content
        });
        
        if (analysisResult.success && analysisResult.data) {
          console.log('AI analysis complete:', analysisResult.data);
          
          // Update job with analysis results
          await db.updateJob(jobId, {
            analyzed: true,
            requirements: analysisResult.data.keyRequirements.join('\n')
          });
          
    // Broadcast results to popup
    console.log('Broadcasting JOB_EXTRACTED to popup with analysis:', {
      jobId,
      hasAnalysis: !!analysisResult.data,
      matchScore: analysisResult.data?.matchScore
    });
    
    chrome.runtime.sendMessage({
      type: 'JOB_EXTRACTED',
      data: {
        jobId,
        analysis: analysisResult.data,
        hasResume: !!masterResume
      }
    }).catch((error) => {
      // Popup might be closed, ignore error
      console.log('Could not send to popup:', error);
    });
          
          sendResponse({ 
            success: true, 
            message: masterResume ? 'Job analyzed with resume match' : 'Job analyzed (no resume)',
            data: {
              jobId,
              analysis: analysisResult.data,
              hasResume: !!masterResume
            }
          });
          return;
        } else {
          console.warn('AI analysis failed:', analysisResult.error);
        }
      }
    } catch (aiError) {
      console.error('AI analysis error (non-fatal):', aiError);
    }
    
    // Fallback: Job saved but not analyzed
    // Broadcast to popup
    chrome.runtime.sendMessage({
      type: 'JOB_EXTRACTED',
      data: {
        jobId,
        analyzed: false
      }
    }).catch(() => {
      console.log('Popup closed, could not send results');
    });
    
    // Fallback: Job saved but not analyzed
    sendResponse({ 
      success: true, 
      message: 'Job saved (AI not configured)',
      data: { jobId, analyzed: false }
    });
    
  } catch (error) {
    console.error('Error handling job data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    sendResponse({ success: false, error: errorMessage });
  }
}


// Get current configuration
async function handleGetConfig(sendResponse: (response: MessageResponse<StorageData>) => void): Promise<void> {
  try {
    const data = await chrome.storage.local.get(['modelConfig', 'apiKeys']) as StorageData;
    sendResponse({ success: true, data });
  } catch (error) {
    console.error('Error getting config:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    sendResponse({ success: false, error: errorMessage });
  }
}

// Save configuration
async function handleSaveConfig(
  config: Partial<StorageData>,
  sendResponse: (response: MessageResponse) => void
): Promise<void> {
  try {
    await chrome.storage.local.set(config);
    console.log('Configuration saved:', config);
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error saving config:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    sendResponse({ success: false, error: errorMessage });
  }
}
