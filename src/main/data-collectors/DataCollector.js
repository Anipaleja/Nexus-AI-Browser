const cheerio = require('cheerio');
const { URL } = require('url');
const axios = require('axios');
const crypto = require('crypto-js');
const Dexie = require('dexie');

class DataCollector {
  constructor() {
    this.db = null;
    this.sessionData = {
      startTime: Date.now(),
      sessionId: this.generateSessionId(),
      pageViews: [],
      interactions: [],
      scrollEvents: [],
      clickEvents: [],
      keyboardEvents: [],
      mouseMovements: []
    };
    
    this.realtimeMetrics = {
      activeTabCount: 0,
      totalTimeSpent: 0,
      totalPageViews: 0,
      averageSessionLength: 0,
      bounceRate: 0
    };
    
    this.privacySettings = {
      collectPersonalData: false,
      anonymizeData: true,
      encryptSensitiveData: true,
      retentionPeriod: 30 // days
    };
    
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('📈 Initializing DataCollector...');
      
      // Initialize database
      await this.initializeDatabase();
      
      // Start data collection
      this.startDataCollection();
      
      this.isInitialized = true;
      console.log('✅ DataCollector initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize DataCollector:', error);
      throw error;
    }
  }

  async initializeDatabase() {
    this.db = new Dexie('NexusDataCollectionDB');
    
    this.db.version(1).stores({
      pageViews: '++id, url, title, timestamp, duration, scrollDepth, interactionCount',
      interactions: '++id, type, target, timestamp, pageUrl, data',
      sessions: '++id, sessionId, startTime, endTime, totalPageViews, totalInteractions',
      behaviorMetrics: '++id, timestamp, metric, value, context',
      webRequests: '++id, url, method, timestamp, resourceType, size, loadTime',
      performanceMetrics: '++id, url, timestamp, loadTime, renderTime, interactivityTime',
      errorLogs: '++id, timestamp, type, message, stack, url',
      userPreferences: '++id, category, preference, value, timestamp'
    });
    
    await this.db.open();
  }

  generateSessionId() {
    return crypto.MD5(Date.now().toString() + Math.random().toString()).toString();
  }

  async recordWebRequest(details) {
    if (!this.isInitialized) return;
    
    try {
      const requestData = {
        url: details.url,
        method: details.method,
        timestamp: Date.now(),
        resourceType: details.resourceType || 'other',
        size: details.contentLength || 0,
        loadTime: 0 // Will be updated on completion
      };
      
      // Store in database
      await this.db.webRequests.add(requestData);
      
      // Update real-time metrics
      this.updateRealtimeMetrics('webRequest', requestData);
      
    } catch (error) {
      console.error('Error recording web request:', error);
    }
  }

  async collectPageData(url, tabId) {
    if (!this.isInitialized) return null;
    
    try {
      const pageData = {
        url,
        tabId,
        timestamp: Date.now(),
        title: await this.extractPageTitle(url),
        content: await this.extractPageContent(url),
        html: await this.getPageHTML(url),
        metadata: await this.extractPageMetadata(url),
        performance: await this.collectPerformanceMetrics(url),
        interactions: await this.getPageInteractions(url),
        scrollData: await this.getScrollData(url),
        timeSpent: await this.calculateTimeSpent(url),
        userBehavior: await this.analyzeBehaviorPattern(url)
      };
      
      // Store page view
      await this.storePageView(pageData);
      
      return pageData;
    } catch (error) {
      console.error('Error collecting page data:', error);
      return this.createFallbackPageData(url, tabId);
    }
  }

  async extractPageTitle(url) {
    try {
      // In a real implementation, this would extract from the actual page
      // For now, we'll simulate based on URL
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname;
    } catch (error) {
      return 'Unknown Page';
    }
  }

  async extractPageContent(url) {
    try {
      // This would normally extract actual page content
      // For demo purposes, we'll simulate content extraction
      return {
        textContent: 'Sample page content would be extracted here',
        wordCount: 150,
        readingTime: 2,
        language: 'en',
        encoding: 'utf-8'
      };
    } catch (error) {
      return {
        textContent: '',
        wordCount: 0,
        readingTime: 0,
        language: 'unknown',
        encoding: 'utf-8'
      };
    }
  }

  async getPageHTML(url) {
    try {
      // In a real browser extension, this would get actual HTML
      // For demo, we'll simulate HTML structure analysis
      return '<html><head><title>Sample</title></head><body><h1>Sample Content</h1></body></html>';
    } catch (error) {
      return '';
    }
  }

  async extractPageMetadata(url) {
    try {
      // Extract metadata from page
      return {
        description: 'Sample page description',
        keywords: ['sample', 'page', 'content'],
        author: 'Unknown',
        publishDate: null,
        lastModified: new Date().toISOString(),
        canonical: url,
        openGraph: {
          title: 'Sample Page',
          description: 'Sample description',
          image: null,
          type: 'website'
        },
        schema: null
      };
    } catch (error) {
      return {};
    }
  }

  async collectPerformanceMetrics(url) {
    try {
      // Collect web performance metrics
      const metrics = {
        loadTime: Math.random() * 3000 + 500, // Simulated load time
        domContentLoaded: Math.random() * 2000 + 300,
        firstContentfulPaint: Math.random() * 1500 + 200,
        largestContentfulPaint: Math.random() * 2500 + 800,
        firstInputDelay: Math.random() * 100,
        cumulativeLayoutShift: Math.random() * 0.1,
        timeToInteractive: Math.random() * 3000 + 1000
      };
      
      // Store performance data
      await this.db.performanceMetrics.add({
        url,
        timestamp: Date.now(),
        ...metrics
      });
      
      return metrics;
    } catch (error) {
      console.error('Error collecting performance metrics:', error);
      return {};
    }
  }

  async getPageInteractions(url) {
    try {
      // Get interactions for specific page
      const interactions = await this.db.interactions
        .where('pageUrl')
        .equals(url)
        .and(interaction => interaction.timestamp > Date.now() - 3600000) // Last hour
        .toArray();
      
      return {
        totalInteractions: interactions.length,
        clickCount: interactions.filter(i => i.type === 'click').length,
        scrollCount: interactions.filter(i => i.type === 'scroll').length,
        keyboardCount: interactions.filter(i => i.type === 'keyboard').length,
        mouseMovements: interactions.filter(i => i.type === 'mousemove').length,
        interactionDensity: this.calculateInteractionDensity(interactions)
      };
    } catch (error) {
      return {
        totalInteractions: 0,
        clickCount: 0,
        scrollCount: 0,
        keyboardCount: 0,
        mouseMovements: 0,
        interactionDensity: 0
      };
    }
  }

  async getScrollData(url) {
    try {
      const scrollEvents = await this.db.interactions
        .where('pageUrl')
        .equals(url)
        .and(interaction => interaction.type === 'scroll')
        .toArray();
      
      if (scrollEvents.length === 0) {
        return {
          maxScrollDepth: 0,
          averageScrollSpeed: 0,
          scrollDirection: 'none',
          pausePoints: []
        };
      }
      
      const scrollData = scrollEvents.map(event => JSON.parse(event.data));
      const maxScrollDepth = Math.max(...scrollData.map(d => d.scrollPercentage || 0));
      
      return {
        maxScrollDepth,
        averageScrollSpeed: this.calculateAverageScrollSpeed(scrollData),
        scrollDirection: this.determineScrollDirection(scrollData),
        pausePoints: this.identifyScrollPausePoints(scrollData)
      };
    } catch (error) {
      return {
        maxScrollDepth: 0,
        averageScrollSpeed: 0,
        scrollDirection: 'none',
        pausePoints: []
      };
    }
  }

  async calculateTimeSpent(url) {
    try {
      const pageViews = await this.db.pageViews
        .where('url')
        .equals(url)
        .toArray();
      
      if (pageViews.length === 0) return 0;
      
      return pageViews.reduce((total, view) => total + (view.duration || 0), 0);
    } catch (error) {
      return 0;
    }
  }

  async analyzeBehaviorPattern(url) {
    try {
      const recentInteractions = await this.db.interactions
        .where('pageUrl')
        .equals(url)
        .and(interaction => interaction.timestamp > Date.now() - 1800000) // Last 30 minutes
        .toArray();
      
      return {
        engagementLevel: this.calculateEngagementLevel(recentInteractions),
        attentionPattern: this.analyzeAttentionPattern(recentInteractions),
        navigationPattern: this.analyzeNavigationPattern(recentInteractions),
        interactionRhythm: this.analyzeInteractionRhythm(recentInteractions)
      };
    } catch (error) {
      return {
        engagementLevel: 0.5,
        attentionPattern: 'unknown',
        navigationPattern: 'unknown',
        interactionRhythm: 'unknown'
      };
    }
  }

  async storePageView(pageData) {
    try {
      await this.db.pageViews.add({
        url: pageData.url,
        title: pageData.title,
        timestamp: pageData.timestamp,
        duration: pageData.timeSpent || 0,
        scrollDepth: pageData.scrollData?.maxScrollDepth || 0,
        interactionCount: pageData.interactions?.totalInteractions || 0
      });
      
      // Update session data
      this.sessionData.pageViews.push(pageData);
      this.updateRealtimeMetrics('pageView', pageData);
      
    } catch (error) {
      console.error('Error storing page view:', error);
    }
  }

  async recordInteraction(type, target, data, pageUrl) {
    if (!this.isInitialized) return;
    
    try {
      const interaction = {
        type,
        target,
        timestamp: Date.now(),
        pageUrl,
        data: JSON.stringify(data || {})
      };
      
      // Store in database
      await this.db.interactions.add(interaction);
      
      // Add to session data
      this.sessionData.interactions.push(interaction);
      
      // Update real-time metrics
      this.updateRealtimeMetrics('interaction', interaction);
      
    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  }

  async getRecentActivity(hours = 24) {
    try {
      const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
      
      const recentPageViews = await this.db.pageViews
        .where('timestamp')
        .above(cutoffTime)
        .toArray();
      
      const recentInteractions = await this.db.interactions
        .where('timestamp')
        .above(cutoffTime)
        .toArray();
      
      return {
        pageViews: recentPageViews,
        interactions: recentInteractions,
        totalTimeSpent: recentPageViews.reduce((total, view) => total + (view.duration || 0), 0),
        mostVisitedPages: this.getMostVisitedPages(recentPageViews),
        activityPattern: this.analyzeActivityPattern(recentPageViews, recentInteractions)
      };
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return {
        pageViews: [],
        interactions: [],
        totalTimeSpent: 0,
        mostVisitedPages: [],
        activityPattern: 'unknown'
      };
    }
  }

  async getBehaviorMetrics() {
    try {
      const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
      
      const metrics = await this.db.behaviorMetrics
        .where('timestamp')
        .above(last24Hours)
        .toArray();
      
      return {
        averageSessionLength: this.calculateAverageSessionLength(metrics),
        bounceRate: this.calculateBounceRate(metrics),
        engagementScore: this.calculateEngagementScore(metrics),
        attentionSpan: this.calculateAttentionSpan(metrics),
        navigationEfficiency: this.calculateNavigationEfficiency(metrics)
      };
    } catch (error) {
      return {
        averageSessionLength: 0,
        bounceRate: 0,
        engagementScore: 0.5,
        attentionSpan: 0,
        navigationEfficiency: 0.5
      };
    }
  }

  // Real-time data collection methods
  startDataCollection() {
    // Start periodic data collection
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Every 30 seconds
    
    setInterval(() => {
      this.cleanupOldData();
    }, 3600000); // Every hour
    
    setInterval(() => {
      this.updateSessionMetrics();
    }, 60000); // Every minute
  }

  async collectSystemMetrics() {
    try {
      const metrics = {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        timestamp: Date.now(),
        activeTabCount: this.realtimeMetrics.activeTabCount
      };
      
      await this.db.behaviorMetrics.add({
        timestamp: Date.now(),
        metric: 'system_performance',
        value: JSON.stringify(metrics),
        context: 'system'
      });
    } catch (error) {
      console.error('Error collecting system metrics:', error);
    }
  }

  async cleanupOldData() {
    try {
      const retentionPeriod = this.privacySettings.retentionPeriod * 24 * 60 * 60 * 1000;
      const cutoffTime = Date.now() - retentionPeriod;
      
      // Clean up old page views
      await this.db.pageViews.where('timestamp').below(cutoffTime).delete();
      
      // Clean up old interactions
      await this.db.interactions.where('timestamp').below(cutoffTime).delete();
      
      // Clean up old metrics
      await this.db.behaviorMetrics.where('timestamp').below(cutoffTime).delete();
      
      console.log('🧩 Cleaned up old data');
    } catch (error) {
      console.error('Error cleaning up old data:', error);
    }
  }

  updateSessionMetrics() {
    this.realtimeMetrics.totalTimeSpent = Date.now() - this.sessionData.startTime;
    this.realtimeMetrics.totalPageViews = this.sessionData.pageViews.length;
    this.realtimeMetrics.averageSessionLength = this.calculateCurrentSessionLength();
  }

  updateRealtimeMetrics(type, data) {
    switch (type) {
      case 'pageView':
        this.realtimeMetrics.totalPageViews++;
        break;
      case 'interaction':
        // Update interaction-based metrics
        break;
      case 'webRequest':
        // Update network-based metrics
        break;
    }
  }

  // Analysis helper methods
  calculateEngagementLevel(interactions) {
    if (interactions.length === 0) return 0;
    
    const engagementTypes = {
      'click': 1.0,
      'scroll': 0.5,
      'keyboard': 0.8,
      'mousemove': 0.2
    };
    
    const totalEngagement = interactions.reduce((total, interaction) => {
      return total + (engagementTypes[interaction.type] || 0);
    }, 0);
    
    return Math.min(1.0, totalEngagement / (interactions.length * 0.7));
  }

  analyzeAttentionPattern(interactions) {
    if (interactions.length < 5) return 'insufficient_data';
    
    const timeGaps = [];
    for (let i = 1; i < interactions.length; i++) {
      timeGaps.push(interactions[i].timestamp - interactions[i-1].timestamp);
    }
    
    const averageGap = timeGaps.reduce((sum, gap) => sum + gap, 0) / timeGaps.length;
    
    if (averageGap < 2000) return 'focused';
    if (averageGap < 5000) return 'engaged';
    if (averageGap < 10000) return 'moderate';
    return 'distracted';
  }

  analyzeNavigationPattern(interactions) {
    const clickInteractions = interactions.filter(i => i.type === 'click');
    
    if (clickInteractions.length === 0) return 'passive';
    if (clickInteractions.length > 10) return 'active';
    return 'moderate';
  }

  analyzeInteractionRhythm(interactions) {
    if (interactions.length < 3) return 'unknown';
    
    const intervals = [];
    for (let i = 1; i < interactions.length; i++) {
      intervals.push(interactions[i].timestamp - interactions[i-1].timestamp);
    }
    
    const variance = this.calculateVariance(intervals);
    
    if (variance < 1000000) return 'steady'; // Low variance
    if (variance < 5000000) return 'variable';
    return 'erratic';
  }

  calculateVariance(numbers) {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  calculateInteractionDensity(interactions) {
    if (interactions.length === 0) return 0;
    
    const timeSpan = Math.max(...interactions.map(i => i.timestamp)) - Math.min(...interactions.map(i => i.timestamp));
    
    if (timeSpan === 0) return interactions.length;
    
    return (interactions.length / timeSpan) * 1000; // Interactions per second * 1000
  }

  calculateAverageScrollSpeed(scrollData) {
    if (scrollData.length < 2) return 0;
    
    let totalSpeed = 0;
    let speedCount = 0;
    
    for (let i = 1; i < scrollData.length; i++) {
      const timeDiff = scrollData[i].timestamp - scrollData[i-1].timestamp;
      const scrollDiff = Math.abs(scrollData[i].scrollY - scrollData[i-1].scrollY);
      
      if (timeDiff > 0) {
        totalSpeed += scrollDiff / timeDiff;
        speedCount++;
      }
    }
    
    return speedCount > 0 ? totalSpeed / speedCount : 0;
  }

  determineScrollDirection(scrollData) {
    if (scrollData.length < 2) return 'none';
    
    let downwardCount = 0;
    let upwardCount = 0;
    
    for (let i = 1; i < scrollData.length; i++) {
      const diff = scrollData[i].scrollY - scrollData[i-1].scrollY;
      if (diff > 0) downwardCount++;
      else if (diff < 0) upwardCount++;
    }
    
    if (downwardCount > upwardCount * 2) return 'downward';
    if (upwardCount > downwardCount * 2) return 'upward';
    return 'mixed';
  }

  identifyScrollPausePoints(scrollData) {
    const pausePoints = [];
    const pauseThreshold = 1000; // 1 second
    
    for (let i = 1; i < scrollData.length; i++) {
      const timeDiff = scrollData[i].timestamp - scrollData[i-1].timestamp;
      if (timeDiff > pauseThreshold) {
        pausePoints.push({
          position: scrollData[i-1].scrollPercentage,
          duration: timeDiff
        });
      }
    }
    
    return pausePoints;
  }

  getMostVisitedPages(pageViews) {
    const urlCounts = {};
    
    pageViews.forEach(view => {
      urlCounts[view.url] = (urlCounts[view.url] || 0) + 1;
    });
    
    return Object.entries(urlCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([url, count]) => ({ url, count }));
  }

  analyzeActivityPattern(pageViews, interactions) {
    const hourlyActivity = new Array(24).fill(0);
    
    [...pageViews, ...interactions].forEach(item => {
      const hour = new Date(item.timestamp).getHours();
      hourlyActivity[hour]++;
    });
    
    const peakHour = hourlyActivity.indexOf(Math.max(...hourlyActivity));
    
    if (peakHour >= 9 && peakHour <= 17) return 'business_hours';
    if (peakHour >= 18 && peakHour <= 22) return 'evening';
    if (peakHour >= 6 && peakHour <= 8) return 'morning';
    return 'night_owl';
  }

  calculateCurrentSessionLength() {
    return Date.now() - this.sessionData.startTime;
  }

  createFallbackPageData(url, tabId) {
    return {
      url,
      tabId,
      timestamp: Date.now(),
      title: 'Unknown Page',
      content: { textContent: '', wordCount: 0 },
      html: '',
      metadata: {},
      performance: {},
      interactions: { totalInteractions: 0 },
      scrollData: { maxScrollDepth: 0 },
      timeSpent: 0,
      userBehavior: { engagementLevel: 0.5 },
      error: true
    };
  }

  // Privacy and security methods
  async anonymizeData(data) {
    if (!this.privacySettings.anonymizeData) return data;
    
    // Remove personally identifiable information
    const anonymized = { ...data };
    
    // Hash sensitive URLs
    if (anonymized.url) {
      anonymized.url = this.hashSensitiveURL(anonymized.url);
    }
    
    // Remove user-specific content
    if (anonymized.content) {
      anonymized.content = this.sanitizeContent(anonymized.content);
    }
    
    return anonymized;
  }

  hashSensitiveURL(url) {
    try {
      const urlObj = new URL(url);
      
      // Keep domain but hash path and query
      if (urlObj.pathname !== '/' || urlObj.search) {
        const sensitivePartHash = crypto.MD5(urlObj.pathname + urlObj.search).toString();
        return `${urlObj.protocol}//${urlObj.hostname}/${sensitivePartHash}`;
      }
      
      return url;
    } catch (error) {
      return crypto.MD5(url).toString();
    }
  }

  sanitizeContent(content) {
    // Remove potential PII from content
    const sanitized = { ...content };
    
    if (sanitized.textContent) {
      // Remove email addresses, phone numbers, etc.
      sanitized.textContent = sanitized.textContent
        .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
        .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE]')
        .replace(/\b\d{3}\.\d{3}\.\d{4}\b/g, '[PHONE]');
    }
    
    return sanitized;
  }

  // Cleanup and shutdown
  async shutdown() {
    try {
      // Save final session data
      await this.db.sessions.add({
        sessionId: this.sessionData.sessionId,
        startTime: this.sessionData.startTime,
        endTime: Date.now(),
        totalPageViews: this.sessionData.pageViews.length,
        totalInteractions: this.sessionData.interactions.length
      });
      
      // Close database
      await this.db.close();
      
      console.log('📋 DataCollector shutdown complete');
    } catch (error) {
      console.error('Error during DataCollector shutdown:', error);
    }
  }
}

module.exports = { DataCollector };

