const { app, BrowserWindow, BrowserView, ipcMain, session, webContents, shell } = require('electron');
const path = require('path');
const { AIEngine } = require('./ai-engine/AIEngine');
const { DataCollector } = require('./data-collectors/DataCollector');
const { SecurityManager } = require('./security/SecurityManager');
const { PersonalizationEngine } = require('./ai-engine/PersonalizationEngine');
const { RealTimeAnalyzer } = require('./ai-engine/RealTimeAnalyzer');
const { TabManager } = require('./browser/TabManager');
const { ContextualAI } = require('./ai-engine/ContextualAI');
const { setupIPC } = require('./ipc/ipcHandlers');

class NexusBrowser {
  constructor() {
    this.mainWindow = null;
    this.aiEngine = new AIEngine();
    this.dataCollector = new DataCollector();
    this.securityManager = new SecurityManager();
    this.personalizationEngine = new PersonalizationEngine();
    this.realTimeAnalyzer = new RealTimeAnalyzer();
    this.activeTabs = new Map();
    this.userProfile = null;
  }

  async init() {
    await app.whenReady();
    
    // Initialize AI components
    await this.aiEngine.initialize();
    await this.personalizationEngine.initialize();
    await this.realTimeAnalyzer.initialize();
    
    // Setup security
    this.securityManager.setupSecurityPolicies();
    
    // Create main window
    this.createWindow();
    
    // Setup IPC handlers
    setupIPC(this);
    
    // Setup session handlers for data collection
    this.setupSessionHandlers();
    
    // Load user profile
    await this.loadUserProfile();
    
    console.log('🚀 Nexus AI Browser initialized successfully!');
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 800,
      minHeight: 600,
      titleBarStyle: 'hiddenInset',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, '../renderer/preload.js'),
        webSecurity: true,
        allowRunningInsecureContent: false
      },
      show: false
    });

    // Load the renderer
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/build/index.html'));
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      this.mainWindow.focus();
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  setupSessionHandlers() {
    const ses = session.defaultSession;
    
    // Intercept all web requests for data collection
    ses.webRequest.onBeforeRequest((details, callback) => {
      this.dataCollector.recordWebRequest(details);
      callback({});
    });

    // Monitor page navigation
    ses.webRequest.onCompleted((details) => {
      if (details.resourceType === 'mainFrame') {
        this.handlePageNavigation(details);
      }
    });

    // Content security and filtering
    ses.webRequest.onBeforeSendHeaders((details, callback) => {
      const modifiedHeaders = this.securityManager.filterHeaders(details.requestHeaders);
      callback({ requestHeaders: modifiedHeaders });
    });
  }

  async handlePageNavigation(details) {
    const tabId = details.webContentsId;
    const url = details.url;
    
    // Collect page data
    const pageData = await this.dataCollector.collectPageData(url, tabId);
    
    // Analyze in real-time
    const analysis = await this.realTimeAnalyzer.analyzePage(pageData);
    
    // Update personalization
    await this.personalizationEngine.updateFromPageVisit(pageData, analysis);
    
    // Send insights to renderer
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('page-analysis', {
        tabId,
        url,
        analysis,
        suggestions: await this.generateSmartSuggestions(analysis)
      });
    }
  }

  async generateSmartSuggestions(analysis) {
    return await this.aiEngine.generateSuggestions({
      pageAnalysis: analysis,
      userProfile: this.userProfile,
      context: await this.getContextualData()
    });
  }

  async getContextualData() {
    return {
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      recentActivity: await this.dataCollector.getRecentActivity(24), // last 24 hours
      currentMood: await this.realTimeAnalyzer.inferUserMood(),
      activeProjects: await this.personalizationEngine.getActiveProjects()
    };
  }

  async loadUserProfile() {
    this.userProfile = await this.personalizationEngine.getUserProfile();
  }

  // Public methods for IPC handlers
  async createNewTab(url = 'nexus://newtab') {
    const tabId = Date.now().toString();
    const tabData = {
      id: tabId,
      url,
      title: 'New Tab',
      favicon: null,
      loading: true,
      active: true
    };
    
    this.activeTabs.set(tabId, tabData);
    return tabData;
  }

  async getAIInsights(query) {
    return await this.aiEngine.processQuery(query, {
      userProfile: this.userProfile,
      context: await this.getContextualData()
    });
  }

  async getPersonalizedContent() {
    return await this.personalizationEngine.getPersonalizedContent();
  }
}

// Global instance
const nexusBrowser = new NexusBrowser();

// App event handlers
app.whenReady().then(() => {
  nexusBrowser.init();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    nexusBrowser.createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationURL) => {
    navigationEvent.preventDefault();
    // Handle new window creation through our tab system
    nexusBrowser.createNewTab(navigationURL);
  });
});

module.exports = { nexusBrowser };

