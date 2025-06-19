const tf = require('@tensorflow/tfjs-node');
const OpenAI = require('openai');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto-js');
const compromise = require('compromise');
const Sentiment = require('sentiment');

class AIEngine {
  constructor() {
    this.openai = null;
    this.models = {
      textClassification: null,
      userBehavior: null,
      contentRecommendation: null,
      intentPrediction: null
    };
    this.sentiment = new Sentiment();
    this.isInitialized = false;
    this.knowledgeGraph = new Map();
    this.userMemory = [];
    this.conversationContext = [];
  }

  async initialize() {
    try {
      console.log('🧠 Initializing AI Engine...');
      
      // Initialize OpenAI (you'll need to set API key)
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
      });

      // Load or create ML models
      await this.initializeModels();
      
      // Load knowledge graph
      await this.loadKnowledgeGraph();
      
      // Load user memory
      await this.loadUserMemory();
      
      this.isInitialized = true;
      console.log('✅ AI Engine initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize AI Engine:', error);
      throw error;
    }
  }

  async initializeModels() {
    // Initialize text classification model
    this.models.textClassification = await this.createTextClassificationModel();
    
    // Initialize user behavior prediction model
    this.models.userBehavior = await this.createUserBehaviorModel();
    
    // Initialize content recommendation model
    this.models.contentRecommendation = await this.createContentRecommendationModel();
    
    // Initialize intent prediction model
    this.models.intentPrediction = await this.createIntentPredictionModel();
  }

  async createTextClassificationModel() {
    // Create a neural network for text classification
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [300], units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 10, activation: 'softmax' }) // 10 categories
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  async createUserBehaviorModel() {
    // LSTM model for user behavior prediction
    const model = tf.sequential({
      layers: [
        tf.layers.lstm({ inputShape: [10, 50], units: 64, returnSequences: true }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.lstm({ units: 32 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 8, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
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
    // Collaborative filtering model
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [100], units: 256, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
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

  async createIntentPredictionModel() {
    // Intent classification model
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [200], units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 15, activation: 'softmax' }) // 15 intent categories
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  async processQuery(query, context = {}) {
    if (!this.isInitialized) {
      throw new Error('AI Engine not initialized');
    }

    try {
      // Analyze query intent
      const intent = await this.analyzeIntent(query);
      
      // Extract entities and concepts
      const entities = this.extractEntities(query);
      
      // Analyze sentiment
      const sentiment = this.sentiment.analyze(query);
      
      // Get contextual understanding
      const contextualAnalysis = await this.analyzeContext(query, context);
      
      // Generate response using GPT
      const response = await this.generateIntelligentResponse({
        query,
        intent,
        entities,
        sentiment,
        context: contextualAnalysis,
        userProfile: context.userProfile
      });
      
      // Update conversation context
      this.updateConversationContext(query, response);
      
      // Learn from interaction
      await this.learnFromInteraction(query, response, context);
      
      return {
        response,
        intent,
        entities,
        sentiment,
        confidence: response.confidence || 0.8,
        suggestions: await this.generateFollowUpSuggestions(query, response),
        relatedContent: await this.findRelatedContent(query, context)
      };
    } catch (error) {
      console.error('Error processing query:', error);
      return {
        response: { text: 'I apologize, but I encountered an error processing your request.' },
        error: true
      };
    }
  }

  async analyzeIntent(query) {
    // Use compromise for basic NLP
    const doc = compromise(query);
    
    // Extract linguistic features
    const features = {
      hasQuestion: doc.has('#Question'),
      hasCommand: doc.has('#Imperative'),
      hasUrl: doc.has('#Url'),
      hasDate: doc.has('#Date'),
      hasPlace: doc.has('#Place'),
      hasPerson: doc.has('#Person'),
      wordCount: doc.terms().length,
      sentiment: this.sentiment.analyze(query).score
    };
    
    // Simple intent classification (you can enhance this with ML)
    if (features.hasQuestion) {
      if (query.toLowerCase().includes('weather')) return 'weather_query';
      if (query.toLowerCase().includes('news')) return 'news_query';
      if (query.toLowerCase().includes('search')) return 'search_query';
      return 'information_query';
    }
    
    if (features.hasCommand) {
      if (query.toLowerCase().includes('open')) return 'navigation_command';
      if (query.toLowerCase().includes('find')) return 'search_command';
      if (query.toLowerCase().includes('remind')) return 'reminder_command';
      return 'action_command';
    }
    
    if (features.hasUrl) return 'url_navigation';
    
    return 'general_query';
  }

  extractEntities(query) {
    const doc = compromise(query);
    
    return {
      people: doc.people().out('array'),
      places: doc.places().out('array'),
      organizations: doc.organizations().out('array'),
      dates: doc.dates().out('array'),
      urls: doc.match('#Url').out('array'),
      numbers: doc.numbers().out('array'),
      topics: doc.topics().out('array')
    };
  }

  async analyzeContext(query, context) {
    return {
      timeContext: this.getTimeContext(),
      locationContext: context.location || null,
      userActivity: context.recentActivity || [],
      browserContext: context.currentTabs || [],
      conversationHistory: this.conversationContext.slice(-5), // Last 5 exchanges
      userMood: context.currentMood || 'neutral',
      workContext: context.activeProjects || []
    };
  }

  async generateIntelligentResponse(data) {
    try {
      const systemPrompt = this.buildSystemPrompt(data);
      const userPrompt = this.buildUserPrompt(data);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });
      
      return {
        text: completion.choices[0].message.content,
        confidence: 0.9,
        reasoning: 'Generated using GPT-4 with contextual awareness'
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      return await this.generateFallbackResponse(data);
    }
  }

  buildSystemPrompt(data) {
    const { userProfile, context } = data;
    
    return `You are Nexus, an advanced AI assistant integrated into a personalized browser. You have deep knowledge about the user and provide hyper-personalized responses.

User Profile:
- Interests: ${userProfile?.interests?.join(', ') || 'Unknown'}
- Profession: ${userProfile?.profession || 'Unknown'}
- Browsing patterns: ${userProfile?.browsingPatterns || 'Unknown'}
- Preferred communication style: ${userProfile?.communicationStyle || 'Professional'}

Current Context:
- Time: ${new Date().toLocaleString()}
- User mood: ${context.userMood}
- Recent activity: ${context.userActivity?.slice(0, 3).join(', ') || 'None'}
- Active projects: ${context.workContext?.slice(0, 2).join(', ') || 'None'}

Provide intelligent, contextual, and personalized responses. Be proactive in offering relevant suggestions and insights.`;
  }

  buildUserPrompt(data) {
    const { query, intent, entities, sentiment } = data;
    
    return `Query: "${query}"

Analysis:
- Intent: ${intent}
- Key entities: ${Object.values(entities).flat().join(', ') || 'None'}
- Sentiment: ${sentiment.score > 0 ? 'Positive' : sentiment.score < 0 ? 'Negative' : 'Neutral'}

Please provide a helpful and personalized response.`;
  }

  async generateFallbackResponse(data) {
    // Local fallback when OpenAI is unavailable
    const { query, intent } = data;
    
    const responses = {
      'weather_query': 'I can help you check the weather. Let me find the latest weather information for you.',
      'news_query': 'I\'ll help you find the latest news. What specific topics interest you?',
      'search_query': 'I can help you search for information. What would you like to find?',
      'navigation_command': 'I\'ll help you navigate to your destination.',
      'general_query': `I understand you're asking about "${query}". Let me help you with that.`
    };
    
    return {
      text: responses[intent] || 'I\'m here to help. Could you provide more details about what you need?',
      confidence: 0.6,
      reasoning: 'Fallback response due to API unavailability'
    };
  }

  async generateSuggestions(data) {
    const { pageAnalysis, userProfile, context } = data;
    
    const suggestions = [];
    
    // Content-based suggestions
    if (pageAnalysis.category === 'news') {
      suggestions.push({
        type: 'related_content',
        title: 'Related News Articles',
        items: await this.findRelatedNews(pageAnalysis.keywords)
      });
    }
    
    // Personalized suggestions based on user behavior
    if (userProfile.interests) {
      const personalizedContent = await this.getPersonalizedContent(userProfile.interests);
      suggestions.push({
        type: 'personalized',
        title: 'Based on Your Interests',
        items: personalizedContent
      });
    }
    
    // Time-based suggestions
    const timeBasedSuggestions = this.getTimeBasedSuggestions(context.timeOfDay);
    if (timeBasedSuggestions.length > 0) {
      suggestions.push({
        type: 'contextual',
        title: 'Perfect for Right Now',
        items: timeBasedSuggestions
      });
    }
    
    return suggestions;
  }

  getTimeContext() {
    const now = new Date();
    const hour = now.getHours();
    
    let timeOfDay = 'night';
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    
    return {
      hour,
      timeOfDay,
      dayOfWeek: now.getDay(),
      isWeekend: now.getDay() === 0 || now.getDay() === 6,
      timestamp: now.toISOString()
    };
  }

  updateConversationContext(query, response) {
    this.conversationContext.push({
      timestamp: Date.now(),
      query,
      response: response.text,
      intent: response.intent
    });
    
    // Keep only last 20 exchanges
    if (this.conversationContext.length > 20) {
      this.conversationContext = this.conversationContext.slice(-20);
    }
  }

  async learnFromInteraction(query, response, context) {
    // Store interaction for learning
    this.userMemory.push({
      timestamp: Date.now(),
      query,
      response: response.text,
      context,
      satisfaction: null // Will be updated based on user feedback
    });
    
    // Update knowledge graph
    await this.updateKnowledgeGraph(query, response, context);
  }

  async updateKnowledgeGraph(query, response, context) {
    // Extract concepts and relationships
    const concepts = this.extractConcepts(query);
    
    concepts.forEach(concept => {
      if (!this.knowledgeGraph.has(concept)) {
        this.knowledgeGraph.set(concept, {
          frequency: 0,
          contexts: [],
          relatedConcepts: new Set()
        });
      }
      
      const conceptData = this.knowledgeGraph.get(concept);
      conceptData.frequency += 1;
      conceptData.contexts.push({
        timestamp: Date.now(),
        context: context.timeContext,
        userMood: context.currentMood
      });
    });
  }

  extractConcepts(text) {
    const doc = compromise(text);
    return [
      ...doc.nouns().out('array'),
      ...doc.topics().out('array'),
      ...doc.people().out('array'),
      ...doc.places().out('array')
    ].filter(concept => concept.length > 2);
  }

  async loadKnowledgeGraph() {
    try {
      const graphPath = path.join(__dirname, '../../data/knowledge-graph.json');
      const data = await fs.readFile(graphPath, 'utf8');
      const graphData = JSON.parse(data);
      
      // Convert back to Map with Sets
      Object.entries(graphData).forEach(([key, value]) => {
        this.knowledgeGraph.set(key, {
          ...value,
          relatedConcepts: new Set(value.relatedConcepts)
        });
      });
    } catch (error) {
      console.log('Creating new knowledge graph...');
    }
  }

  async saveKnowledgeGraph() {
    try {
      const graphPath = path.join(__dirname, '../../data/knowledge-graph.json');
      const graphData = {};
      
      // Convert Map with Sets to plain object
      this.knowledgeGraph.forEach((value, key) => {
        graphData[key] = {
          ...value,
          relatedConcepts: Array.from(value.relatedConcepts)
        };
      });
      
      await fs.writeFile(graphPath, JSON.stringify(graphData, null, 2));
    } catch (error) {
      console.error('Failed to save knowledge graph:', error);
    }
  }

  async loadUserMemory() {
    try {
      const memoryPath = path.join(__dirname, '../../data/user-memory.json');
      const data = await fs.readFile(memoryPath, 'utf8');
      this.userMemory = JSON.parse(data);
    } catch (error) {
      console.log('Creating new user memory...');
      this.userMemory = [];
    }
  }

  async saveUserMemory() {
    try {
      const memoryPath = path.join(__dirname, '../../data/user-memory.json');
      await fs.writeFile(memoryPath, JSON.stringify(this.userMemory, null, 2));
    } catch (error) {
      console.error('Failed to save user memory:', error);
    }
  }

  // Cleanup method
  async shutdown() {
    await this.saveKnowledgeGraph();
    await this.saveUserMemory();
    
    // Dispose TensorFlow models
    Object.values(this.models).forEach(model => {
      if (model) model.dispose();
    });
  }
}

module.exports = { AIEngine };

