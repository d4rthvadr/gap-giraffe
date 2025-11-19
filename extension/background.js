// Background Service Worker for Job Resume Optimizer Extension

console.log('Job Resume Optimizer - Background Service Worker Started');

// Initialize extension on install
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    // First-time installation
    initializeExtension();
  } else if (details.reason === 'update') {
    console.log('Extension updated to version:', chrome.runtime.getManifest().version);
  }
});

// Initialize extension data
async function initializeExtension() {
  try {
    // Set default configuration
    await chrome.storage.local.set({
      modelConfig: {
        provider: 'gemini',
        modelName: 'gemini-1.5-flash',
        isDefault: true
      },
      initialized: true,
      installDate: new Date().toISOString()
    });
    
    console.log('Extension initialized successfully');
  } catch (error) {
    console.error('Error initializing extension:', error);
  }
}

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message.type);
  
  switch (message.type) {
    case 'ANALYZE_JOB':
      handleAnalyzeJob(sendResponse);
      return true; // Keep channel open for async response
      
    case 'GET_CONFIG':
      handleGetConfig(sendResponse);
      return true;
      
    case 'SAVE_CONFIG':
      handleSaveConfig(message.data, sendResponse);
      return true;
      
    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

// Handle job analysis request
async function handleAnalyzeJob(sendResponse) {
  try {
    // Get the active tab (since popup doesn't have sender.tab)
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      throw new Error('No active tab found');
    }
    
    console.log('Starting job analysis for tab:', tab.id, tab.url);
    
    // Inject content script into the current tab
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content/content.js']
    });
    
    sendResponse({ success: true, message: 'Content script injected' });
  } catch (error) {
    console.error('Error analyzing job:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Get current configuration
async function handleGetConfig(sendResponse) {
  try {
    const data = await chrome.storage.local.get(['modelConfig', 'apiKeys']);
    sendResponse({ success: true, data });
  } catch (error) {
    console.error('Error getting config:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Save configuration
async function handleSaveConfig(config, sendResponse) {
  try {
    await chrome.storage.local.set(config);
    console.log('Configuration saved:', config);
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error saving config:', error);
    sendResponse({ success: false, error: error.message });
  }
}
