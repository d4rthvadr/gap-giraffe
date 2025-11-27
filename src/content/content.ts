// Content Script for Job Resume Optimizer
// This script is injected into job posting pages when user clicks "Analyze"

import type { JobData, ExtractedField, ConfidenceLevel, Message, MessageResponse } from '../types';

console.log('Job Resume Optimizer - Content Script Loaded');

(function() {
  'use strict';
  
  // Prevent multiple injections
  if ((window as any).jobResumeOptimizerInjected) {
    console.log('Content script already running');
    return;
  }
  (window as any).jobResumeOptimizerInjected = true;
  
  // Main extraction function
  function extractJobDetails(): JobData {
    console.log('Starting job extraction...');
    
    const jobData: JobData = {
      url: window.location.href,
      extractedAt: new Date().toISOString(),
      title: extractJobTitle(),
      company: extractCompany(),
      description: extractDescription()
    };
    
    console.log('Extracted job data:', jobData);
    return jobData;
  }
  
  // Extract job title
  function extractJobTitle(): ExtractedField {
    let title = '';
    let confidence: ConfidenceLevel = 'low';
    
    // Strategy 1: Look for common job title patterns in h1
    const h1Elements = Array.from(document.querySelectorAll('h1'));
    for (const h1 of h1Elements) {
      const text = h1.textContent?.trim() || '';
      if (text.length > 5 && text.length < 100) {
        title = text;
        confidence = 'high';
        break;
      }
    }
    
    // Strategy 2: Check meta tags
    if (!title) {
      const metaTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
      if (metaTitle && metaTitle.content) {
        title = metaTitle.content;
        confidence = 'medium';
      }
    }
    
    // Strategy 3: Use document title
    if (!title) {
      title = document.title;
      confidence = 'low';
    }
    
    console.log(`Job title extracted: "${title}" (confidence: ${confidence})`);
    return { value: title, confidence };
  }
  
  // Extract company name
  function extractCompany(): ExtractedField {
    let company = '';
    let confidence: ConfidenceLevel = 'low';
    
    // Strategy 1: Look for common company class names
    const companySelectors = [
      '[class*="company"]',
      '[class*="employer"]',
      '[data-company]',
      '[itemprop="hiringOrganization"]'
    ];
    
    for (const selector of companySelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        company = element.textContent.trim();
        confidence = 'medium';
        break;
      }
    }
    
    // Strategy 2: Check meta tags
    if (!company) {
      const metaSite = document.querySelector('meta[property="og:site_name"]') as HTMLMetaElement;
      if (metaSite && metaSite.content) {
        company = metaSite.content;
        confidence = 'low';
      }
    }
    
    console.log(`Company extracted: "${company}" (confidence: ${confidence})`);
    return { value: company, confidence };
  }
  
  // Extract job description
  function extractDescription(): ExtractedField {
    let description = '';
    let confidence: ConfidenceLevel = 'low';
    
    // Strategy 1: Look for main content areas
    const contentSelectors = [
      'article',
      'main',
      '[class*="description"]',
      '[class*="job-description"]',
      '[class*="content"]',
      '[role="main"]'
    ];
    
    let maxLength = 0;
    
    for (const selector of contentSelectors) {
      const elements = Array.from(document.querySelectorAll(selector));
      for (const element of elements) {
        const text = element.textContent?.trim() || '';
        if (text.length > maxLength && text.length > 100) {
          description = text;
          maxLength = text.length;
          confidence = 'medium';
        }
      }
    }
    
    // Strategy 2: Get the largest text block on the page
    if (!description || description.length < 200) {
      const allElements = Array.from(document.querySelectorAll('div, section, article'));
      for (const element of allElements) {
        // Get direct text content (not deeply nested)
        const text = Array.from(element.childNodes)
          .filter((node: Node) => node.nodeType === Node.TEXT_NODE || node.nodeName === 'P')
          .map((node: Node) => node.textContent)
          .join(' ')
          .trim();
        
        if (text.length > maxLength && text.length > 100) {
          description = element.textContent?.trim() || '';
          maxLength = text.length;
          confidence = 'low';
        }
      }
    }
    
    // Clean up description
    description = description
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/\n{3,}/g, '\n\n')  // Limit consecutive newlines
      .trim();
    
    console.log(`Description extracted: ${description.length} chars (confidence: ${confidence})`);
    return { value: description, confidence };
  }
  
  // Show extraction feedback to user
  function showFeedback(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
    const feedback = document.createElement('div');
    feedback.id = 'job-optimizer-feedback';
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      animation: slideIn 0.3s ease-out;
    `;
    
    feedback.textContent = message;
    document.body.appendChild(feedback);
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    // Remove after 3 seconds
    setTimeout(() => {
      feedback.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => feedback.remove(), 300);
    }, 3000);
  }
  
  // Execute extraction and send to background
  try {
    showFeedback('🔍 Analyzing job posting...', 'info');
    
    const jobData = extractJobDetails();
    
    // Send extracted data to background script
    const message: Message<JobData> = {
      type: 'JOB_EXTRACTED',
      data: jobData
    };
    
    console.log('Sending JOB_EXTRACTED message to background:', message);
    
    chrome.runtime.sendMessage(message, (response: MessageResponse) => {
      // Check for errors
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError);
        showFeedback('⚠ Could not send to background script', 'error');
        return;
      }
      
      console.log('Received response from background:', response);
      
      if (response && response.success) {
        showFeedback('✓ Job analysis complete!', 'success');
      } else {
        showFeedback('⚠ Analysis completed with some issues', 'error');
      }
    });
    
  } catch (error) {
    console.error('Error extracting job details:', error);
    showFeedback('⚠ Error analyzing page', 'error');
  }
  
})();
