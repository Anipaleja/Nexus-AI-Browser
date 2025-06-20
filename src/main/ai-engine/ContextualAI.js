const OpenAI = require('openai');
const compromise = require('compromise');
const Sentiment = require('sentiment');

class ContextualAI {
  constructor() {
    this.openai = null;
    this.userContext = {
      browsing: {
        currentTabs: [],
        recentHistory: [],
        frequentSites: [],
        searchQueries: []
      },
      personal: {
        interests: [],
        workContext: '',
        currentProjects: [],
        mood: 'neutral',
        timePreferences: {}
      },
      session: {
        startTime: Date.now(),
        pageViews: 0,
        timeSpent: {},
        interactions: []
      }
    };
    this.conversationHistory = [];
    this.sentiment = new Sentiment();
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🧠 Initializing Contextual AI...');
      
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
      });
      
      this.isInitialized = true;
      console.log('✅ Contextual AI initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Contextual AI:', error);
    }
  }

  async updateBrowsingContext(data) {
    const { type, payload } = data;
    
    switch (type) {
      case 'page_visit':
        await this.handlePageVisit(payload);
        break;
      case 'search_query':
        await this.handleSearchQuery(payload);
        break;
      case 'tab_switch':
        await this.handleTabSwitch(payload);
        break;
      case 'user_interaction':
        await this.handleUserInteraction(payload);
        break;
      case 'mood_change':
        this.userContext.personal.mood = payload.mood;
        break;
    }
    
    // Analyze patterns and update context
    await this.analyzeContextPatterns();
  }

  async handlePageVisit(pageData) {
    // Add to recent history
    this.userContext.browsing.recentHistory.unshift({
      url: pageData.url,
      title: pageData.title,
      timestamp: Date.now(),
      timeSpent: pageData.timeSpent || 0,
      category: pageData.category,
      engagement: pageData.engagement || 0.5
    });
    
    // Keep only last 50 pages
    if (this.userContext.browsing.recentHistory.length > 50) {
      this.userContext.browsing.recentHistory = this.userContext.browsing.recentHistory.slice(0, 50);
    }
    
    // Update session stats
    this.userContext.session.pageViews++;
    
    // Extract interests from page content
    await this.extractInterestsFromContent(pageData);
    
    // Update frequent sites
    this.updateFrequentSites(pageData.url);
  }

  async handleSearchQuery(queryData) {
    this.userContext.browsing.searchQueries.unshift({
      query: queryData.query,
      timestamp: Date.now(),
      intent: await this.analyzeSearchIntent(queryData.query),
      results: queryData.results || []
    });
    
    // Keep only last 20 searches
    if (this.userContext.browsing.searchQueries.length > 20) {
      this.userContext.browsing.searchQueries = this.userContext.browsing.searchQueries.slice(0, 20);
    }
  }

  async handleTabSwitch(tabData) {
    // Update current tabs
    this.userContext.browsing.currentTabs = tabData.tabs;
    
    // Analyze multitasking patterns
    if (tabData.tabs.length > 5) {
      this.userContext.personal.workContext = 'multitasking_heavy';
    } else if (tabData.tabs.length > 2) {
      this.userContext.personal.workContext = 'multitasking_moderate';
    } else {
      this.userContext.personal.workContext = 'focused';
    }
  }

  async handleUserInteraction(interactionData) {
    this.userContext.session.interactions.push({
      type: interactionData.type,
      timestamp: Date.now(),
      data: interactionData.data
    });
    
    // Keep only last 100 interactions
    if (this.userContext.session.interactions.length > 100) {
      this.userContext.session.interactions = this.userContext.session.interactions.slice(-100);
    }
    
    // Analyze interaction patterns for mood inference
    await this.inferMoodFromInteractions();
  }

  async extractInterestsFromContent(pageData) {
    if (!pageData.content) return;
    
    try {
      const doc = compromise(pageData.content);
      const topics = doc.topics().out('array');
      const nouns = doc.nouns().out('array');
      
      // Extract potential interests
      const potentialInterests = [...topics, ...nouns]
        .filter(term => term.length > 3)
        .slice(0, 10);
      
      // Update interests with frequency tracking
      potentialInterests.forEach(interest => {
        const existing = this.userContext.personal.interests.find(i => i.term === interest.toLowerCase());
        if (existing) {
          existing.frequency++;
          existing.lastSeen = Date.now();
        } else {
          this.userContext.personal.interests.push({
            term: interest.toLowerCase(),
            frequency: 1,
            category: pageData.category || 'general',
            firstSeen: Date.now(),
            lastSeen: Date.now()
          });
        }
      });
      
      // Sort by frequency and keep top 50
      this.userContext.personal.interests.sort((a, b) => b.frequency - a.frequency);
      if (this.userContext.personal.interests.length > 50) {
        this.userContext.personal.interests = this.userContext.personal.interests.slice(0, 50);
      }
      
    } catch (error) {
      console.error('Error extracting interests:', error);
    }
  }

  async analyzeSearchIntent(query) {
    const doc = compromise(query);
    const sentiment = this.sentiment.analyze(query);
    
    // Simple intent classification
    const intents = {
      informational: ['what', 'how', 'why', 'when', 'where', 'who'],
      navigational: ['login', 'site:', 'homepage', 'official'],
      transactional: ['buy', 'purchase', 'order', 'price', 'cost', 'deal'],
      research: ['compare', 'vs', 'best', 'review', 'analysis'],
      troubleshooting: ['error', 'fix', 'problem', 'issue', 'not working']
    };
    
    const queryLower = query.toLowerCase();
    let detectedIntent = 'general';
    let confidence = 0;
    
    for (const [intent, keywords] of Object.entries(intents)) {
      const matches = keywords.filter(keyword => queryLower.includes(keyword));
      if (matches.length > 0) {
        const newConfidence = matches.length / keywords.length;
        if (newConfidence > confidence) {
          detectedIntent = intent;
          confidence = newConfidence;
        }
      }
    }
    
    return {
      intent: detectedIntent,
      confidence,
      sentiment: sentiment.score,
      entities: {
        people: doc.people().out('array'),
        places: doc.places().out('array'),
        organizations: doc.organizations().out('array')
      }
    };
  }

  updateFrequentSites(url) {
    try {
      const domain = new URL(url).hostname;
      const existing = this.userContext.browsing.frequentSites.find(site => site.domain === domain);
      
      if (existing) {
        existing.visits++;
        existing.lastVisit = Date.now();
      } else {
        this.userContext.browsing.frequentSites.push({
          domain,
          visits: 1,
          firstVisit: Date.now(),
          lastVisit: Date.now()
        });
      }
      
      // Sort by visits and keep top 20
      this.userContext.browsing.frequentSites.sort((a, b) => b.visits - a.visits);
      if (this.userContext.browsing.frequentSites.length > 20) {
        this.userContext.browsing.frequentSites = this.userContext.browsing.frequentSites.slice(0, 20);
      }
      
    } catch (error) {
      // Invalid URL, ignore
    }
  }

  async inferMoodFromInteractions() {
    const recentInteractions = this.userContext.session.interactions.slice(-20);
    
    if (recentInteractions.length < 5) return;
    
    // Analyze interaction patterns
    const avgTimeBetween = this.calculateAverageTimeBetweenInteractions(recentInteractions);
    const clickFrequency = recentInteractions.filter(i => i.type === 'click').length;
    const scrollFrequency = recentInteractions.filter(i => i.type === 'scroll').length;
    
    let mood = 'neutral';
    
    // Fast, frequent clicks = impatient/stressed
    if (avgTimeBetween < 2000 && clickFrequency > 10) {
      mood = 'impatient';
    }
    // Slow, deliberate interactions = focused
    else if (avgTimeBetween > 5000 && scrollFrequency > clickFrequency) {
      mood = 'focused';
    }
    // Many quick scrolls = browsing/exploring
    else if (scrollFrequency > clickFrequency * 2) {
      mood = 'exploring';
    }
    
    this.userContext.personal.mood = mood;
  }

  calculateAverageTimeBetweenInteractions(interactions) {
    if (interactions.length < 2) return 0;
    
    let totalTime = 0;
    for (let i = 1; i < interactions.length; i++) {
      totalTime += interactions[i].timestamp - interactions[i-1].timestamp;
    }
    
    return totalTime / (interactions.length - 1);
  }

  async analyzeContextPatterns() {
    // Analyze time-based patterns
    this.analyzeTimePatterns();
    
    // Detect current projects/interests
    await this.detectCurrentProjects();
    
    // Update time preferences
    this.updateTimePreferences();
  }

  analyzeTimePatterns() {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    
    // Simple time-based context
    if (hour >= 9 && hour <= 17 && dayOfWeek >= 1 && dayOfWeek <= 5) {
      this.userContext.personal.workContext = 'work_hours';
    } else if (hour >= 18 && hour <= 22) {
      this.userContext.personal.workContext = 'evening_leisure';
    } else if (hour >= 22 || hour <= 6) {
      this.userContext.personal.workContext = 'late_night';
    } else {
      this.userContext.personal.workContext = 'free_time';
    }
  }

  async detectCurrentProjects() {
    // Group recent pages by domain and topic to detect projects
    const recentPages = this.userContext.browsing.recentHistory.slice(0, 20);
    const domainGroups = {};
    const topicGroups = {};
    
    recentPages.forEach(page => {
      try {
        const domain = new URL(page.url).hostname;
        domainGroups[domain] = (domainGroups[domain] || 0) + 1;
        
        if (page.category) {
          topicGroups[page.category] = (topicGroups[page.category] || 0) + 1;
        }
      } catch (error) {
        // Invalid URL
      }
    });
    
    // Detect projects based on concentrated activity
    const projects = [];
    
    // Domain-based projects
    Object.entries(domainGroups).forEach(([domain, count]) => {
      if (count >= 3 && !domain.includes('google') && !domain.includes('wikipedia')) {
        projects.push({
          type: 'domain_focus',
          name: domain,
          activity: count,
          detected: Date.now()
        });
      }
    });
    
    // Topic-based projects
    Object.entries(topicGroups).forEach(([topic, count]) => {
      if (count >= 3) {
        projects.push({
          type: 'topic_focus',
          name: topic,
          activity: count,
          detected: Date.now()
        });
      }
    });
    
    this.userContext.personal.currentProjects = projects.slice(0, 5);
  }

  updateTimePreferences() {
    // Track when user is most active
    const hour = new Date().getHours();
    const key = `hour_${hour}`;
    
    if (!this.userContext.personal.timePreferences[key]) {
      this.userContext.personal.timePreferences[key] = 0;
    }
    this.userContext.personal.timePreferences[key]++;
  }

  async generateContextualResponse(query, additionalContext = {}) {
    if (!this.isInitialized || !this.openai) {
      return this.generateFallbackResponse(query);
    }
    
    try {
      const systemPrompt = this.buildContextualSystemPrompt();
      const userPrompt = this.buildContextualUserPrompt(query, additionalContext);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          ...this.conversationHistory.slice(-10), // Last 10 exchanges
          { role: "user", content: userPrompt }
        ],
        max_tokens: 600,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });
      
      const response = completion.choices[0].message.content;
      
      // Update conversation history
      this.conversationHistory.push(
        { role: "user", content: query },
        { role: "assistant", content: response }
      );
      
      // Keep conversation history manageable
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }
      
      return {
        response,
        contextUsed: true,
        confidence: 0.9,
        suggestions: await this.generateContextualSuggestions(query, response)
      };
      
    } catch (error) {
      console.error('Error generating contextual response:', error);
      return this.generateFallbackResponse(query);
    }
  }

  buildContextualSystemPrompt() {
    const context = this.userContext;
    const recentInterests = context.personal.interests.slice(0, 10).map(i => i.term).join(', ');
    const currentProjects = context.personal.currentProjects.map(p => p.name).join(', ');
    const frequentSites = context.browsing.frequentSites.slice(0, 5).map(s => s.domain).join(', ');
    
    return `You are Nexus, an advanced AI assistant integrated into the user's browser. You have deep contextual awareness of their browsing habits, interests, and current activities.

Current User Context:
- Mood: ${context.personal.mood}
- Work Context: ${context.personal.workContext}
- Session: ${context.session.pageViews} pages viewed, ${Math.round((Date.now() - context.session.startTime) / 60000)} minutes active
- Current Tabs: ${context.browsing.currentTabs.length} open
- Top Interests: ${recentInterests || 'Learning about user'}
- Active Projects: ${currentProjects || 'None detected'}
- Frequent Sites: ${frequentSites || 'Building profile'}

Recent Browsing Pattern:
${context.browsing.recentHistory.slice(0, 5).map(page => 
  `- ${page.title} (${new URL(page.url).hostname})`
).join('\n')}

Recent Searches:
${context.browsing.searchQueries.slice(0, 3).map(search => 
  `- "${search.query}" (${search.intent.intent})`
).join('\n')}

Provide helpful, contextually aware responses that leverage this browsing context. Be proactive in offering relevant suggestions and insights based on their current activities and interests.`;
  }

  buildContextualUserPrompt(query, additionalContext) {
    let prompt = `User Query: "${query}"`;
    
    if (additionalContext.currentPage) {
      prompt += `\n\nCurrent Page Context:\n- URL: ${additionalContext.currentPage.url}\n- Title: ${additionalContext.currentPage.title}`;
      
      if (additionalContext.currentPage.content) {
        prompt += `\n- Content Summary: ${additionalContext.currentPage.content.substring(0, 300)}...`;
      }
    }
    
    if (additionalContext.selectedText) {
      prompt += `\n\nSelected Text: "${additionalContext.selectedText}"`;
    }
    
    return prompt;
  }

  async generateContextualSuggestions(query, response) {
    const suggestions = [];
    
    // Based on current interests
    const topInterests = this.userContext.personal.interests.slice(0, 3);
    topInterests.forEach(interest => {
      suggestions.push({
        type: 'interest_related',
        text: `Learn more about ${interest.term}`,
        action: 'search',
        query: interest.term
      });
    });
    
    // Based on current projects
    this.userContext.personal.currentProjects.forEach(project => {
      suggestions.push({
        type: 'project_related',
        text: `Continue working on ${project.name}`,
        action: 'focus',
        target: project.name
      });
    });
    
    // Based on recent search patterns
    const recentSearchIntent = this.userContext.browsing.searchQueries[0]?.intent.intent;
    if (recentSearchIntent) {
      suggestions.push({
        type: 'search_pattern',
        text: `Find more ${recentSearchIntent} information`,
        action: 'search_similar'
      });
    }
    
    return suggestions.slice(0, 5);
  }

  generateFallbackResponse(query) {
    return {
      response: `I understand you're asking about "${query}". While I'm learning about your browsing patterns to provide better assistance, I'm here to help with any questions or tasks you have.`,
      contextUsed: false,
      confidence: 0.6,
      suggestions: [
        {
          type: 'general',
          text: 'Search for this topic',
          action: 'search',
          query: query
        }
      ]
    };
  }

  getContextSummary() {
    return {
      session: {
        duration: Date.now() - this.userContext.session.startTime,
        pageViews: this.userContext.session.pageViews,
        tabCount: this.userContext.browsing.currentTabs.length
      },
      personal: {
        mood: this.userContext.personal.mood,
        workContext: this.userContext.personal.workContext,
        topInterests: this.userContext.personal.interests.slice(0, 5),
        currentProjects: this.userContext.personal.currentProjects
      },
      browsing: {
        frequentSites: this.userContext.browsing.frequentSites.slice(0, 5),
        recentSearches: this.userContext.browsing.searchQueries.slice(0, 3)
      }
    };
  }

  // Cleanup method
  async shutdown() {
    // Save context to persistent storage if needed
    console.log('💾 Saving contextual AI data...');
  }
}

module.exports = { ContextualAI };

