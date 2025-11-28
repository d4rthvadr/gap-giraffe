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
        console.log('Content script injected, waiting for analysis...');
        
        // Wait for analysis to complete (with timeout)
        const analysisComplete = await waitForAnalysis(30000); // 30 second timeout
        
        if (analysisComplete) {
          console.log('Analysis complete:', analysisComplete);
          
          if (analysisComplete.analysis) {
            // Open results page in new tab
            const resultsUrl = chrome.runtime.getURL(`results/results.html?jobId=${analysisComplete.jobId}`);
            chrome.tabs.create({ url: resultsUrl });
            
            // Close popup
            window.close();
          } else {
            // Job saved but no AI analysis
            showError('Job saved! Configure AI in settings for match analysis.');
          }
        } else {
          showError('Analysis timed out. Check background console for details.');
        }
        
      } else {
        throw new Error(response.error || 'Failed to analyze job');
      }
    } catch (error) {
      console.error('Error analyzing job:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      showError(errorMsg);
    }
  });

  /**
   * Wait for job analysis to complete
   */
  function waitForAnalysis(timeout: number): Promise<{ jobId: number; analysis?: { matchScore: number; certaintyScore: number } } | null> {
    console.log('Waiting for analysis results...');
    
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        console.log('Analysis timed out after', timeout, 'ms');
        chrome.runtime.onMessage.removeListener(listener);
        resolve(null);
      }, timeout);

      const listener = (msg: Message) => {
        console.log('Popup received message:', msg.type, msg.data);
        
        if (msg.type === 'JOB_EXTRACTED' && msg.data) {
          console.log('Analysis complete! Received data:', msg.data);
          clearTimeout(timeoutId);
          chrome.runtime.onMessage.removeListener(listener);
          resolve(msg.data as { jobId: number; analysis?: { matchScore: number; certaintyScore: number } });
        }
      };

      chrome.runtime.onMessage.addListener(listener);
    });
    }
  
  // Options button click handler
  optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // Tracker button click handler (opens resumes page)
  trackerBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('resumes/resumes.html') });
  });
  

  
  // Show error
  function showError(message: string): void {
    loadingSection.classList.add('hidden');
    analyzeBtn.disabled = false;
    
    errorMessage.textContent = message;
    errorSection.classList.remove('hidden');
  }
});
