// Popup JavaScript for Job Resume Optimizer

import type { Message, MessageResponse, AnalysisResult } from '../types';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup loaded');
  
  // Get DOM elements
  const analyzeBtn = document.getElementById('analyze-btn') as HTMLButtonElement;
  const pageUrlElement = document.getElementById('page-url') as HTMLSpanElement;
  const loadingSection = document.getElementById('loading-section') as HTMLDivElement;
  const resultSection = document.getElementById('result-section') as HTMLDivElement;
  const errorSection = document.getElementById('error-section') as HTMLDivElement;
  const errorMessage = document.getElementById('error-message') as HTMLParagraphElement;
  const optionsBtn = document.getElementById('options-btn') as HTMLButtonElement;
  const trackerBtn = document.getElementById('tracker-btn') as HTMLButtonElement;
  
  // Get current tab URL
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      pageUrlElement.textContent = tab.url;
    }
  } catch (error) {
    console.error('Error getting current tab:', error);
    pageUrlElement.textContent = 'Unable to detect current page';
  }
  
  // Analyze button click handler
  analyzeBtn.addEventListener('click', async () => {
    console.log('Analyze button clicked');
    
    // Hide previous results/errors
    resultSection.classList.add('hidden');
    errorSection.classList.add('hidden');
    
    // Show loading state
    analyzeBtn.disabled = true;
    loadingSection.classList.remove('hidden');
    
    try {
      // Send message to background script to analyze job
      const message: Message = {
        type: 'ANALYZE_JOB'
      };
      
      const response = await chrome.runtime.sendMessage(message) as MessageResponse;
      
      if (response.success) {
        console.log('Job analysis started successfully');
        
        // Wait for actual analysis results
        // Listen for JOB_EXTRACTED completion message
        chrome.runtime.onMessage.addListener((msg: Message) => {
          if (msg.type === 'JOB_EXTRACTED' && msg.data) {
            const data = msg.data as { analysis?: { matchScore: number; certaintyScore: number } };
            if (data.analysis) {
              showResults({
                matchScore: data.analysis.matchScore,
                certaintyScore: data.analysis.certaintyScore
              });
            } else {
              // AI not configured
              showError('AI not configured. Please add your Gemini API key in settings.');
            }
          }
        });
        
      } else {
        throw new Error(response.error || 'Failed to analyze job');
      }
    } catch (error) {
      console.error('Error analyzing job:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      showError(errorMsg);
    }
  });
  
  // Options button click handler
  optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // Tracker button click handler (placeholder for now)
  trackerBtn.addEventListener('click', () => {
    // TODO: Open job tracker page
    console.log('Job tracker clicked - to be implemented');
  });
  
  // Show results
  function showResults(data: AnalysisResult): void {
    loadingSection.classList.add('hidden');
    analyzeBtn.disabled = false;
    
    const matchScoreElement = document.getElementById('match-score') as HTMLSpanElement;
    const certaintyScoreElement = document.getElementById('certainty-score') as HTMLSpanElement;
    
    matchScoreElement.textContent = data.matchScore + '%';
    certaintyScoreElement.textContent = data.certaintyScore + '%';
    
    resultSection.classList.remove('hidden');
  }
  
  // Show error
  function showError(message: string): void {
    loadingSection.classList.add('hidden');
    analyzeBtn.disabled = false;
    
    errorMessage.textContent = message;
    errorSection.classList.remove('hidden');
  }
});
