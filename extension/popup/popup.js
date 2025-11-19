// Popup JavaScript for Job Resume Optimizer

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup loaded');
  
  // Get DOM elements
  const analyzeBtn = document.getElementById('analyze-btn');
  const pageUrlElement = document.getElementById('page-url');
  const loadingSection = document.getElementById('loading-section');
  const resultSection = document.getElementById('result-section');
  const errorSection = document.getElementById('error-section');
  const errorMessage = document.getElementById('error-message');
  const optionsBtn = document.getElementById('options-btn');
  const trackerBtn = document.getElementById('tracker-btn');
  
  // Get current tab URL
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      pageUrlElement.textContent = tab.url;
      
      // Store tab ID for later use
      window.currentTabId = tab.id;
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
      const response = await chrome.runtime.sendMessage({
        type: 'ANALYZE_JOB'
      });
      
      if (response.success) {
        console.log('Job analysis started successfully');
        
        // For now, show a mock success (we'll integrate real analysis later)
        setTimeout(() => {
          showResults({
            matchScore: 85,
            certaintyScore: 92
          });
        }, 2000);
      } else {
        throw new Error(response.error || 'Failed to analyze job');
      }
    } catch (error) {
      console.error('Error analyzing job:', error);
      showError(error.message);
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
  function showResults(data) {
    loadingSection.classList.add('hidden');
    analyzeBtn.disabled = false;
    
    document.getElementById('match-score').textContent = data.matchScore + '%';
    document.getElementById('certainty-score').textContent = data.certaintyScore + '%';
    
    resultSection.classList.remove('hidden');
  }
  
  // Show error
  function showError(message) {
    loadingSection.classList.add('hidden');
    analyzeBtn.disabled = false;
    
    errorMessage.textContent = message;
    errorSection.classList.remove('hidden');
  }
});
