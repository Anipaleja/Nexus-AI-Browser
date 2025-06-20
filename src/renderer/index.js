import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Initialize the React application
const container = document.getElementById('root');
const root = createRoot(container);

// Error boundary for React
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
    
    // Report error to main process
    if (window.nexusAPI) {
      window.nexusAPI.error.report({
        type: 'react_error',
        message: error.message,
        stack: error.stack,
        url: window.location.href
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          padding: '20px'
        }}>
          <h1>🚨 Something went wrong</h1>
          <p>Nexus AI Browser encountered an unexpected error.</p>
          <details style={{ marginTop: '20px', maxWidth: '600px' }}>
            <summary>Error Details</summary>
            <pre style={{ 
              background: 'rgba(0,0,0,0.3)', 
              padding: '10px', 
              borderRadius: '5px',
              marginTop: '10px',
              fontSize: '12px',
              textAlign: 'left'
            }}>
              {this.state.error?.stack}
            </pre>
          </details>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Reload Browser
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Render the application
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

