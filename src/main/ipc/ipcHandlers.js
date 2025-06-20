const { ipcMain } = require('electron');

function setupIPC(nexusBrowser) {
  console.log('🔗 Setting up IPC handlers...');

  // AI and Analysis
  ipcMain.handle('ai:processQuery', async (event, query, context) => {
    try {
      return await nexusBrowser.getAIInsights(query, context);
    } catch (error) {
      console.error('Error processing AI query:', error);
      return { error: 'Failed to process query' };
    }
  });

  ipcMain.handle('ai:getPersonalizedContent', async (event) => {
    try {
      return await nexusBrowser.getPersonalizedContent();
    } catch (error) {
      console.error('Error getting personalized content:', error);
      return { error: 'Failed to get personalized content' };
    }
  });

  ipcMain.handle('ai:analyzePage', async (event, pageData) => {
    try {
      return await nexusBrowser.realTimeAnalyzer.analyzePage(pageData);
    } catch (error) {
      console.error('Error analyzing page:', error);
      return { error: 'Failed to analyze page' };
    }
  });

  // Tab Management
  ipcMain.handle('tabs:create', async (event, url) => {
    try {
      return await nexusBrowser.createNewTab(url);
    } catch (error) {
      console.error('Error creating tab:', error);
      return { error: 'Failed to create tab' };
    }
  });

  ipcMain.handle('tabs:close', async (event, tabId) => {
    try {
      nexusBrowser.activeTabs.delete(tabId);
      return { success: true };
    } catch (error) {
      console.error('Error closing tab:', error);
      return { error: 'Failed to close tab' };
    }
  });

  ipcMain.handle('tabs:getAll', async (event) => {
    try {
      return Array.from(nexusBrowser.activeTabs.values());
    } catch (error) {
      console.error('Error getting tabs:', error);
      return [];
    }
  });

  ipcMain.handle('tabs:navigate', async (event, tabId, url) => {
    try {
      const tab = nexusBrowser.activeTabs.get(tabId);
      if (tab) {
        tab.url = url;
        tab.loading = true;
        nexusBrowser.activeTabs.set(tabId, tab);
        return { success: true };
      }
      return { error: 'Tab not found' };
    } catch (error) {
      console.error('Error navigating tab:', error);
      return { error: 'Failed to navigate tab' };
    }
  });

  // Data Collection
  ipcMain.handle('data:getRecentActivity', async (event, hours) => {
    try {
      return await nexusBrowser.dataCollector.getRecentActivity(hours);
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return { error: 'Failed to get recent activity' };
    }
  });

  ipcMain.handle('data:getBehaviorMetrics', async (event) => {
    try {
      return await nexusBrowser.dataCollector.getBehaviorMetrics();
    } catch (error) {
      console.error('Error getting behavior metrics:', error);
      return { error: 'Failed to get behavior metrics' };
    }
  });

  ipcMain.handle('data:recordInteraction', async (event, type, target, data, pageUrl) => {
    try {
      await nexusBrowser.dataCollector.recordInteraction(type, target, data, pageUrl);
      return { success: true };
    } catch (error) {
      console.error('Error recording interaction:', error);
      return { error: 'Failed to record interaction' };
    }
  });

  // Personalization
  ipcMain.handle('personalization:getUserProfile', async (event) => {
    try {
      return await nexusBrowser.personalizationEngine.getUserProfile();
    } catch (error) {
      console.error('Error getting user profile:', error);
      return { error: 'Failed to get user profile' };
    }
  });

  ipcMain.handle('personalization:getAdaptiveSettings', async (event) => {
    try {
      const personalizedContent = await nexusBrowser.personalizationEngine.getPersonalizedContent();
      return personalizedContent.adaptiveInterface;
    } catch (error) {
      console.error('Error getting adaptive settings:', error);
      return { error: 'Failed to get adaptive settings' };
    }
  });

  ipcMain.handle('personalization:updatePreference', async (event, category, preference, value) => {
    try {
      // Update user preference
      await nexusBrowser.personalizationEngine.recordInteraction('preference_update', {
        category,
        preference,
        value,
        timestamp: Date.now()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating preference:', error);
      return { error: 'Failed to update preference' };
    }
  });

  // Real-time Analysis
  ipcMain.handle('analysis:getUserMood', async (event) => {
    try {
      return await nexusBrowser.realTimeAnalyzer.inferUserMood();
    } catch (error) {
      console.error('Error getting user mood:', error);
      return { mood: 'neutral', confidence: 0.5 };
    }
  });

  ipcMain.handle('analysis:getContextualData', async (event) => {
    try {
      return await nexusBrowser.getContextualData();
    } catch (error) {
      console.error('Error getting contextual data:', error);
      return { error: 'Failed to get contextual data' };
    }
  });

  // Search and Navigation
  ipcMain.handle('search:query', async (event, query, options) => {
    try {
      // Process search query with AI enhancement
      const aiEnhancedQuery = await nexusBrowser.aiEngine.processQuery(query, {
        userProfile: nexusBrowser.userProfile,
        context: await nexusBrowser.getContextualData(),
        searchContext: true
      });
      
      return {
        originalQuery: query,
        enhancedQuery: aiEnhancedQuery.response.text,
        suggestions: aiEnhancedQuery.suggestions,
        intent: aiEnhancedQuery.intent,
        relatedContent: aiEnhancedQuery.relatedContent
      };
    } catch (error) {
      console.error('Error processing search query:', error);
      return { error: 'Failed to process search query' };
    }
  });

  ipcMain.handle('search:getSuggestions', async (event, partialQuery) => {
    try {
      // Get AI-powered search suggestions
      const suggestions = await nexusBrowser.aiEngine.generateSuggestions({
        partialQuery,
        userProfile: nexusBrowser.userProfile,
        context: await nexusBrowser.getContextualData()
      });
      
      return suggestions;
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  });

  // Bookmarks and History
  ipcMain.handle('bookmarks:add', async (event, url, title, tags) => {
    try {
      // Record bookmark with AI categorization
      const analysis = await nexusBrowser.realTimeAnalyzer.analyzePage({ url, title });
      
      await nexusBrowser.dataCollector.recordInteraction('bookmark_add', 'bookmark', {
        url,
        title,
        tags: tags || [],
        category: analysis.content?.category?.primary,
        aiTags: analysis.content?.keywords?.slice(0, 5).map(k => k.word),
        timestamp: Date.now()
      });
      
      return { success: true, aiTags: analysis.content?.keywords?.slice(0, 5).map(k => k.word) };
    } catch (error) {
      console.error('Error adding bookmark:', error);
      return { error: 'Failed to add bookmark' };
    }
  });

  ipcMain.handle('history:getSmartHistory', async (event, options) => {
    try {
      const recentActivity = await nexusBrowser.dataCollector.getRecentActivity(options?.hours || 24);
      const personalizedContent = await nexusBrowser.personalizationEngine.getPersonalizedContent();
      
      // Combine and rank history items with AI
      const smartHistory = {
        recentPages: recentActivity.pageViews.slice(0, 20),
        frequentPages: recentActivity.mostVisitedPages,
        recommendedPages: personalizedContent.personalizedSuggestions,
        patterns: recentActivity.activityPattern
      };
      
      return smartHistory;
    } catch (error) {
      console.error('Error getting smart history:', error);
      return { error: 'Failed to get smart history' };
    }
  });

  // Settings and Preferences
  ipcMain.handle('settings:get', async (event, category) => {
    try {
      // Get user settings with AI-recommended optimizations
      const userProfile = await nexusBrowser.personalizationEngine.getUserProfile();
      const personalizedContent = await nexusBrowser.personalizationEngine.getPersonalizedContent();
      
      return {
        userProfile,
        adaptiveSettings: personalizedContent.adaptiveInterface,
        aiRecommendations: await nexusBrowser.generateSettingsRecommendations()
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return { error: 'Failed to get settings' };
    }
  });

  ipcMain.handle('settings:update', async (event, settings) => {
    try {
      // Update settings and learn from user preferences
      await nexusBrowser.personalizationEngine.recordInteraction('settings_update', settings);
      return { success: true };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { error: 'Failed to update settings' };
    }
  });

  // AI Assistant
  ipcMain.handle('assistant:chat', async (event, message, context) => {
    try {
      const response = await nexusBrowser.aiEngine.processQuery(message, {
        userProfile: nexusBrowser.userProfile,
        context: {
          ...await nexusBrowser.getContextualData(),
          ...context
        },
        conversational: true
      });
      
      return response;
    } catch (error) {
      console.error('Error in AI chat:', error);
      return { error: 'Failed to process chat message' };
    }
  });

  ipcMain.handle('assistant:getProactiveInsights', async (event) => {
    try {
      const contextualData = await nexusBrowser.getContextualData();
      const userMood = await nexusBrowser.realTimeAnalyzer.inferUserMood();
      const recentActivity = await nexusBrowser.dataCollector.getRecentActivity(2);
      
      const insights = await nexusBrowser.aiEngine.generateSuggestions({
        context: contextualData,
        userMood,
        recentActivity,
        proactive: true
      });
      
      return insights;
    } catch (error) {
      console.error('Error getting proactive insights:', error);
      return [];
    }
  });

  // Performance and Analytics
  ipcMain.handle('analytics:getPerformanceMetrics', async (event) => {
    try {
      return {
        aiEngine: nexusBrowser.aiEngine.analysisMetrics,
        dataCollection: nexusBrowser.dataCollector.realtimeMetrics,
        personalization: {
          totalInteractions: await nexusBrowser.personalizationEngine.db.interactions.count(),
          userProfile: nexusBrowser.userProfile
        }
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return { error: 'Failed to get performance metrics' };
    }
  });

  // Privacy and Security
  ipcMain.handle('privacy:getDataSummary', async (event) => {
    try {
      const summary = {
        dataRetentionPeriod: nexusBrowser.dataCollector.privacySettings.retentionPeriod,
        anonymizationEnabled: nexusBrowser.dataCollector.privacySettings.anonymizeData,
        encryptionEnabled: nexusBrowser.dataCollector.privacySettings.encryptSensitiveData,
        totalStoredData: {
          pageViews: await nexusBrowser.dataCollector.db.pageViews.count(),
          interactions: await nexusBrowser.dataCollector.db.interactions.count(),
          sessions: await nexusBrowser.dataCollector.db.sessions.count()
        }
      };
      
      return summary;
    } catch (error) {
      console.error('Error getting privacy data summary:', error);
      return { error: 'Failed to get privacy data summary' };
    }
  });

  ipcMain.handle('privacy:clearData', async (event, options) => {
    try {
      if (options.clearAll) {
        await nexusBrowser.dataCollector.db.delete();
        await nexusBrowser.personalizationEngine.db.delete();
      } else {
        const cutoffTime = Date.now() - (options.days * 24 * 60 * 60 * 1000);
        
        if (options.pageViews) {
          await nexusBrowser.dataCollector.db.pageViews.where('timestamp').below(cutoffTime).delete();
        }
        if (options.interactions) {
          await nexusBrowser.dataCollector.db.interactions.where('timestamp').below(cutoffTime).delete();
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error clearing data:', error);
      return { error: 'Failed to clear data' };
    }
  });

  // Error Handling
  ipcMain.handle('error:report', async (event, errorData) => {
    try {
      await nexusBrowser.dataCollector.db.errorLogs.add({
        timestamp: Date.now(),
        type: errorData.type || 'unknown',
        message: errorData.message,
        stack: errorData.stack,
        url: errorData.url || 'unknown'
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error reporting error:', error);
      return { error: 'Failed to report error' };
    }
  });

  // Window Management
  ipcMain.handle('window:minimize', async (event) => {
    nexusBrowser.mainWindow.minimize();
    return { success: true };
  });

  ipcMain.handle('window:maximize', async (event) => {
    if (nexusBrowser.mainWindow.isMaximized()) {
      nexusBrowser.mainWindow.unmaximize();
    } else {
      nexusBrowser.mainWindow.maximize();
    }
    return { success: true };
  });

  ipcMain.handle('window:close', async (event) => {
    nexusBrowser.mainWindow.close();
    return { success: true };
  });

  console.log('✅ IPC handlers setup complete');
}

module.exports = { setupIPC };

