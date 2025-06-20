import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

const BrowserContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${props => props.theme.background};
  position: relative;
`;

const TabBar = styled.div`
  display: flex;
  align-items: center;
  background: ${props => props.theme.surface};
  padding: 8px 12px;
  border-bottom: 1px solid ${props => props.theme.border};
  gap: 8px;
  overflow-x: auto;
  min-height: 48px;
  
  &::-webkit-scrollbar {
    height: 3px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border};
    border-radius: 2px;
  }
`;

const Tab = styled.div`
  display: flex;
  align-items: center;
  background: ${props => props.active ? props.theme.background : 'transparent'};
  border: 1px solid ${props => props.active ? props.theme.border : 'transparent'};
  border-radius: 8px;
  padding: 8px 12px;
  min-width: 180px;
  max-width: 240px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    background: ${props => props.theme.background};
    border-color: ${props => props.theme.border};
  }
  
  .favicon {
    width: 16px;
    height: 16px;
    margin-right: 8px;
    flex-shrink: 0;
  }
  
  .title {
    flex: 1;
    font-size: 13px;
    color: ${props => props.theme.text};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .close {
    width: 16px;
    height: 16px;
    margin-left: 8px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    opacity: 0.6;
    transition: all 0.2s ease;
    
    &:hover {
      opacity: 1;
      background: ${props => props.theme.border};
    }
  }
  
  .loading {
    width: 12px;
    height: 12px;
    border: 2px solid ${props => props.theme.border};
    border-top: 2px solid ${props => props.theme.primary};
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const NewTabButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  color: ${props => props.theme.textSecondary};
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  
  &:hover {
    background: ${props => props.theme.background};
    color: ${props => props.theme.text};
  }
`;

const NavigationBar = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: ${props => props.theme.surface};
  border-bottom: 1px solid ${props => props.theme.border};
  gap: 12px;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: ${props => props.disabled ? props.theme.textSecondary : props.theme.text};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: ${props => props.theme.background};
  }
`;

const AddressBarContainer = styled.div`
  flex: 1;
  position: relative;
`;

const AddressInput = styled.input`
  width: 100%;
  padding: 8px 40px 8px 16px;
  background: ${props => props.theme.background};
  border: 1px solid ${props => props.theme.border};
  border-radius: 20px;
  color: ${props => props.theme.text};
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: ${props => props.theme.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.primary}20;
  }
  
  &::placeholder {
    color: ${props => props.theme.textSecondary};
  }
`;

const SecurityIndicator = styled.div`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: ${props => props.secure ? '#27ca3f' : props.theme.textSecondary};
`;

const BrowserContent = styled.div`
  flex: 1;
  background: ${props => props.theme.background};
  position: relative;
  overflow: hidden;
`;

const AIInsightOverlay = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  background: ${props => props.theme.surface};
  border: 1px solid ${props => props.theme.border};
  border-radius: 12px;
  padding: 16px;
  max-width: 300px;
  box-shadow: ${props => props.theme.shadow};
  z-index: 100;
  opacity: ${props => props.visible ? 1 : 0};
  transform: translateY(${props => props.visible ? 0 : -10}px);
  transition: all 0.3s ease;
  pointer-events: ${props => props.visible ? 'auto' : 'none'};
  
  .header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    font-weight: 600;
    color: ${props => props.theme.text};
  }
  
  .content {
    font-size: 13px;
    color: ${props => props.theme.textSecondary};
    line-height: 1.4;
  }
  
  .suggestions {
    margin-top: 12px;
    
    .suggestion {
      padding: 6px 8px;
      background: ${props => props.theme.background};
      border-radius: 6px;
      margin-bottom: 6px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: ${props => props.theme.primary}20;
      }
    }
  }
`;

const WelcomeScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px;
  text-align: center;
  
  h1 {
    font-size: 48px;
    font-weight: 300;
    margin-bottom: 16px;
    background: linear-gradient(135deg, ${props => props.theme.primary}, ${props => props.theme.secondary});
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  p {
    font-size: 18px;
    color: ${props => props.theme.textSecondary};
    margin-bottom: 40px;
    max-width: 600px;
    line-height: 1.6;
  }
`;

const QuickActions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 40px;
  max-width: 800px;
  width: 100%;
`;

const QuickAction = styled.div`
  background: ${props => props.theme.surface};
  border: 1px solid ${props => props.theme.border};
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadow};
    border-color: ${props => props.theme.primary};
  }
  
  .icon {
    font-size: 32px;
    margin-bottom: 12px;
  }
  
  .title {
    font-size: 16px;
    font-weight: 600;
    color: ${props => props.theme.text};
    margin-bottom: 8px;
  }
  
  .description {
    font-size: 14px;
    color: ${props => props.theme.textSecondary};
    line-height: 1.4;
  }
`;

const AddressBar = styled.div`
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: ${props => props.theme.surface};
  border-bottom: 1px solid ${props => props.theme.border};
  gap: 15px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 12px 20px;
  background: ${props => props.theme.background};
  border: 1px solid ${props => props.theme.border};
  border-radius: 25px;
  color: ${props => props.theme.text};
  font-size: 16px;
  outline: none;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: ${props => props.theme.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.primary}20;
  }
  
  &::placeholder {
    color: ${props => props.theme.textSecondary};
  }
`;

const ActionButton = styled.button`
  background: ${props => props.theme.primary};
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.secondary};
    transform: translateY(-1px);
  }
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
`;

const WelcomeMessage = styled.div`
  max-width: 600px;
  
  h2 {
    font-size: 32px;
    margin-bottom: 20px;
    background: linear-gradient(135deg, ${props => props.theme.primary}, ${props => props.theme.secondary});
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  p {
    color: ${props => props.theme.textSecondary};
    font-size: 18px;
    line-height: 1.6;
    margin-bottom: 30px;
  }
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 40px;
  width: 100%;
  max-width: 800px;
`;

const FeatureCard = styled.div`
  background: ${props => props.theme.surface};
  padding: 25px;
  border-radius: 15px;
  border: 1px solid ${props => props.theme.border};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: ${props => props.theme.shadow};
  }
  
  .icon {
    font-size: 32px;
    margin-bottom: 15px;
  }
  
  h3 {
    font-size: 18px;
    margin-bottom: 10px;
    color: ${props => props.theme.text};
  }
  
  p {
    color: ${props => props.theme.textSecondary};
    font-size: 14px;
    line-height: 1.5;
  }
`;

function BrowserInterface({ userProfile, adaptiveSettings }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    
    try {
      if (window.nexusAPI) {
        const result = await window.nexusAPI.search.query(searchQuery);
        console.log('Search result:', result);
        // Here you would navigate to the search results or URL
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const features = [
    {
      icon: '🧠',
      title: 'AI-Powered Search',
      description: 'Intelligent search that understands context and learns from your preferences'
    },
    {
      icon: '🎯',
      title: 'Hyper-Personalization',
      description: 'Interface and content that adapts to your unique browsing patterns'
    },
    {
      icon: '📊',
      title: 'Real-time Analysis',
      description: 'Instant insights about content, readability, and engagement potential'
    },
    {
      icon: '🔒',
      title: 'Privacy First',
      description: 'All AI processing happens locally with encrypted data storage'
    }
  ];

  return (
    <BrowserContainer>
      <AddressBar>
        <SearchInput
          type="text"
          placeholder="Search or enter URL - Ask me anything! 🧠"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <ActionButton onClick={handleSearch} disabled={isLoading}>
          {isLoading ? '⏳' : '🔍'} {isLoading ? 'Searching...' : 'Search'}
        </ActionButton>
      </AddressBar>
      
      <ContentArea>
        <WelcomeMessage>
          <h2>Welcome to Nexus AI Browser</h2>
          <p>
            Experience the future of browsing with AI that truly understands you. 
            Your intelligent companion for the web is ready to learn and adapt to your needs.
          </p>
          {userProfile && (
            <p style={{ fontSize: '16px', fontStyle: 'italic' }}>
              🚀 Personalization engine is active and learning from your behavior
            </p>
          )}
        </WelcomeMessage>
        
        <FeatureGrid>
          {features.map((feature, index) => (
            <FeatureCard key={index}>
              <div className="icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </FeatureCard>
          ))}
        </FeatureGrid>
      </ContentArea>
    </BrowserContainer>
  );
}

export default BrowserInterface;

