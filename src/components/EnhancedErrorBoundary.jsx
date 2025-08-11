import React from 'react';
import styled, { keyframes } from 'styled-components';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

class EnhancedErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Replace with your error monitoring service
      console.error('Production error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ isRetrying: true });
    
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRetrying: false
      });
    }, 1000);
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;
      
      if (Fallback) {
        return <Fallback error={this.state.error} retry={this.handleRetry} />;
      }

      return (
        <ErrorContainer>
          <ErrorContent>
            <ErrorIcon>
              <AlertTriangle size={48} />
            </ErrorIcon>
            
            <ErrorTitle>Oops! Something went wrong</ErrorTitle>
            
            <ErrorMessage>
              We encountered an unexpected error. Don't worry, your data is safe.
            </ErrorMessage>

            <ErrorActions>
              <ActionButton 
                $primary 
                onClick={this.handleRetry}
                disabled={this.state.isRetrying}
              >
                {this.state.isRetrying ? (
                  <>
                    <RefreshCw size={16} className="spinning" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Try Again
                  </>
                )}
              </ActionButton>
              
              <ActionButton onClick={this.handleGoHome}>
                <Home size={16} />
                Go Home
              </ActionButton>
            </ErrorActions>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <ErrorDetails>
                <DetailsToggle onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}>
                  <Bug size={16} />
                  {this.state.showDetails ? 'Hide' : 'Show'} Error Details
                </DetailsToggle>
                
                {this.state.showDetails && (
                  <DetailsContent>
                    <DetailsSection>
                      <DetailsTitle>Error:</DetailsTitle>
                      <DetailsText>{this.state.error.toString()}</DetailsText>
                    </DetailsSection>
                    
                    <DetailsSection>
                      <DetailsTitle>Stack Trace:</DetailsTitle>
                      <DetailsText>{this.state.errorInfo.componentStack}</DetailsText>
                    </DetailsSection>
                  </DetailsContent>
                )}
              </ErrorDetails>
            )}
          </ErrorContent>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

// Styled Components
const ErrorContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);

  .dark & {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  }
`;

const ErrorContent = styled.div`
  max-width: 500px;
  width: 100%;
  text-align: center;
  animation: ${fadeIn} 0.6s ease-out;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 3rem 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);

  .dark & {
    background: rgba(30, 41, 59, 0.9);
    border-color: rgba(148, 163, 184, 0.1);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  @media (max-width: 640px) {
    padding: 2rem 1.5rem;
    margin: 1rem;
  }
`;

const ErrorIcon = styled.div`
  color: #ef4444;
  margin-bottom: 1.5rem;
  animation: ${pulse} 2s ease-in-out infinite;

  svg {
    filter: drop-shadow(0 4px 12px rgba(239, 68, 68, 0.3));
  }
`;

const ErrorTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
  line-height: 1.2;

  .dark & {
    color: #f1f5f9;
  }

  @media (max-width: 640px) {
    font-size: 1.5rem;
  }
`;

const ErrorMessage = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;

  .dark & {
    color: #94a3b8;
  }
`;

const ErrorActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  ${props => props.$primary ? `
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  ` : `
    background: rgba(107, 114, 128, 0.1);
    color: #374151;
    border: 1px solid rgba(107, 114, 128, 0.2);

    .dark & {
      background: rgba(148, 163, 184, 0.1);
      color: #e2e8f0;
      border-color: rgba(148, 163, 184, 0.2);
    }

    &:hover {
      background: rgba(107, 114, 128, 0.2);
      transform: translateY(-1px);
    }
  `}

  .spinning {
    animation: ${spin} 1s linear infinite;
  }

  @media (max-width: 480px) {
    justify-content: center;
    width: 100%;
  }
`;

const ErrorDetails = styled.div`
  text-align: left;
  border-top: 1px solid rgba(107, 114, 128, 0.2);
  padding-top: 2rem;
`;

const DetailsToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 1rem;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
  }
`;

const DetailsContent = styled.div`
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;

  .dark & {
    background: rgba(0, 0, 0, 0.2);
  }
`;

const DetailsSection = styled.div`
  &:not(:last-child) {
    margin-bottom: 1rem;
  }
`;

const DetailsTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 0.5rem;
`;

const DetailsText = styled.pre`
  font-size: 0.75rem;
  color: #374151;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;

  .dark & {
    color: #d1d5db;
  }
`;

export default EnhancedErrorBoundary;
