import React, { useState } from 'react';
import styled from 'styled-components';

const AssistantContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  border-bottom: 1px solid ${props => props.theme.border};
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

const ChatArea = styled.div`
  flex: 1;
  background: ${props => props.theme.background};
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
  max-height: 300px;
  overflow-y: auto;
`;

const Message = styled.div`
  margin-bottom: 15px;
  
  .sender {
    font-size: 12px;
    color: ${props => props.theme.textSecondary};
    margin-bottom: 5px;
  }
  
  .content {
    background: ${props => props.isUser ? props.theme.primary : props.theme.surface};
    color: ${props => props.isUser ? 'white' : props.theme.text};
    padding: 10px 15px;
    border-radius: 15px;
    border-top-left-radius: ${props => props.isUser ? '15px' : '5px'};
    border-top-right-radius: ${props => props.isUser ? '5px' : '15px'};
    font-size: 14px;
    line-height: 1.4;
  }
`;

const InputArea = styled.div`
  display: flex;
  gap: 10px;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px 15px;
  background: ${props => props.theme.background};
  border: 1px solid ${props => props.theme.border};
  border-radius: 20px;
  color: ${props => props.theme.text};
  font-size: 14px;
  outline: none;
  
  &:focus {
    border-color: ${props => props.theme.primary};
  }
`;

const SendButton = styled.button`
  background: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: ${props => props.theme.secondary};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const InsightCard = styled.div`
  background: ${props => props.theme.surface};
  border: 1px solid ${props => props.theme.border};
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 10px;
  font-size: 13px;
  
  .title {
    font-weight: bold;
    color: ${props => props.theme.text};
    margin-bottom: 5px;
  }
  
  .content {
    color: ${props => props.theme.textSecondary};
    line-height: 1.4;
  }
`;

function AIAssistant({ insights, userProfile }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'Nexus AI',
      content: 'Hello! I\'m your AI assistant. I can help you browse smarter, find information, and adapt to your preferences. What can I help you with today?',
      isUser: false,
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage = {
      id: messages.length + 1,
      sender: 'You',
      content: inputValue,
      isUser: true,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      if (window.nexusAPI) {
        const response = await window.nexusAPI.assistant.chat(inputValue, {
          userProfile
        });
        
        const aiMessage = {
          id: messages.length + 2,
          sender: 'Nexus AI',
          content: response.response?.text || 'I apologize, but I\'m having trouble processing that request right now.',
          isUser: false,
          timestamp: Date.now()
        };
        
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage = {
        id: messages.length + 2,
        sender: 'Nexus AI',
        content: 'I\'m sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <AssistantContainer>
      <Header>
        🤖
        <h3>AI Assistant</h3>
      </Header>
      
      {insights && insights.length > 0 && (
        <div>
          <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>💡 Insights</h4>
          {insights.slice(0, 2).map((insight, index) => (
            <InsightCard key={index}>
              <div className="title">{insight.title || 'Smart Suggestion'}</div>
              <div className="content">{insight.suggestion || insight.text}</div>
            </InsightCard>
          ))}
        </div>
      )}
      
      <ChatArea>
        {messages.map((message) => (
          <Message key={message.id} isUser={message.isUser}>
            <div className="sender">{message.sender}</div>
            <div className="content">{message.content}</div>
          </Message>
        ))}
        {isLoading && (
          <Message isUser={false}>
            <div className="sender">Nexus AI</div>
            <div className="content">
              ⏳ Thinking...
            </div>
          </Message>
        )}
      </ChatArea>
      
      <InputArea>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything..."
          disabled={isLoading}
        />
        <SendButton 
          onClick={handleSendMessage}
          disabled={isLoading || !inputValue.trim()}
        >
          ➤
        </SendButton>
      </InputArea>
    </AssistantContainer>
  );
}

export default AIAssistant;

