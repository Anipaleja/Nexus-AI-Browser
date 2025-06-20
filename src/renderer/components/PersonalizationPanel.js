import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const PanelContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  
  h3 {
    margin-left: 10px;
    color: ${props => props.theme.text};
  }
`;

const Section = styled.div`
  margin-bottom: 20px;
  
  h4 {
    font-size: 14px;
    color: ${props => props.theme.text};
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const MetricCard = styled.div`
  background: ${props => props.theme.surface};
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  font-size: 13px;
  
  .label {
    color: ${props => props.theme.textSecondary};
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  
  .value {
    color: ${props => props.theme.text};
    font-weight: bold;
    font-size: 16px;
  }
  
  .description {
    color: ${props => props.theme.textSecondary};
    font-size: 11px;
    margin-top: 4px;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: ${props => props.theme.border};
  border-radius: 3px;
  overflow: hidden;
  margin: 8px 0;
  
  .fill {
    height: 100%;
    background: linear-gradient(90deg, ${props => props.theme.primary}, ${props => props.theme.secondary});
    width: ${props => props.percentage}%;
    transition: width 0.3s ease;
  }
`;

const InterestTag = styled.span`
  display: inline-block;
  background: ${props => props.theme.primary}20;
  color: ${props => props.theme.primary};
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  margin: 2px;
  border: 1px solid ${props => props.theme.primary}40;
`;

const MoodIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: ${props => props.theme.surface};
  border-radius: 20px;
  border: 1px solid ${props => props.theme.border};
  
  .emoji {
    font-size: 18px;
  }
  
  .mood-text {
    font-size: 13px;
    color: ${props => props.theme.text};
    font-weight: 500;
  }
  
  .confidence {
    font-size: 11px;
    color: ${props => props.theme.textSecondary};
    margin-left: auto;
  }
`;

function PersonalizationPanel({ userProfile, adaptiveSettings, onThemeChange }) {
  const [currentMood, setCurrentMood] = useState({ mood: 'neutral', confidence: 0.5 });
  const [behaviorMetrics, setBehaviorMetrics] = useState(null);
  const [personalizedData, setPersonalizedData] = useState(null);

  useEffect(() => {
    const loadPersonalizationData = async () => {
      try {
        if (window.nexusAPI) {
          // Get current mood
          const mood = await window.nexusAPI.analysis.getUserMood();
          setCurrentMood(mood);
          
          // Get behavior metrics
          const metrics = await window.nexusAPI.data.getBehaviorMetrics();
          setBehaviorMetrics(metrics);
          
          // Get personalized content
          const personalized = await window.nexusAPI.ai.getPersonalizedContent();
          setPersonalizedData(personalized);
        }
      } catch (error) {
        console.error('Error loading personalization data:', error);
      }
    };

    loadPersonalizationData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadPersonalizationData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getMoodEmoji = (mood) => {
    const moodEmojis = {
      happy: '😊',
      focused: '🧐',
      relaxed: '😌',
      productive: '💪',
      stressed: '😰',
      curious: '🤔',
      neutral: '🙂'
    };
    return moodEmojis[mood] || '🙂';
  };

  const getEngagementLevel = (score) => {
    if (score > 0.8) return 'High';
    if (score > 0.6) return 'Good';
    if (score > 0.4) return 'Moderate';
    return 'Low';
  };

  return (
    <PanelContainer>
      <Header>
        🎯
        <h3>Personalization</h3>
      </Header>
      
      <Section>
        <h4>💭 Current Mood</h4>
        <MoodIndicator>
          <span className="emoji">{getMoodEmoji(currentMood.mood)}</span>
          <span className="mood-text">{currentMood.mood}</span>
          <span className="confidence">{Math.round(currentMood.confidence * 100)}%</span>
        </MoodIndicator>
      </Section>
      
      {behaviorMetrics && (
        <Section>
          <h4>📊 Behavior Insights</h4>
          <MetricCard>
            <div className="label">Engagement Level</div>
            <div className="value">{getEngagementLevel(behaviorMetrics.engagementScore)}</div>
            <ProgressBar percentage={behaviorMetrics.engagementScore * 100}>
              <div className="fill" />
            </ProgressBar>
            <div className="description">
              Based on your interaction patterns
            </div>
          </MetricCard>
          
          <MetricCard>
            <div className="label">Avg Session</div>
            <div className="value">{Math.round(behaviorMetrics.averageSessionLength / 1000 / 60)} min</div>
            <div className="description">
              Your typical browsing session length
            </div>
          </MetricCard>
        </Section>
      )}
      
      {personalizedData?.recommendedTopics && personalizedData.recommendedTopics.length > 0 && (
        <Section>
          <h4>🎆 Your Interests</h4>
          <div>
            {personalizedData.recommendedTopics.slice(0, 6).map((topic, index) => (
              <InterestTag key={index}>
                {topic.topic} ({Math.round(topic.strength * 100)}%)
              </InterestTag>
            ))}
          </div>
        </Section>
      )}
      
      {adaptiveSettings && (
        <Section>
          <h4>⚙️ Adaptive Settings</h4>
          <MetricCard>
            <div className="label">Interface Complexity</div>
            <div className="value">{adaptiveSettings.complexity || 'Medium'}</div>
            <div className="description">
              Automatically adjusted for your preferences
            </div>
          </MetricCard>
          
          <MetricCard>
            <div className="label">Information Density</div>
            <div className="value">{adaptiveSettings.informationDensity || 'Medium'}</div>
            <div className="description">
              Optimized based on your attention patterns
            </div>
          </MetricCard>
        </Section>
      )}
      
      {userProfile && (
        <Section>
          <h4>💬 User Profile</h4>
          <MetricCard>
            <div className="label">Learning Style</div>
            <div className="value">{userProfile.learningStyle || 'Adaptive'}</div>
            <div className="description">
              How the AI adapts to your behavior
            </div>
          </MetricCard>
          
          {userProfile.interests && userProfile.interests.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <div className="label" style={{ marginBottom: '5px' }}>STORED INTERESTS</div>
              {userProfile.interests.slice(0, 4).map((interest, index) => (
                <InterestTag key={index}>{interest}</InterestTag>
              ))}
            </div>
          )}
        </Section>
      )}
    </PanelContainer>
  );
}

export default PersonalizationPanel;

