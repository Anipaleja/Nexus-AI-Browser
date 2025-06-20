import React, { useState, useEffect, useCallback } from 'react';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import BrowserInterface from './components/BrowserInterface';
import AIAssistant from './components/AIAssistant';
import PersonalizationPanel from './components/PersonalizationPanel';
import TopBar from './components/TopBar';

// Global styles
const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    background: ${props => props.theme.background};
    color: ${props => props.theme.text};
    overflow: hidden;
  }

  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${props => props.theme.scrollbarTrack};
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.scrollbarThumb};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.scrollbarThumbHover};
  }
`;

// Theme configurations
const themes = {
  light: {
    background: '#ffffff',
    surface: '#f8f9fa',
    primary: '#667eea',
    secondary: '#764ba2',
    text: '#333333',
    textSecondary: '#666666',
    border: '#e1e5e9',
    shadow: '0 2px 10px rgba(0,0,0,0.1)',
    scrollbarTrack: '#f1f1f1',
    scrollbarThumb: '#c1c1c1',
    scrollbarThumbHover: '#a8a8a8'
  },
  dark: {
    background: '#1a1a1a',
    surface: '#2d2d2d',
    primary: '#667eea',
    secondary: '#764ba2',
    text: '#ffffff',
    textSecondary: '#cccccc',
    border: '#444444',
    shadow: '0 2px 10px rgba(0,0,0,0.3)',
    scrollbarTrack: '#2d2d2d',
    scrollbarThumb: '#555555',
    scrollbarThumbHover: '#777777'
  },
  cosmic: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    surface: 'rgba(255,255,255,0.1)',
    primary: '#ffffff',
    secondary: '#f0f0f0',
    text: '#ffffff',
    textSecondary: '#e0e0e0',
    border: 'rgba(255,255,255,0.2)',
    shadow: '0 2px 20px rgba(0,0,0,0.3)',
    scrollbarTrack: 'rgba(255,255,255,0.1)',
    scrollbarThumb: 'rgba(255,255,255,0.3)',
    scrollbarThumbHover: 'rgba(255,255,255,0.5)'
  }
};

// Styled components
const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: ${props => props.theme.background};
  overflow: hidden;
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const BrowserSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const SidePanel = styled.div`
  width: ${props => props.collapsed ? '60px' : '350px'};
  background: ${props => props.theme.surface};
  border-left: 1px solid ${props => props.theme.border};
  transition: width 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const LoadingScreen = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
`;

const LoadingText = styled.h2`
  font-size: 24px;
  margin-bottom: 20px;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;

const LoadingProgress = styled.div`
  width: 300px;
  height: 4px;
  background: rgba(255,255,255,0.3);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 20px;

  &::after {
    content: '';
    display: block;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
    animation: loading 2s infinite;
  }

  @keyframes loading {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState('cosmic');
  const [sidePanelCollapsed, setSidePanelCollapsed] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [aiInsights, setAiInsights] = useState([]);
  const [adaptiveSettings, setAdaptiveSettings] = useState(null);

  // Initialize the application
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing Nexus AI Browser...');
        
        // Check if nexusAPI is available
        if (!window.nexusAPI) {
          console.warn('NexusAPI not available - running in development mode');
          setIsLoading(false);
          return;
        }

        // Load user profile and preferences
        const profile = await window.nexusAPI.personalization.getUserProfile();
        setUserProfile(profile);

        // Get adaptive settings
        const adaptive = await window.nexusAPI.personalization.getAdaptiveSettings();
        setAdaptiveSettings(adaptive);

        // Set theme based on adaptive settings
        if (adaptive && adaptive.colorScheme) {
          setCurrentTheme(adaptive.colorScheme === 'calming' ? 'light' : 
                         adaptive.colorScheme === 'balanced' ? 'cosmic' : 'dark');
        }

        // Get initial AI insights
        const insights = await window.nexusAPI.assistant.getProactiveInsights();
        setAiInsights(insights);

        console.log('✅ App initialization complete');
        
        // Add a slight delay for smooth transition
        setTimeout(() => setIsLoading(false), 1000);
        
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (!window.nexusAPI) return;

    // Listen for AI insights
    const handleAIInsights = (event, insights) => {
      setAiInsights(prev => [...prev, insights]);
    };

    // Listen for personalization updates
    const handlePersonalizationUpdate = (event, update) => {
      if (update.type === 'theme_change') {
        setCurrentTheme(update.theme);
      }
    };

    // Listen for mood changes
    const handleMoodChange = (event, mood) => {
      console.log('User mood changed:', mood);
      // Adapt interface based on mood
      if (mood.mood === 'stressed' && currentTheme !== 'light') {
        setCurrentTheme('light');
      }
    };

    window.nexusAPI.on('ai-insights', handleAIInsights);
    window.nexusAPI.on('personalization-update', handlePersonalizationUpdate);
    window.nexusAPI.on('mood-change', handleMoodChange);

    return () => {
      window.nexusAPI.off('ai-insights', handleAIInsights);
      window.nexusAPI.off('personalization-update', handlePersonalizationUpdate);
      window.nexusAPI.off('mood-change', handleMoodChange);
    };
  }, [currentTheme]);

  const handleThemeChange = useCallback((newTheme) => {
    setCurrentTheme(newTheme);
    
    // Update user preference
    if (window.nexusAPI) {
      window.nexusAPI.personalization.updatePreference('theme', 'colorScheme', newTheme);
    }
  }, []);

  const toggleSidePanel = useCallback(() => {
    setSidePanelCollapsed(prev => !prev);
  }, []);

  if (isLoading) {
    return (
      <LoadingScreen>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🧠</div>
        <LoadingText>Initializing Nexus AI Browser</LoadingText>
        <LoadingProgress />
        <p>Booting AI engines and personalization systems...</p>
      </LoadingScreen>
    );
  }

  return (
    <ThemeProvider theme={themes[currentTheme]}>
      <GlobalStyle />
      <AppContainer>
        <TopBar 
          onThemeChange={handleThemeChange}
          currentTheme={currentTheme}
          onToggleSidePanel={toggleSidePanel}
          userProfile={userProfile}
        />
        
        <MainContent>
          <BrowserSection>
            <BrowserInterface 
              userProfile={userProfile}
              adaptiveSettings={adaptiveSettings}
            />
          </BrowserSection>
          
          <SidePanel collapsed={sidePanelCollapsed}>
            {!sidePanelCollapsed && (
              <>
                <AIAssistant 
                  insights={aiInsights}
                  userProfile={userProfile}
                />
                <PersonalizationPanel 
                  userProfile={userProfile}
                  adaptiveSettings={adaptiveSettings}
                  onThemeChange={handleThemeChange}
                />
              </>
            )}
          </SidePanel>
        </MainContent>
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;

