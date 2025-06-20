const { BrowserView, BrowserWindow, session, shell } = require('electron');
const { URL } = require('url');
const path = require('path');

class TabManager {
  constructor(mainWindow, aiEngine, dataCollector) {
    this.mainWindow = mainWindow;
    this.aiEngine = aiEngine;
    this.dataCollector = dataCollector;
    this.tabs = new Map();
    this.activeTabId = null;
    this.tabCounter = 0;
    this.UI_HEIGHT = 120; // Height for UI elements (address bar, etc.)
  }

  createTab(url = 'https://www.google.com', background = false) {
    this.tabCounter++;
    const tabId = `tab-${this.tabCounter}`;
    
    const view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        enableBlinkFeatures: '',
        disableBlinkFeatures: '',
        partition: 'persist:nexus-browser',
        preload: path.join(__dirname, '../preload/tabPreload.js')
      }
    });

    const tab = {
      id: tabId,
      view,
      url: url,
      title: 'New Tab',
      favicon: null,
      loading: true,
      canGoBack: false,
      canGoForward: false,
      aiContext: {
        pageContent: '',
        analysis: null,
        suggestions: [],
        userInteractions: []
      },
      securityInfo: {
        isSecure: false,
        certificate: null,
        permissions: []
      },
      created: Date.now(),
      lastAccessed: Date.now()
    };

    this.tabs.set(tabId, tab);
    this.setupTabEventHandlers(tab);

    if (!background) {
      this.setActiveTab(tabId);
    }

    // Navigate to URL
    if (url && url !== 'nexus://newtab') {
      this.navigateTab(tabId, url);
    } else {
      this.loadNewTabPage(tab);
    }

    this.notifyRenderer('tab-created', { tabId, tab: this.getTabInfo(tab) });
    return tabId;
  }

  setupTabEventHandlers(tab) {
    const { view, id } = tab;
    const webContents = view.webContents;

    // Page navigation events
    webContents.on('did-start-loading', () => {
      tab.loading = true;
      this.updateTab(id, { loading: true });
    });

    webContents.on('did-stop-loading', () => {
      tab.loading = false;
      this.updateTab(id, { loading: false });
    });

    webContents.on('did-finish-load', async () => {
      await this.handlePageLoad(tab);
    });

    webContents.on('did-navigate', (event, url) => {
      tab.url = url;
      tab.canGoBack = webContents.canGoBack();
      tab.canGoForward = webContents.canGoForward();
      this.updateTab(id, {
        url,
        canGoBack: tab.canGoBack,
        canGoForward: tab.canGoForward
      });
    });

    webContents.on('page-title-updated', (event, title) => {
      tab.title = title;
      this.updateTab(id, { title });
    });

    webContents.on('page-favicon-updated', (event, favicons) => {
      tab.favicon = favicons[0] || null;
      this.updateTab(id, { favicon: tab.favicon });
    });

    // Security events
    webContents.on('certificate-error', (event, url, error, certificate, callback) => {
      event.preventDefault();
      tab.securityInfo.certificate = certificate;
      tab.securityInfo.isSecure = false;
      
      // For development, accept self-signed certificates
      if (process.env.NODE_ENV === 'development') {
        callback(true);
      } else {
        callback(false);
        this.notifyRenderer('security-warning', { tabId: id, error, url });
      }
    });

    // Context menu and external links
    webContents.on('new-window', (event, navigationUrl, frameName, disposition) => {
      event.preventDefault();
      
      if (disposition === 'foreground-tab' || disposition === 'background-tab') {
        this.createTab(navigationUrl, disposition === 'background-tab');
      } else {
        shell.openExternal(navigationUrl);
      }
    });

    // AI Context Collection
    webContents.on('dom-ready', async () => {
      await this.collectPageContext(tab);
    });
  }

  async handlePageLoad(tab) {
    try {
      // Update security info
      const url = new URL(tab.url);
      tab.securityInfo.isSecure = url.protocol === 'https:';
      
      // Collect page data for AI analysis
      const pageData = await this.extractPageData(tab);
      
      // AI Analysis
      if (this.aiEngine) {
        const analysis = await this.aiEngine.analyzePage(pageData);
        tab.aiContext.analysis = analysis;
        tab.aiContext.pageContent = pageData.content;
        
        // Generate contextual suggestions
        const suggestions = await this.aiEngine.generateContextualSuggestions({
          pageData,
          analysis,
          userContext: await this.getUserContext(tab)
        });
        tab.aiContext.suggestions = suggestions;
        
        this.notifyRenderer('ai-analysis', {
          tabId: tab.id,
          analysis,
          suggestions
        });
      }
      
      // Data collection
      if (this.dataCollector) {
        await this.dataCollector.recordPageVisit({
          tabId: tab.id,
          url: tab.url,
          title: tab.title,
          timestamp: Date.now(),
          pageData
        });
      }
      
    } catch (error) {
      console.error('Error in handlePageLoad:', error);
    }
  }

  async extractPageData(tab) {
    try {
      const webContents = tab.view.webContents;
      
      // Extract page content using executeJavaScript
      const pageData = await webContents.executeJavaScript(`
        (function() {
          const getTextContent = () => {
            // Remove script and style elements
            const clonedDoc = document.cloneNode(true);
            const scripts = clonedDoc.querySelectorAll('script, style, noscript');
            scripts.forEach(el => el.remove());
            return clonedDoc.body ? clonedDoc.body.innerText : '';
          };
          
          const getMetadata = () => {
            const meta = {};
            document.querySelectorAll('meta').forEach(el => {
              const name = el.name || el.property;
              const content = el.content;
              if (name && content) {
                meta[name] = content;
              }
            });
            return meta;
          };
          
          const getLinks = () => {
            return Array.from(document.querySelectorAll('a[href]'))
              .slice(0, 50) // Limit to first 50 links
              .map(a => ({
                href: a.href,
                text: a.textContent.trim().substring(0, 100)
              }));
          };
          
          const getImages = () => {
            return Array.from(document.querySelectorAll('img[src]'))
              .slice(0, 20) // Limit to first 20 images
              .map(img => ({
                src: img.src,
                alt: img.alt || '',
                width: img.width,
                height: img.height
              }));
          };
          
          return {
            url: window.location.href,
            title: document.title,
            content: getTextContent(),
            wordCount: getTextContent().split(/\s+/).length,
            metadata: getMetadata(),
            links: getLinks(),
            images: getImages(),
            language: document.documentElement.lang || 'en',
            lastModified: document.lastModified,
            readyState: document.readyState,
            referrer: document.referrer,
            cookies: document.cookie ? document.cookie.split(';').length : 0
          };
        })()
      `);
      
      return pageData;
    } catch (error) {
      console.error('Error extracting page data:', error);
      return {
        url: tab.url,
        title: tab.title,
        content: '',
        wordCount: 0,
        metadata: {},
        links: [],
        images: [],
        error: true
      };
    }
  }

  async collectPageContext(tab) {
    try {
      const webContents = tab.view.webContents;
      
      // Inject AI context collection script
      await webContents.executeJavaScript(`
        (function() {
          // Track user interactions for AI context
          let interactions = [];
          
          const trackInteraction = (type, data) => {
            interactions.push({
              type,
              data,
              timestamp: Date.now(),
              url: window.location.href
            });
            
            // Limit stored interactions
            if (interactions.length > 100) {
              interactions = interactions.slice(-50);
            }
          };
          
          // Track clicks
          document.addEventListener('click', (e) => {
            trackInteraction('click', {
              target: e.target.tagName,
              text: e.target.textContent?.substring(0, 100),
              href: e.target.href
            });
          });
          
          // Track scroll behavior
          let scrollTimeout;
          document.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
              trackInteraction('scroll', {
                scrollY: window.scrollY,
                scrollPercentage: Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100)
              });
            }, 250);
          });
          
          // Track time spent
          const startTime = Date.now();
          window.addEventListener('beforeunload', () => {
            trackInteraction('page_exit', {
              timeSpent: Date.now() - startTime,
              scrollDepth: Math.max(0, Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100))
            });
          });
          
          // Make interactions available globally for collection
          window.__nexusInteractions = interactions;
        })()
      `);
    } catch (error) {
      console.error('Error collecting page context:', error);
    }
  }

  async getUserContext(tab) {
    return {
      currentTab: tab.id,
      openTabs: Array.from(this.tabs.keys()),
      browsixngSession: {
        startTime: Math.min(...Array.from(this.tabs.values()).map(t => t.created)),
        tabCount: this.tabs.size,
        currentDomain: this.extractDomain(tab.url)
      },
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay()
    };
  }

  navigateTab(tabId, url) {
    const tab = this.tabs.get(tabId);
    if (!tab) return false;

    // Validate and normalize URL
    const normalizedUrl = this.normalizeUrl(url);
    
    try {
      tab.view.webContents.loadURL(normalizedUrl);
      tab.url = normalizedUrl;
      tab.lastAccessed = Date.now();
      return true;
    } catch (error) {
      console.error('Navigation error:', error);
      return false;
    }
  }

  normalizeUrl(url) {
    // Handle special Nexus URLs
    if (url.startsWith('nexus://')) {
      return url;
    }
    
    // Add protocol if missing
    if (!/^https?:\/\//i.test(url)) {
      // Check if it looks like a domain
      if (url.includes('.') && !url.includes(' ')) {
        return `https://${url}`;
      } else {
        // Treat as search query
        return `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      }
    }
    
    return url;
  }

  setActiveTab(tabId) {
    const tab = this.tabs.get(tabId);
    if (!tab) return false;

    // Hide current active tab
    if (this.activeTabId) {
      const currentTab = this.tabs.get(this.activeTabId);
      if (currentTab) {
        this.mainWindow.removeBrowserView(currentTab.view);
      }
    }

    // Show new active tab
    this.activeTabId = tabId;
    tab.lastAccessed = Date.now();
    this.mainWindow.setBrowserView(tab.view);
    
    // Position the browser view
    this.resizeActiveTab();
    
    this.notifyRenderer('tab-activated', { tabId, tab: this.getTabInfo(tab) });
    return true;
  }

  resizeActiveTab() {
    if (!this.activeTabId) return;
    
    const tab = this.tabs.get(this.activeTabId);
    if (!tab) return;

    const bounds = this.mainWindow.getBounds();
    tab.view.setBounds({
      x: 0,
      y: this.UI_HEIGHT,
      width: bounds.width,
      height: bounds.height - this.UI_HEIGHT
    });
  }

  closeTab(tabId) {
    const tab = this.tabs.get(tabId);
    if (!tab) return false;

    // If closing active tab, switch to another
    if (this.activeTabId === tabId) {
      const otherTabs = Array.from(this.tabs.keys()).filter(id => id !== tabId);
      if (otherTabs.length > 0) {
        this.setActiveTab(otherTabs[otherTabs.length - 1]);
      } else {
        this.activeTabId = null;
        this.mainWindow.removeBrowserView(tab.view);
      }
    }

    // Clean up
    tab.view.webContents.destroy();
    this.tabs.delete(tabId);
    
    this.notifyRenderer('tab-closed', { tabId });
    
    // If no tabs left, create a new one
    if (this.tabs.size === 0) {
      this.createTab();
    }
    
    return true;
  }

  getAllTabs() {
    return Array.from(this.tabs.values()).map(tab => this.getTabInfo(tab));
  }

  getTabInfo(tab) {
    return {
      id: tab.id,
      url: tab.url,
      title: tab.title,
      favicon: tab.favicon,
      loading: tab.loading,
      canGoBack: tab.canGoBack,
      canGoForward: tab.canGoForward,
      isActive: tab.id === this.activeTabId,
      securityInfo: {
        isSecure: tab.securityInfo.isSecure
      },
      aiSummary: tab.aiContext.analysis?.summary,
      created: tab.created,
      lastAccessed: tab.lastAccessed
    };
  }

  updateTab(tabId, updates) {
    const tab = this.tabs.get(tabId);
    if (!tab) return;

    Object.assign(tab, updates);
    this.notifyRenderer('tab-updated', {
      tabId,
      updates,
      tab: this.getTabInfo(tab)
    });
  }

  loadNewTabPage(tab) {
    // Load custom new tab page
    const newTabUrl = `file://${path.join(__dirname, '../renderer/newtab.html')}`;
    tab.view.webContents.loadURL(newTabUrl);
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  }

  notifyRenderer(event, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(event, data);
    }
  }

  // Navigation methods
  goBack(tabId) {
    const tab = this.tabs.get(tabId);
    if (tab && tab.view.webContents.canGoBack()) {
      tab.view.webContents.goBack();
      return true;
    }
    return false;
  }

  goForward(tabId) {
    const tab = this.tabs.get(tabId);
    if (tab && tab.view.webContents.canGoForward()) {
      tab.view.webContents.goForward();
      return true;
    }
    return false;
  }

  reload(tabId, ignoreCache = false) {
    const tab = this.tabs.get(tabId);
    if (!tab) return false;

    if (ignoreCache) {
      tab.view.webContents.reloadIgnoringCache();
    } else {
      tab.view.webContents.reload();
    }
    return true;
  }

  // Cleanup
  destroy() {
    for (const tab of this.tabs.values()) {
      tab.view.webContents.destroy();
    }
    this.tabs.clear();
  }
}

module.exports = { TabManager };

