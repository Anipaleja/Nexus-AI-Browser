import React from 'react';
import styled from 'styled-components';

const TopBarContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 20px;
  background: ${props => props.theme.surface};
  border-bottom: 1px solid ${props => props.theme.border};
  backdrop-filter: blur(10px);
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
  color: ${props => props.theme.primary};
  
  span {
    margin-left: 10px;
  }
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const Button = styled.button`
  background: ${props => props.active ? props.theme.primary : 'transparent'};
  color: ${props => props.active ? 'white' : props.theme.text};
  border: 1px solid ${props => props.theme.border};
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.primary};
    color: white;
  }
`;

const ThemeSelector = styled.select`
  background: ${props => props.theme.surface};
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
`;

const WindowControls = styled.div`
  display: flex;
  gap: 8px;
`;

const WindowButton = styled.button`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  
  &.close { background: #ff5f56; }
  &.minimize { background: #ffbd2e; }
  &.maximize { background: #27ca3f; }
  
  &:hover {
    opacity: 0.8;
  }
`;

function TopBar({ onThemeChange, currentTheme, onToggleSidePanel, userProfile }) {
  const handleWindowAction = async (action) => {
    if (window.nexusAPI) {
      await window.nexusAPI.window[action]();
    }
  };

  return (
    <TopBarContainer>
      <Logo>
        🧠
        <span>Nexus AI Browser</span>
      </Logo>
      
      <Controls>
        <ThemeSelector 
          value={currentTheme} 
          onChange={(e) => onThemeChange(e.target.value)}
        >
          <option value="cosmic">Cosmic</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </ThemeSelector>
        
        <Button onClick={onToggleSidePanel}>
          🤖 AI Assistant
        </Button>
        
        {userProfile && (
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            Welcome back! 😊
          </div>
        )}
        
        <WindowControls>
          <WindowButton 
            className="minimize" 
            onClick={() => handleWindowAction('minimize')}
            title="Minimize"
          />
          <WindowButton 
            className="maximize" 
            onClick={() => handleWindowAction('maximize')}
            title="Maximize"
          />
          <WindowButton 
            className="close" 
            onClick={() => handleWindowAction('close')}
            title="Close"
          />
        </WindowControls>
      </Controls>
    </TopBarContainer>
  );
}

export default TopBar;

