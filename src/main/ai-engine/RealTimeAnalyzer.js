const cheerio = require('cheerio');
const Sentiment = require('sentiment');
const compromise = require('compromise');
const LanguageDetect = require('languagedetect');
const chrono = require('chrono-node');
const tf = require('@tensorflow/tfjs-node');
const axios = require('axios');

class RealTimeAnalyzer {
  constructor() {
    this.sentiment = new Sentiment();
    this.languageDetector = new LanguageDetect();
    this.isInitialized = false;
    
    // Analysis models
    this.contentClassifier = null;
    this.engagementPredictor = null;
    this.readabilityAnalyzer = null;
    this.emotionDetector = null;
    
    // Real-time tracking
    this.activeAnalyses = new Map();
    this.behaviorPatterns = new Map();
    this.userMoodHistory = [];
    this.contextualFactors = {};
    
    // Performance metrics
    this.analysisMetrics = {
      totalAnalyses: 0,
      averageProcessingTime: 0,
      accuracyScore: 0.85
    };
  }

  async initialize() {
    try {
      console.log('🕰️ Initializing RealTimeAnalyzer...');
      
      // Initialize ML models
      await this.initializeModels();
      
      // Start background processes
      this.startBackgroundProcesses();
      
      this.isInitialized = true;
      console.log('✅ RealTimeAnalyzer initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize RealTimeAnalyzer:', error);
      throw error;
    }
  }

  async initializeModels() {
    // Content classification model
    this.contentClassifier = await this.createContentClassificationModel();
    
    // User engagement prediction model
    this.engagementPredictor = await this.createEngagementPredictionModel();
    
    // Readability analysis model
    this.readabilityAnalyzer = await this.createReadabilityModel();
    
    // Emotion detection model
    this.emotionDetector = await this.createEmotionDetectionModel();
  }

  async createContentClassificationModel() {
    // Advanced content classification
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [200], units: 512, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.4 }),
        tf.layers.dense({ units: 256, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 20, activation: 'softmax' }) // 20 content categories
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  async createEngagementPredictionModel() {
    // Predict user engagement with content
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [50], units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
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

  async createReadabilityModel() {
    // Analyze content readability and complexity
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [30], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 3, activation: 'softmax' }) // easy, medium, hard
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  async createEmotionDetectionModel() {
    // Detect emotional content and user emotional response
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [100], units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 8, activation: 'softmax' }) // 8 basic emotions
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  async analyzePage(pageData) {
    if (!this.isInitialized) {
      throw new Error('RealTimeAnalyzer not initialized');
    }

    const startTime = Date.now();
    
    try {
      const analysis = {
        url: pageData.url,
        timestamp: Date.now(),
        
        // Content analysis
        content: await this.analyzeContent(pageData),
        
        // Structural analysis
        structure: await this.analyzeStructure(pageData),
        
        // Semantic analysis
        semantics: await this.analyzeSemantics(pageData),
        
        // Engagement prediction
        engagement: await this.predictEngagement(pageData),
        
        // Emotional analysis
        emotions: await this.analyzeEmotions(pageData),
        
        // Context analysis
        context: await this.analyzeContext(pageData),
        
        // Performance metrics
        performance: await this.analyzePerformance(pageData)
      };

      // Calculate overall scores
      analysis.overall = this.calculateOverallScores(analysis);
      
      // Store analysis
      this.activeAnalyses.set(pageData.url, analysis);
      
      // Update metrics
      this.updateAnalysisMetrics(Date.now() - startTime);
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing page:', error);
      return this.createFallbackAnalysis(pageData);
    }
  }

  async analyzeContent(pageData) {
    const content = pageData.content || '';
    const title = pageData.title || '';
    const description = pageData.description || '';
    
    // Text analysis
    const textAnalysis = this.analyzeText(content + ' ' + title + ' ' + description);
    
    // Content classification
    const category = await this.classifyContent(textAnalysis);
    
    // Language detection
    const language = this.detectLanguage(content);
    
    // Readability analysis
    const readability = this.analyzeReadability(content);
    
    // Topic extraction
    const topics = this.extractTopics(content);
    
    // Keyword extraction
    const keywords = this.extractKeywords(content);
    
    return {
      category,
      language,
      readability,
      topics,
      keywords,
      textAnalysis,
      wordCount: content.split(/\s+/).length,
      estimatedReadingTime: this.calculateReadingTime(content),
      contentQuality: this.assessContentQuality(textAnalysis, topics)
    };
  }

  analyzeText(text) {
    const doc = compromise(text);
    const sentiment = this.sentiment.analyze(text);
    
    return {
      sentiment: {
        score: sentiment.score,
        comparative: sentiment.comparative,
        positive: sentiment.positive,
        negative: sentiment.negative
      },
      entities: {
        people: doc.people().out('array'),
        places: doc.places().out('array'),
        organizations: doc.organizations().out('array'),
        dates: doc.dates().out('array'),
        money: doc.money().out('array')
      },
      grammar: {
        nouns: doc.nouns().out('array'),
        verbs: doc.verbs().out('array'),
        adjectives: doc.adjectives().out('array'),
        adverbs: doc.adverbs().out('array')
      },
      statistics: {
        sentences: doc.sentences().length,
        paragraphs: text.split(/\n\s*\n/).length,
        avgWordsPerSentence: this.calculateAverageWordsPerSentence(text),
        complexityScore: this.calculateComplexityScore(doc)
      }
    };
  }

  async classifyContent(textAnalysis) {
    // Enhanced content classification
    const categories = {
      'news': ['news', 'article', 'breaking', 'report', 'journalist'],
      'education': ['learn', 'tutorial', 'course', 'study', 'education', 'academic'],
      'entertainment': ['movie', 'music', 'game', 'fun', 'entertainment', 'celebrity'],
      'technology': ['tech', 'software', 'computer', 'AI', 'programming', 'developer'],
      'business': ['business', 'finance', 'market', 'economy', 'investment', 'startup'],
      'health': ['health', 'medical', 'doctor', 'fitness', 'wellness', 'nutrition'],
      'sports': ['sport', 'game', 'team', 'player', 'championship', 'athletic'],
      'travel': ['travel', 'trip', 'vacation', 'destination', 'hotel', 'flight'],
      'food': ['food', 'recipe', 'cooking', 'restaurant', 'chef', 'cuisine'],
      'fashion': ['fashion', 'style', 'clothing', 'designer', 'trend', 'beauty'],
      'science': ['science', 'research', 'study', 'experiment', 'discovery', 'theory'],
      'politics': ['politics', 'government', 'election', 'policy', 'politician', 'vote']
    };
    
    const text = textAnalysis.grammar.nouns.concat(textAnalysis.grammar.verbs).join(' ').toLowerCase();
    
    let bestCategory = 'general';
    let bestScore = 0;
    
    for (const [category, keywords] of Object.entries(categories)) {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (text.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }
    
    return {
      primary: bestCategory,
      confidence: Math.min(1.0, bestScore / 3),
      alternatives: this.getAlternativeCategories(categories, text)
    };
  }

  detectLanguage(text) {
    try {
      const languages = this.languageDetector.detect(text, 3);
      return {
        primary: languages[0]?.[0] || 'english',
        confidence: languages[0]?.[1] || 0.5,
        alternatives: languages.slice(1)
      };
    } catch (error) {
      return {
        primary: 'english',
        confidence: 0.5,
        alternatives: []
      };
    }
  }

  analyzeReadability(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = this.countSyllables(text);
    
    // Flesch Reading Ease Score
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    
    // Flesch-Kincaid Grade Level
    const gradeLevel = (0.39 * avgSentenceLength) + (11.8 * avgSyllablesPerWord) - 15.59;
    
    let difficulty = 'medium';
    if (fleschScore >= 70) difficulty = 'easy';
    else if (fleschScore <= 30) difficulty = 'hard';
    
    return {
      fleschScore: Math.max(0, Math.min(100, fleschScore)),
      gradeLevel: Math.max(0, gradeLevel),
      difficulty,
      avgSentenceLength,
      avgSyllablesPerWord,
      estimatedReadingLevel: this.getReadingLevel(gradeLevel)
    };
  }

  extractTopics(text) {
    const doc = compromise(text);
    
    // Extract noun phrases as potential topics
    const nounPhrases = doc.match('#Noun+ #Noun').out('array');
    const topics = doc.topics().out('array');
    const namedEntities = [...doc.people().out('array'), ...doc.places().out('array'), ...doc.organizations().out('array')];
    
    // Combine and rank topics
    const allTopics = [...new Set([...nounPhrases, ...topics, ...namedEntities])]
      .filter(topic => topic.length > 2)
      .map(topic => ({
        term: topic,
        frequency: (text.toLowerCase().match(new RegExp(topic.toLowerCase(), 'g')) || []).length,
        importance: this.calculateTopicImportance(topic, text)
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10);
    
    return allTopics;
  }

  extractKeywords(text) {
    const doc = compromise(text);
    
    // Extract significant words
    const nouns = doc.nouns().out('array');
    const verbs = doc.verbs().out('array');
    const adjectives = doc.adjectives().out('array');
    
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'over', 'under']);
    
    const keywords = [...nouns, ...verbs, ...adjectives]
      .filter(word => word.length > 2 && !stopWords.has(word.toLowerCase()))
      .map(word => ({
        word: word.toLowerCase(),
        frequency: (text.toLowerCase().match(new RegExp(word.toLowerCase(), 'g')) || []).length,
        type: nouns.includes(word) ? 'noun' : verbs.includes(word) ? 'verb' : 'adjective'
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 15);
    
    return keywords;
  }

  async analyzeStructure(pageData) {
    // Analyze HTML structure
    const $ = cheerio.load(pageData.html || '');
    
    return {
      headings: this.analyzeHeadings($),
      navigation: this.analyzeNavigation($),
      media: this.analyzeMedia($),
      forms: this.analyzeForms($),
      links: this.analyzeLinks($),
      layout: this.analyzeLayout($),
      accessibility: this.analyzeAccessibility($),
      seo: this.analyzeSEO($, pageData)
    };
  }

  analyzeHeadings($) {
    const headings = [];
    $('h1, h2, h3, h4, h5, h6').each((i, el) => {
      headings.push({
        level: parseInt(el.tagName.charAt(1)),
        text: $(el).text().trim(),
        length: $(el).text().trim().length
      });
    });
    
    return {
      structure: headings,
      hierarchy: this.analyzeHeadingHierarchy(headings),
      count: headings.length,
      hasH1: headings.some(h => h.level === 1)
    };
  }

  analyzeMedia($) {
    const images = $('img').length;
    const videos = $('video').length;
    const audio = $('audio').length;
    const iframes = $('iframe').length;
    
    return {
      images: {
        count: images,
        hasAltText: $('img[alt]').length,
        missingAltText: images - $('img[alt]').length
      },
      videos: {
        count: videos,
        hasControls: $('video[controls]').length
      },
      audio: {
        count: audio
      },
      embedded: {
        count: iframes
      },
      totalMediaElements: images + videos + audio + iframes
    };
  }

  async analyzeSemantics(pageData) {
    const content = pageData.content || '';
    
    // Named entity recognition
    const entities = this.extractNamedEntities(content);
    
    // Temporal analysis
    const temporalInfo = this.analyzeTemporalReferences(content);
    
    // Semantic relationships
    const relationships = this.analyzeSemanticRelationships(content);
    
    // Intent analysis
    const intent = this.analyzeUserIntent(pageData);
    
    return {
      entities,
      temporal: temporalInfo,
      relationships,
      intent,
      conceptDensity: this.calculateConceptDensity(entities),
      semanticComplexity: this.calculateSemanticComplexity(relationships)
    };
  }

  extractNamedEntities(text) {
    const doc = compromise(text);
    
    return {
      people: doc.people().out('array').map(person => ({
        name: person,
        frequency: (text.match(new RegExp(person, 'gi')) || []).length,
        context: this.getEntityContext(text, person)
      })),
      places: doc.places().out('array').map(place => ({
        name: place,
        frequency: (text.match(new RegExp(place, 'gi')) || []).length,
        context: this.getEntityContext(text, place)
      })),
      organizations: doc.organizations().out('array').map(org => ({
        name: org,
        frequency: (text.match(new RegExp(org, 'gi')) || []).length,
        context: this.getEntityContext(text, org)
      })),
      dates: this.extractDates(text),
      numbers: doc.values().out('array')
    };
  }

  analyzeTemporalReferences(text) {
    const dates = chrono.parse(text);
    
    return {
      explicitDates: dates.map(date => ({
        text: date.text,
        start: date.start.date(),
        end: date.end?.date(),
        confidence: date.start.certainty
      })),
      temporalKeywords: this.extractTemporalKeywords(text),
      timeframe: this.inferTimeframe(dates),
      recency: this.assessContentRecency(dates)
    };
  }

  async predictEngagement(pageData) {
    // Predict user engagement based on various factors
    const factors = {
      contentQuality: this.assessContentQuality(pageData),
      readability: pageData.readability?.fleschScore || 50,
      mediaRichness: this.calculateMediaRichness(pageData),
      interactivity: this.assessInteractivity(pageData),
      personalRelevance: await this.assessPersonalRelevance(pageData),
      timeliness: this.assessTimeliness(pageData),
      socialSignals: this.extractSocialSignals(pageData)
    };
    
    // Calculate weighted engagement score
    const weights = {
      contentQuality: 0.25,
      readability: 0.15,
      mediaRichness: 0.15,
      interactivity: 0.1,
      personalRelevance: 0.2,
      timeliness: 0.1,
      socialSignals: 0.05
    };
    
    let engagementScore = 0;
    for (const [factor, value] of Object.entries(factors)) {
      engagementScore += (value || 0) * weights[factor];
    }
    
    return {
      score: Math.max(0, Math.min(1, engagementScore)),
      factors,
      prediction: this.categorizeEngagement(engagementScore),
      confidence: this.calculatePredictionConfidence(factors)
    };
  }

  async analyzeEmotions(pageData) {
    const content = pageData.content || '';
    const sentiment = this.sentiment.analyze(content);
    
    // Basic emotion detection
    const emotions = {
      joy: this.detectEmotion(content, ['happy', 'joy', 'excited', 'pleased', 'delighted']),
      sadness: this.detectEmotion(content, ['sad', 'depressed', 'unhappy', 'melancholy']),
      anger: this.detectEmotion(content, ['angry', 'furious', 'rage', 'mad', 'irritated']),
      fear: this.detectEmotion(content, ['afraid', 'scared', 'terrified', 'anxious', 'worried']),
      surprise: this.detectEmotion(content, ['surprised', 'amazed', 'astonished', 'shocked']),
      disgust: this.detectEmotion(content, ['disgusted', 'revolted', 'repulsed', 'sickened']),
      trust: this.detectEmotion(content, ['trust', 'confident', 'reliable', 'secure']),
      anticipation: this.detectEmotion(content, ['anticipate', 'expect', 'hopeful', 'eager'])
    };
    
    const dominantEmotion = Object.entries(emotions)
      .sort(([,a], [,b]) => b - a)[0];
    
    return {
      sentiment: {
        polarity: sentiment.score > 0 ? 'positive' : sentiment.score < 0 ? 'negative' : 'neutral',
        intensity: Math.abs(sentiment.comparative),
        score: sentiment.score
      },
      emotions,
      dominantEmotion: {
        emotion: dominantEmotion[0],
        intensity: dominantEmotion[1]
      },
      emotionalTone: this.classifyEmotionalTone(emotions, sentiment)
    };
  }

  async analyzeContext(pageData) {
    return {
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      deviceContext: this.inferDeviceContext(pageData),
      sessionContext: this.getSessionContext(),
      userBehaviorContext: await this.getUserBehaviorContext(),
      environmentalContext: this.getEnvironmentalContext()
    };
  }

  async analyzePerformance(pageData) {
    return {
      loadTime: pageData.loadTime || 0,
      timeToInteractive: pageData.timeToInteractive || 0,
      contentSize: pageData.contentSize || 0,
      resourceCount: pageData.resourceCount || 0,
      performanceScore: this.calculatePerformanceScore(pageData),
      userExperienceMetrics: await this.calculateUXMetrics(pageData)
    };
  }

  calculateOverallScores(analysis) {
    return {
      relevanceScore: this.calculateRelevanceScore(analysis),
      qualityScore: this.calculateQualityScore(analysis),
      engagementScore: analysis.engagement.score,
      readabilityScore: this.normalizeReadabilityScore(analysis.content.readability),
      emotionalImpact: this.calculateEmotionalImpact(analysis.emotions),
      overallScore: this.calculateOverallScore(analysis)
    };
  }

  async inferUserMood() {
    // Infer user mood from recent behavior patterns
    const recentBehavior = this.getRecentBehaviorMetrics();
    const timeOfDay = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    let mood = 'neutral';
    let confidence = 0.5;
    
    // Simple mood inference logic (can be enhanced with ML)
    if (recentBehavior.averageTimeSpent > 300 && recentBehavior.engagementLevel > 0.7) {
      mood = 'focused';
      confidence = 0.8;
    } else if (recentBehavior.pageJumpRate > 0.8) {
      mood = 'restless';
      confidence = 0.7;
    } else if (timeOfDay >= 9 && timeOfDay <= 17 && dayOfWeek >= 1 && dayOfWeek <= 5) {
      mood = 'productive';
      confidence = 0.6;
    } else if (timeOfDay >= 18 && timeOfDay <= 22) {
      mood = 'relaxed';
      confidence = 0.6;
    }
    
    // Store mood history
    this.userMoodHistory.push({
      timestamp: Date.now(),
      mood,
      confidence,
      factors: recentBehavior
    });
    
    // Keep only recent mood history
    if (this.userMoodHistory.length > 50) {
      this.userMoodHistory = this.userMoodHistory.slice(-50);
    }
    
    return { mood, confidence };
  }

  // Helper methods
  calculateReadingTime(text) {
    const wordsPerMinute = 200; // Average reading speed
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  countSyllables(text) {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    let syllableCount = 0;
    
    for (const word of words) {
      let syllables = word.match(/[aeiouy]+/g) || [];
      if (word.endsWith('e')) syllables.pop();
      syllableCount += Math.max(1, syllables.length);
    }
    
    return syllableCount;
  }

  calculateAverageWordsPerSentence(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    return sentences.length > 0 ? words.length / sentences.length : 0;
  }

  calculateComplexityScore(doc) {
    const totalWords = doc.terms().length;
    const uniqueWords = new Set(doc.terms().out('array').map(w => w.toLowerCase())).size;
    const longWords = doc.terms().out('array').filter(w => w.length > 6).length;
    
    return (uniqueWords / totalWords) * 0.5 + (longWords / totalWords) * 0.5;
  }

  getRecentBehaviorMetrics() {
    // Placeholder for recent behavior analysis
    return {
      averageTimeSpent: 180,
      engagementLevel: 0.6,
      pageJumpRate: 0.4,
      interactionFrequency: 0.5
    };
  }

  startBackgroundProcesses() {
    // Clean up old analyses
    setInterval(() => {
      this.cleanupOldAnalyses();
    }, 300000); // Every 5 minutes
    
    // Update contextual factors
    setInterval(() => {
      this.updateContextualFactors();
    }, 60000); // Every minute
  }

  cleanupOldAnalyses() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [url, analysis] of this.activeAnalyses.entries()) {
      if (analysis.timestamp < cutoffTime) {
        this.activeAnalyses.delete(url);
      }
    }
  }

  updateContextualFactors() {
    this.contextualFactors = {
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      currentMood: this.getCurrentMood(),
      systemLoad: this.getSystemLoad()
    };
  }

  getCurrentMood() {
    if (this.userMoodHistory.length > 0) {
      return this.userMoodHistory[this.userMoodHistory.length - 1].mood;
    }
    return 'neutral';
  }

  getSystemLoad() {
    // Placeholder for system load monitoring
    return Math.random() * 0.5; // Low load simulation
  }

  updateAnalysisMetrics(processingTime) {
    this.analysisMetrics.totalAnalyses++;
    this.analysisMetrics.averageProcessingTime = 
      (this.analysisMetrics.averageProcessingTime * (this.analysisMetrics.totalAnalyses - 1) + processingTime) 
      / this.analysisMetrics.totalAnalyses;
  }

  createFallbackAnalysis(pageData) {
    return {
      url: pageData.url,
      timestamp: Date.now(),
      content: {
        category: { primary: 'general', confidence: 0.3 },
        language: { primary: 'english', confidence: 0.5 },
        readability: { difficulty: 'medium', fleschScore: 50 },
        topics: [],
        keywords: []
      },
      engagement: { score: 0.5, prediction: 'medium' },
      emotions: { sentiment: { polarity: 'neutral', intensity: 0 } },
      overall: { overallScore: 0.5 },
      error: true
    };
  }

  // Additional helper methods would be implemented here...
  
  async shutdown() {
    // Dispose TensorFlow models
    if (this.contentClassifier) this.contentClassifier.dispose();
    if (this.engagementPredictor) this.engagementPredictor.dispose();
    if (this.readabilityAnalyzer) this.readabilityAnalyzer.dispose();
    if (this.emotionDetector) this.emotionDetector.dispose();
  }
}

module.exports = { RealTimeAnalyzer };

