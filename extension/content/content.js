// Content Script for Job Resume Optimizer
// This script is injected into job posting pages when user clicks "Analyze"

console.log('Job Resume Optimizer - Content Script Loaded');

(function() {
  'use strict';
  
  // Prevent multiple injections
  if (window.jobResumeOptimizerInjected) {
    console.log('Content script already running');
    return;
  }
  window.jobResumeOptimizerInjected = true;
  
  // Main extraction function
  function extractJobDetails() {
    console.log('Starting job extraction...');
    
    const jobData = {
      url: window.location.href,
      extractedAt: new Date().toISOString(),
      title: extractJobTitle(),
      company: extractCompany(),
      description: extractDescription(),
      confidence: {}
    };
    
    console.log('Extracted job data:', jobData);
    return jobData;
  }
  
  // Extract job title
  function extractJobTitle() {
    let title = '';
    let confidence = 'low';
    
    // Strategy 1: Look for common job title patterns in h1
    const h1Elements = document.querySelectorAll('h1');
    for (const h1 of h1Elements) {
      const text = h1.textContent.trim();
      if (text.length > 5 && text.length < 100) {
        title = text;
        confidence = 'high';
        break;
      }
    }
    
    // Strategy 2: Check meta tags
    if (!title) {
      const metaTitle = document.querySelector('meta[property="og:title"]');
      if (metaTitle) {
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
  function extractCompany() {
    let company = '';
    let confidence = 'low';
    
    // Strategy 1: Look for common company class names
    const companySelectors = [
      '[class*="company"]',
      '[class*="employer"]',
      '[data-company]',
      '[itemprop="hiringOrganization"]'
    ];
    
    for (const selector of companySelectors) {
      const element = document.querySelector(selector);
      if (element) {
        company = element.textContent.trim();
        confidence = 'medium';
        break;
      }
    }
    
    // Strategy 2: Check meta tags
    if (!company) {
      const metaSite = document.querySelector('meta[property="og:site_name"]');
      if (metaSite) {
        company = metaSite.content;
        confidence = 'low';
      }
    }
    
    console.log(`Company extracted: "${company}" (confidence: ${confidence})`);
    return { value: company, confidence };
  }
  
  // Extract job description
  function extractDescription() {
    let description = '';
    let confidence = 'low';
    
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
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent.trim();
        if (text.length > maxLength && text.length > 100) {
          description = text;
          maxLength = text.length;
          confidence = 'medium';
        }
      }
    }
    
    // Strategy 2: Get the largest text block on the page
    if (!description || description.length < 200) {
      const allElements = document.querySelectorAll('div, section, article');
      for (const element of allElements) {
        // Get direct text content (not deeply nested)
        const text = Array.from(element.childNodes)
          .filter(node => node.nodeType === Node.TEXT_NODE || node.nodeName === 'P')
          .map(node => node.textContent)
          .join(' ')
          .trim();
        
        if (text.length > maxLength && text.length > 100) {
          description = element.textContent.trim();
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
  function showFeedback(message, type = 'info') {
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
    chrome.runtime.sendMessage({
      type: 'JOB_EXTRACTED',
      data: jobData
    }, (response) => {
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
