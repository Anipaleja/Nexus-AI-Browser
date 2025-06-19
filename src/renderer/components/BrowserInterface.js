import React, { useState } from 'react';
import styled from 'styled-components';

const BrowserContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${props => props.theme.background};
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

