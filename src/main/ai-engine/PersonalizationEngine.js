const Dexie = require('dexie');
const tf = require('@tensorflow/tfjs-node');
const Fuse = require('fuse.js');
const path = require('path');
const fs = require('fs').promises;

class PersonalizationEngine {
  constructor() {
    this.db = null;
    this.userProfile = {
      id: 'user_001',
      interests: [],
      browsingPatterns: {},
      preferences: {},
      behaviorModel: null,
      personality: {},
      workPatterns: {},
      contentPreferences: {},
      socialGraph: {},
      learningStyle: 'adaptive'
    };
    
    this.behaviorAnalyzer = null;
    this.contentRecommendationModel = null;
    this.interestEvolutionModel = null;
    this.personalityInferenceModel = null;
    
    this.recentInteractions = [];
    this.contentHistory = [];
    this.preferenceLearning = new Map();
    this.adaptiveWeights = new Map();
    
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🧑‍🎓 Initializing PersonalizationEngine...');
      
      // Initialize database
      await this.initializeDatabase();
      
      // Load user profile
      await this.loadUserProfile();
      
      // Initialize ML models
      await this.initializeModels();
      
      // Start continuous learning
      this.startContinuousLearning();
      
      this.isInitialized = true;
      console.log('✅ PersonalizationEngine initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize PersonalizationEngine:', error);
      throw error;
    }
  }

  async initializeDatabase() {
    // Using Dexie for local storage
    this.db = new Dexie('NexusPersonalizationDB');
    
    this.db.version(1).stores({
      userProfiles: '++id, userId, data, lastUpdated',
      interactions: '++id, timestamp, type, data, context',
      contentHistory: '++id, url, title, category, timeSpent, engagement, timestamp',
      preferences: '++id, category, preference, weight, confidence, lastUpdated',
      behaviorPatterns: '++id, pattern, frequency, contexts, strength',
      interests: '++id, topic, strength, evolution, lastUpdated',
      personalityTraits: '++id, trait, score, confidence, lastUpdated'
    });
    
    await this.db.open();
  }

  async initializeModels() {
    // Behavior analysis model
    this.behaviorAnalyzer = await this.createBehaviorAnalysisModel();
    
    // Content recommendation model
    this.contentRecommendationModel = await this.createContentRecommendationModel();
    
    // Interest evolution model
    this.interestEvolutionModel = await this.createInterestEvolutionModel();
    
    // Personality inference model
    this.personalityInferenceModel = await this.createPersonalityInferenceModel();
  }

  async createBehaviorAnalysisModel() {
    // Neural network for behavior pattern recognition
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [100], units: 256, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 16, activation: 'sigmoid' })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  async createContentRecommendationModel() {
    // Advanced recommendation system
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [150], units: 512, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.4 }),
        tf.layers.dense({ units: 256, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.0005),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    return model;
  }

  async createInterestEvolutionModel() {
    // LSTM for tracking interest evolution over time
    const model = tf.sequential({
      layers: [
        tf.layers.lstm({ inputShape: [30, 20], units: 64, returnSequences: true }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.lstm({ units: 32 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 8, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'linear' })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    return model;
  }

  async createPersonalityInferenceModel() {
    // Big Five personality model
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [80], units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 5, activation: 'sigmoid' }) // Big Five traits
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    return model;
  }

  async updateFromPageVisit(pageData, analysis) {
    try {
      // Record the interaction
      await this.recordInteraction('page_visit', {
        url: pageData.url,
        title: pageData.title,
        category: analysis.category,
        timeSpent: pageData.timeSpent || 0,
        engagement: analysis.engagement || 0.5,
        keywords: analysis.keywords || [],
        sentiment: analysis.sentiment || 'neutral'
      });

      // Update interests based on content
      await this.updateInterests(analysis);
      
      // Update behavior patterns
      await this.updateBehaviorPatterns(pageData, analysis);
      
      // Update personality inference
      await this.updatePersonalityInference(pageData, analysis);
      
      // Update content preferences
      await this.updateContentPreferences(analysis);
      
      // Retrain models if enough new data
      await this.checkAndRetrain();
      
    } catch (error) {
      console.error('Error updating from page visit:', error);
    }
  }

  async updateInterests(analysis) {
    const keywords = analysis.keywords || [];
    const category = analysis.category;
    const engagement = analysis.engagement || 0.5;
    
    // Update keyword-based interests
    for (const keyword of keywords) {
      const existingInterest = await this.db.interests
        .where('topic')
        .equals(keyword.toLowerCase())
        .first();
      
      if (existingInterest) {
        // Update existing interest
        const newStrength = this.calculateNewInterestStrength(
          existingInterest.strength,
          engagement,
          analysis.relevance || 0.5
        );
        
        await this.db.interests.update(existingInterest.id, {
          strength: newStrength,
          lastUpdated: Date.now(),
          evolution: [...existingInterest.evolution, {
            timestamp: Date.now(),
            strength: newStrength,
            context: category
          }]
        });
      } else {
        // Create new interest
        await this.db.interests.add({
          topic: keyword.toLowerCase(),
          strength: engagement * 0.3, // Start with lower strength
          evolution: [{
            timestamp: Date.now(),
            strength: engagement * 0.3,
            context: category
          }],
          lastUpdated: Date.now()
        });
      }
    }
    
    // Update category-based interests
    if (category) {
      const existingCategoryInterest = await this.db.interests
        .where('topic')
        .equals(category.toLowerCase())
        .first();
      
      if (existingCategoryInterest) {
        const newStrength = this.calculateNewInterestStrength(
          existingCategoryInterest.strength,
          engagement,
          0.7 // Categories have higher relevance
        );
        
        await this.db.interests.update(existingCategoryInterest.id, {
          strength: newStrength,
          lastUpdated: Date.now()
        });
      } else {
        await this.db.interests.add({
          topic: category.toLowerCase(),
          strength: engagement * 0.5,
          evolution: [{
            timestamp: Date.now(),
            strength: engagement * 0.5,
            context: 'category'
          }],
          lastUpdated: Date.now()
        });
      }
    }
  }

  calculateNewInterestStrength(currentStrength, engagement, relevance) {
    // Weighted average with decay factor
    const decayFactor = 0.95;
    const learningRate = 0.1;
    const newEvidence = engagement * relevance;
    
    return Math.min(1.0, 
      currentStrength * decayFactor + newEvidence * learningRate
    );
  }

  async updateBehaviorPatterns(pageData, analysis) {
    const timeOfDay = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    const sessionDuration = pageData.timeSpent || 0;
    
    // Analyze browsing patterns
    const patterns = {
      timePreference: {
        hour: timeOfDay,
        dayOfWeek,
        sessionLength: sessionDuration
      },
      contentPreference: {
        category: analysis.category,
        complexity: analysis.complexity || 'medium',
        format: analysis.format || 'article'
      },
      interactionStyle: {
        engagement: analysis.engagement || 0.5,
        scrollDepth: analysis.scrollDepth || 0.5,
        clickPattern: analysis.clickPattern || 'normal'
      }
    };
    
    // Store pattern
    await this.db.behaviorPatterns.add({
      pattern: JSON.stringify(patterns),
      frequency: 1,
      contexts: [{
        timestamp: Date.now(),
        url: pageData.url,
        category: analysis.category
      }],
      strength: 1.0
    });
  }

  async updatePersonalityInference(pageData, analysis) {
    // Infer personality traits from browsing behavior
    const traits = this.inferPersonalityTraits(pageData, analysis);
    
    for (const [trait, score] of Object.entries(traits)) {
      const existingTrait = await this.db.personalityTraits
        .where('trait')
        .equals(trait)
        .first();
      
      if (existingTrait) {
        // Update with moving average
        const newScore = (existingTrait.score * 0.9) + (score * 0.1);
        const newConfidence = Math.min(1.0, existingTrait.confidence + 0.01);
        
        await this.db.personalityTraits.update(existingTrait.id, {
          score: newScore,
          confidence: newConfidence,
          lastUpdated: Date.now()
        });
      } else {
        await this.db.personalityTraits.add({
          trait,
          score,
          confidence: 0.1, // Start with low confidence
          lastUpdated: Date.now()
        });
      }
    }
  }

  inferPersonalityTraits(pageData, analysis) {
    // Big Five personality inference based on browsing behavior
    const traits = {
      openness: 0.5,
      conscientiousness: 0.5,
      extraversion: 0.5,
      agreeableness: 0.5,
      neuroticism: 0.5
    };
    
    // Openness: variety of content, creative sites, learning
    if (analysis.category === 'education' || analysis.category === 'arts') {
      traits.openness += 0.1;
    }
    if (analysis.complexity === 'high') {
      traits.openness += 0.05;
    }
    
    // Conscientiousness: organized browsing, productivity sites
    if (analysis.category === 'productivity' || analysis.category === 'business') {
      traits.conscientiousness += 0.1;
    }
    if (pageData.timeSpent > 300) { // More than 5 minutes
      traits.conscientiousness += 0.05;
    }
    
    // Extraversion: social media, communication
    if (analysis.category === 'social' || analysis.category === 'communication') {
      traits.extraversion += 0.1;
    }
    
    // Neuroticism: news, stress-related content
    if (analysis.sentiment === 'negative' || analysis.category === 'news') {
      traits.neuroticism += 0.05;
    }
    
    return traits;
  }

  async updateContentPreferences(analysis) {
    const preferences = {
      format: analysis.format || 'article',
      length: analysis.length || 'medium',
      complexity: analysis.complexity || 'medium',
      visualContent: analysis.hasImages || false,
      interactivity: analysis.hasInteractiveElements || false
    };
    
    for (const [category, preference] of Object.entries(preferences)) {
      const existing = await this.db.preferences
        .where('category')
        .equals(category)
        .first();
      
      if (existing) {
        const newWeight = (existing.weight * 0.9) + (0.1 * (preference === existing.preference ? 1 : 0));
        const newConfidence = Math.min(1.0, existing.confidence + 0.01);
        
        await this.db.preferences.update(existing.id, {
          weight: newWeight,
          confidence: newConfidence,
          lastUpdated: Date.now()
        });
      } else {
        await this.db.preferences.add({
          category,
          preference,
          weight: 0.1,
          confidence: 0.1,
          lastUpdated: Date.now()
        });
      }
    }
  }

  async getPersonalizedContent() {
    const interests = await this.db.interests
      .orderBy('strength')
      .reverse()
      .limit(10)
      .toArray();
    
    const preferences = await this.db.preferences
      .orderBy('weight')
      .reverse()
      .toArray();
    
    const personalityTraits = await this.db.personalityTraits
      .toArray();
    
    return {
      recommendedTopics: interests.map(i => ({
        topic: i.topic,
        strength: i.strength,
        trending: this.isTopicTrending(i.topic)
      })),
      contentPreferences: preferences.reduce((acc, p) => {
        acc[p.category] = p.preference;
        return acc;
      }, {}),
      personalizedSuggestions: await this.generatePersonalizedSuggestions(interests, preferences),
      adaptiveInterface: await this.getAdaptiveInterfaceSettings(personalityTraits)
    };
  }

  async generatePersonalizedSuggestions(interests, preferences) {
    // Generate suggestions based on user profile
    const suggestions = [];
    
    // Interest-based suggestions
    for (const interest of interests.slice(0, 5)) {
      suggestions.push({
        type: 'interest_based',
        topic: interest.topic,
        strength: interest.strength,
        suggestion: `Explore more about ${interest.topic}`,
        category: 'exploration'
      });
    }
    
    // Time-based suggestions
    const timeOfDay = new Date().getHours();
    if (timeOfDay >= 9 && timeOfDay <= 17) {
      suggestions.push({
        type: 'contextual',
        suggestion: 'Work-related productivity content',
        category: 'productivity',
        relevance: 0.8
      });
    } else if (timeOfDay >= 18 && timeOfDay <= 22) {
      suggestions.push({
        type: 'contextual',
        suggestion: 'Entertainment and relaxation content',
        category: 'entertainment',
        relevance: 0.7
      });
    }
    
    return suggestions;
  }

  async getAdaptiveInterfaceSettings(personalityTraits) {
    const settings = {
      complexity: 'medium',
      colorScheme: 'balanced',
      informationDensity: 'medium',
      interactionStyle: 'standard'
    };
    
    // Adapt based on personality
    const openness = personalityTraits.find(t => t.trait === 'openness');
    if (openness && openness.score > 0.7) {
      settings.complexity = 'high';
      settings.informationDensity = 'dense';
    }
    
    const conscientiousness = personalityTraits.find(t => t.trait === 'conscientiousness');
    if (conscientiousness && conscientiousness.score > 0.7) {
      settings.interactionStyle = 'organized';
    }
    
    const neuroticism = personalityTraits.find(t => t.trait === 'neuroticism');
    if (neuroticism && neuroticism.score > 0.6) {
      settings.colorScheme = 'calming';
      settings.informationDensity = 'sparse';
    }
    
    return settings;
  }

  async getUserProfile() {
    const profile = await this.db.userProfiles
      .where('userId')
      .equals(this.userProfile.id)
      .first();
    
    if (profile) {
      return JSON.parse(profile.data);
    }
    
    return this.userProfile;
  }

  async saveUserProfile() {
    const profileData = {
      ...this.userProfile,
      lastUpdated: Date.now()
    };
    
    await this.db.userProfiles.put({
      userId: this.userProfile.id,
      data: JSON.stringify(profileData),
      lastUpdated: Date.now()
    });
  }

  async recordInteraction(type, data) {
    await this.db.interactions.add({
      timestamp: Date.now(),
      type,
      data: JSON.stringify(data),
      context: JSON.stringify({
        timeOfDay: new Date().getHours(),
        dayOfWeek: new Date().getDay()
      })
    });
    
    this.recentInteractions.push({ type, data, timestamp: Date.now() });
    
    // Keep only recent interactions in memory
    if (this.recentInteractions.length > 100) {
      this.recentInteractions = this.recentInteractions.slice(-100);
    }
  }

  async getActiveProjects() {
    // Infer active projects from recent browsing patterns
    const recentInteractions = await this.db.interactions
      .orderBy('timestamp')
      .reverse()
      .limit(50)
      .toArray();
    
    const projectCategories = {};
    
    recentInteractions.forEach(interaction => {
      const data = JSON.parse(interaction.data);
      if (data.category) {
        projectCategories[data.category] = (projectCategories[data.category] || 0) + 1;
      }
    });
    
    return Object.entries(projectCategories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);
  }

  isTopicTrending(topic) {
    // Simple trending detection based on recent interest growth
    return Math.random() > 0.7; // Placeholder implementation
  }

  async checkAndRetrain() {
    const interactionCount = await this.db.interactions.count();
    
    // Retrain models every 100 interactions
    if (interactionCount % 100 === 0) {
      console.log('📊 Retraining personalization models...');
      await this.retrainModels();
    }
  }

  async retrainModels() {
    try {
      // This would implement actual model retraining
      // For now, we'll just log the intention
      console.log('🤖 Models retrained with latest user data');
    } catch (error) {
      console.error('Error retraining models:', error);
    }
  }

  startContinuousLearning() {
    // Start background processes for continuous learning
    setInterval(async () => {
      await this.analyzeRecentPatterns();
      await this.updateAdaptiveWeights();
    }, 60000); // Every minute
    
    setInterval(async () => {
      await this.saveUserProfile();
    }, 300000); // Every 5 minutes
  }

  async analyzeRecentPatterns() {
    // Analyze recent behavior patterns for insights
    const recentInteractions = this.recentInteractions.slice(-20);
    
    if (recentInteractions.length > 5) {
      // Detect pattern changes
      const patterns = this.detectPatternChanges(recentInteractions);
      
      // Update adaptive weights based on patterns
      patterns.forEach(pattern => {
        this.adaptiveWeights.set(pattern.type, pattern.weight);
      });
    }
  }

  detectPatternChanges(interactions) {
    // Simple pattern detection
    const patterns = [];
    const categories = {};
    
    interactions.forEach(interaction => {
      if (interaction.data.category) {
        categories[interaction.data.category] = (categories[interaction.data.category] || 0) + 1;
      }
    });
    
    Object.entries(categories).forEach(([category, count]) => {
      patterns.push({
        type: category,
        weight: count / interactions.length,
        confidence: Math.min(1.0, count / 10)
      });
    });
    
    return patterns;
  }

  async updateAdaptiveWeights() {
    // Update learning weights based on success metrics
    // This would be implemented based on user feedback and engagement
  }

  async loadUserProfile() {
    const profile = await this.getUserProfile();
    if (profile) {
      this.userProfile = { ...this.userProfile, ...profile };
    }
  }

  // Cleanup
  async shutdown() {
    await this.saveUserProfile();
    
    // Dispose TensorFlow models
    if (this.behaviorAnalyzer) this.behaviorAnalyzer.dispose();
    if (this.contentRecommendationModel) this.contentRecommendationModel.dispose();
    if (this.interestEvolutionModel) this.interestEvolutionModel.dispose();
    if (this.personalityInferenceModel) this.personalityInferenceModel.dispose();
    
    await this.db.close();
  }
}

module.exports = { PersonalizationEngine };

