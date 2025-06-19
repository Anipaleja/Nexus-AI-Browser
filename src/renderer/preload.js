const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('nexusAPI', {
  // AI and Analysis
  ai: {
    processQuery: (query, context) => ipcRenderer.invoke('ai:processQuery', query, context),
    getPersonalizedContent: () => ipcRenderer.invoke('ai:getPersonalizedContent'),
    analyzePage: (pageData) => ipcRenderer.invoke('ai:analyzePage', pageData)
  },

  // Tab Management
  tabs: {
    create: (url) => ipcRenderer.invoke('tabs:create', url),
    close: (tabId) => ipcRenderer.invoke('tabs:close', tabId),
    getAll: () => ipcRenderer.invoke('tabs:getAll'),
    navigate: (tabId, url) => ipcRenderer.invoke('tabs:navigate', tabId, url)
  },

  // Data Collection
  data: {
    getRecentActivity: (hours) => ipcRenderer.invoke('data:getRecentActivity', hours),
    getBehaviorMetrics: () => ipcRenderer.invoke('data:getBehaviorMetrics'),
    recordInteraction: (type, target, data, pageUrl) => 
      ipcRenderer.invoke('data:recordInteraction', type, target, data, pageUrl)
  },

  // Personalization
  personalization: {
    getUserProfile: () => ipcRenderer.invoke('personalization:getUserProfile'),
    getAdaptiveSettings: () => ipcRenderer.invoke('personalization:getAdaptiveSettings'),
    updatePreference: (category, preference, value) => 
      ipcRenderer.invoke('personalization:updatePreference', category, preference, value)
  },

  // Real-time Analysis
  analysis: {
    getUserMood: () => ipcRenderer.invoke('analysis:getUserMood'),
    getContextualData: () => ipcRenderer.invoke('analysis:getContextualData')
  },

  // Search and Navigation
  search: {
    query: (query, options) => ipcRenderer.invoke('search:query', query, options),
    getSuggestions: (partialQuery) => ipcRenderer.invoke('search:getSuggestions', partialQuery)
  },

  // Bookmarks and History
  bookmarks: {
    add: (url, title, tags) => ipcRenderer.invoke('bookmarks:add', url, title, tags)
  },

  history: {
    getSmartHistory: (options) => ipcRenderer.invoke('history:getSmartHistory', options)
  },

  // Settings and Preferences
  settings: {
    get: (category) => ipcRenderer.invoke('settings:get', category),
    update: (settings) => ipcRenderer.invoke('settings:update', settings)
  },

  // AI Assistant
  assistant: {
    chat: (message, context) => ipcRenderer.invoke('assistant:chat', message, context),
    getProactiveInsights: () => ipcRenderer.invoke('assistant:getProactiveInsights')
  },

  // Performance and Analytics
  analytics: {
    getPerformanceMetrics: () => ipcRenderer.invoke('analytics:getPerformanceMetrics')
  },

  // Privacy and Security
  privacy: {
    getDataSummary: () => ipcRenderer.invoke('privacy:getDataSummary'),
    clearData: (options) => ipcRenderer.invoke('privacy:clearData', options)
  },

  // Error Handling
  error: {
    report: (errorData) => ipcRenderer.invoke('error:report', errorData)
  },

  // Window Management
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close')
  },

  // Event Listeners
  on: (channel, callback) => {
    const validChannels = [
      'page-analysis',
      'ai-insights',
      'personalization-update',
      'mood-change',
      'tab-update',
      'proactive-suggestion'
    ];
    
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, callback);
    }
  },

  off: (channel, callback) => {
    const validChannels = [
      'page-analysis',
      'ai-insights',
      'personalization-update',
      'mood-change',
      'tab-update',
      'proactive-suggestion'
    ];
    
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback);
    }
  },

  // Utility functions
  utils: {
    getVersion: () => process.versions.electron,
    getPlatform: () => process.platform,
    isOnline: () => navigator.onLine
  }
});

// Console override for better debugging
contextBridge.exposeInMainWorld('console', {
  log: (...args) => console.log('[Renderer]', ...args),
  error: (...args) => console.error('[Renderer]', ...args),
  warn: (...args) => console.warn('[Renderer]', ...args),
  info: (...args) => console.info('[Renderer]', ...args)
});

// Performance monitoring
contextBridge.exposeInMainWorld('performance', {
  now: () => performance.now(),
  mark: (name) => performance.mark(name),
  measure: (name, startMark, endMark) => performance.measure(name, startMark, endMark),
  getEntriesByType: (type) => performance.getEntriesByType(type)
});

