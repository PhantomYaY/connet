import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Activity, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import styled from 'styled-components';

const NetworkDebugPanel = ({ isVisible = false }) => {
  const [networkStatus, setNetworkStatus] = useState({
    isOnline: navigator.onLine,
    lastChecked: new Date(),
    diagnostics: null,
    isRunningTest: false
  });

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: true,
        lastChecked: new Date()
      }));
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        lastChecked: new Date()
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const runDiagnostics = async () => {
    setNetworkStatus(prev => ({ ...prev, isRunningTest: true }));
    
    try {
      // Network diagnostics disabled to prevent external fetch errors
      const results = {
        message: 'Network diagnostics disabled to prevent console errors',
        connectivity: 'External tests disabled',
        performance: 'Local only'
      };

      setNetworkStatus(prev => ({
        ...prev,
        diagnostics: results,
        isRunningTest: false,
        lastChecked: new Date()
      }));
    } catch (error) {
      console.error('Failed to run diagnostics:', error);
      setNetworkStatus(prev => ({
        ...prev,
        isRunningTest: false,
        diagnostics: { error: error.message }
      }));
    }
  };

  const testQuickConnectivity = async () => {
    setNetworkStatus(prev => ({ ...prev, isRunningTest: true }));
    
    try {
      const { quickNetworkTest } = await import('../lib/networkTroubleshooter');
      const isConnected = await quickNetworkTest();
      
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: isConnected,
        isRunningTest: false,
        lastChecked: new Date()
      }));
    } catch (error) {
      console.error('Quick test failed:', error);
      setNetworkStatus(prev => ({
        ...prev,
        isRunningTest: false
      }));
    }
  };

  if (!isVisible) {
    return (
      <QuickStatus $isOnline={networkStatus.isOnline}>
        {networkStatus.isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
      </QuickStatus>
    );
  }

  return (
    <DebugPanel>
      <PanelHeader>
        <HeaderTitle>
          {networkStatus.isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
          Network Status
        </HeaderTitle>
        <TestButton onClick={testQuickConnectivity} disabled={networkStatus.isRunningTest}>
          {networkStatus.isRunningTest ? <RefreshCw size={16} className="spinning" /> : <Activity size={16} />}
          Quick Test
        </TestButton>
      </PanelHeader>

      <StatusSection>
        <StatusItem>
          <StatusLabel>Browser Status:</StatusLabel>
          <StatusValue $isGood={networkStatus.isOnline}>
            {networkStatus.isOnline ? 'Online' : 'Offline'}
          </StatusValue>
        </StatusItem>
        
        <StatusItem>
          <StatusLabel>Last Checked:</StatusLabel>
          <StatusValue>{networkStatus.lastChecked.toLocaleTimeString()}</StatusValue>
        </StatusItem>
      </StatusSection>

      <ActionSection>
        <ActionButton onClick={runDiagnostics} disabled={networkStatus.isRunningTest}>
          {networkStatus.isRunningTest ? <RefreshCw size={16} className="spinning" /> : <Activity size={16} />}
          Run Full Diagnostics
        </ActionButton>
      </ActionSection>

      {networkStatus.diagnostics && (
        <DiagnosticsSection>
          <SectionTitle>Diagnostics Results</SectionTitle>
          
          {networkStatus.diagnostics.error ? (
            <ErrorMessage>
              <XCircle size={16} />
              Error: {networkStatus.diagnostics.error}
            </ErrorMessage>
          ) : (
            <DiagnosticsGrid>
              <DiagnosticItem>
                <DiagnosticLabel>Connectivity</DiagnosticLabel>
                <DiagnosticValue>
                  {Object.entries(networkStatus.diagnostics.connectivity || {}).map(([name, result]) => (
                    <ConnectivityItem key={name}>
                      {result.status === 'success' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {name}: {result.status === 'success' ? `${result.duration}ms` : result.error}
                    </ConnectivityItem>
                  ))}
                </DiagnosticValue>
              </DiagnosticItem>

              <DiagnosticItem>
                <DiagnosticLabel>Firebase</DiagnosticLabel>
                <DiagnosticValue $isGood={networkStatus.diagnostics.firebase?.status === 'initialized'}>
                  {networkStatus.diagnostics.firebase?.status || 'Unknown'}
                </DiagnosticValue>
              </DiagnosticItem>

              <DiagnosticItem>
                <DiagnosticLabel>AI Services</DiagnosticLabel>
                <DiagnosticValue $isGood={networkStatus.diagnostics.apis?.aiService === 'loaded'}>
                  {networkStatus.diagnostics.apis?.aiService || 'Unknown'}
                </DiagnosticValue>
              </DiagnosticItem>
            </DiagnosticsGrid>
          )}
        </DiagnosticsSection>
      )}
    </DebugPanel>
  );
};

// Styled Components
const QuickStatus = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  padding: 8px;
  border-radius: 8px;
  background: ${props => props.$isOnline ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
  color: ${props => props.$isOnline ? '#22c55e' : '#ef4444'};
  border: 1px solid ${props => props.$isOnline ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const DebugPanel = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  width: 400px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(203, 213, 225, 0.3);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  padding: 20px;
  font-size: 14px;

  .dark & {
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(148, 163, 184, 0.3);
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const HeaderTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: rgba(71, 85, 105, 0.9);

  .dark & {
    color: rgba(226, 232, 240, 0.9);
  }
`;

const TestButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  color: rgba(59, 130, 246, 0.9);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusSection = styled.div`
  margin-bottom: 16px;
`;

const StatusItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const StatusLabel = styled.span`
  color: rgba(71, 85, 105, 0.7);
  
  .dark & {
    color: rgba(148, 163, 184, 0.7);
  }
`;

const StatusValue = styled.span`
  font-weight: 500;
  color: ${props => props.$isGood === false ? '#ef4444' : props.$isGood === true ? '#22c55e' : 'rgba(71, 85, 105, 0.9)'};

  .dark & {
    color: ${props => props.$isGood === false ? '#f87171' : props.$isGood === true ? '#4ade80' : 'rgba(226, 232, 240, 0.9)'};
  }
`;

const ActionSection = styled.div`
  margin-bottom: 16px;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 16px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 8px;
  color: rgba(99, 102, 241, 0.9);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba(99, 102, 241, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DiagnosticsSection = styled.div`
  border-top: 1px solid rgba(203, 213, 225, 0.3);
  padding-top: 16px;

  .dark & {
    border-color: rgba(148, 163, 184, 0.3);
  }
`;

const SectionTitle = styled.h4`
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: rgba(71, 85, 105, 0.9);

  .dark & {
    color: rgba(226, 232, 240, 0.9);
  }
`;

const DiagnosticsGrid = styled.div`
  display: grid;
  gap: 12px;
`;

const DiagnosticItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DiagnosticLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: rgba(71, 85, 105, 0.7);

  .dark & {
    color: rgba(148, 163, 184, 0.7);
  }
`;

const DiagnosticValue = styled.div`
  font-size: 12px;
  color: ${props => props.$isGood === false ? '#ef4444' : props.$isGood === true ? '#22c55e' : 'rgba(71, 85, 105, 0.9)'};

  .dark & {
    color: ${props => props.$isGood === false ? '#f87171' : props.$isGood === true ? '#4ade80' : 'rgba(226, 232, 240, 0.9)'};
  }
`;

const ConnectivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
  font-size: 11px;
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ef4444;
  font-size: 12px;

  .dark & {
    color: #f87171;
  }
`;

export default NetworkDebugPanel;
