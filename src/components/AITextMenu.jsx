import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { aiService } from '../lib/aiService';
import { getAIStatus } from '../lib/envHelper';
import { aiQuotaManager } from '../lib/aiQuotaManager';
import { 
  Sparkles, 
  Type, 
  Brain, 
  Languages, 
  BookOpen,
  Loader,
  Check,
  X,
  Zap,
  FileText,
  MessageSquare,
  Code,
  ArrowRight,
  Lightbulb,
  Target,
  Volume2
} from 'lucide-react';

const AITextMenu = ({ selectedText, position, onApply, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [activeAction, setActiveAction] = useState(null);
  const [aiReady, setAiReady] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const status = getAIStatus();
    setAiReady(status.status === 'ready');
    
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!selectedText || !position) return null;

  const handleAction = async (action) => {
    if (!aiReady) {
      setResult('AI features are not available. Please configure your API keys.');
      return;
    }

    // Check quota status before making request
    const quotaStatus = aiQuotaManager.getAllQuotaStatus();
    const availableProviders = aiService.getAvailableProviders();
    const recommendedProvider = aiQuotaManager.getRecommendedProvider(
      availableProviders.includes('openai'),
      availableProviders.includes('gemini')
    );

    if (!recommendedProvider) {
      const hasGemini = availableProviders.includes('gemini');
      const hasOpenAI = availableProviders.includes('openai');
      const geminiStatus = quotaStatus.gemini;
      const openaiStatus = quotaStatus.openai;

      if (geminiStatus.quotaExceeded && openaiStatus.quotaExceeded) {
        setResult('⚠️ All AI services have exceeded their quotas. Please wait or check your billing.');
        return;
      } else if (geminiStatus.quotaExceeded && !hasOpenAI) {
        setResult('⚠️ Gemini daily quota exceeded. Please add an OpenAI API key in settings or wait until tomorrow.');
        return;
      } else if (openaiStatus.quotaExceeded && !hasGemini) {
        setResult('⚠️ OpenAI quota exceeded. Please add a Gemini API key in settings or check your OpenAI billing.');
        return;
      }
    }

    setLoading(true);
    setActiveAction(action);
    
    try {
      let prompt = '';
      
      switch (action) {
        case 'improve':
          prompt = `Improve this text for clarity, grammar, and style while maintaining the original meaning and tone:\n\n"${selectedText}"`;
          break;
        case 'simplify':
          prompt = `Simplify this text to make it easier to understand without losing important information:\n\n"${selectedText}"`;
          break;
        case 'explain':
          prompt = `Explain this text in simple, clear terms with examples if applicable:\n\n"${selectedText}"`;
          break;
        case 'expand':
          prompt = `Expand on this text with more details, examples, and supporting information:\n\n"${selectedText}"`;
          break;
        case 'summarize':
          prompt = `Create a concise summary of the key points in this text:\n\n"${selectedText}"`;
          break;
        case 'formal':
          prompt = `Rewrite this text in a more formal, professional tone:\n\n"${selectedText}"`;
          break;
        case 'casual':
          prompt = `Rewrite this text in a more casual, conversational tone:\n\n"${selectedText}"`;
          break;
        case 'bullet-points':
          prompt = `Convert this text into clear, organized bullet points:\n\n"${selectedText}"`;
          break;
        case 'translate-spanish':
          prompt = `Translate this text to Spanish while maintaining the original meaning:\n\n"${selectedText}"`;
          break;
        case 'translate-french':
          prompt = `Translate this text to French while maintaining the original meaning:\n\n"${selectedText}"`;
          break;
        case 'check-grammar':
          prompt = `Check and correct any grammar, spelling, or punctuation errors in this text:\n\n"${selectedText}"`;
          break;
        case 'fact-check':
          prompt = `Analyze this text for potential factual claims and provide feedback on their accuracy:\n\n"${selectedText}"`;
          break;
        case 'add-examples':
          prompt = `Add relevant, practical examples to illustrate the points made in this text:\n\n"${selectedText}"`;
          break;
        case 'make-questions':
          prompt = `Generate thoughtful questions based on this content to encourage deeper thinking:\n\n"${selectedText}"`;
          break;
      }
      
      const response = await aiService.callAI(prompt);
      setResult(response);
    } catch (error) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result && onApply) {
      onApply(result);
    }
    onClose();
  };

  const primaryActions = [
    { 
      id: 'improve', 
      icon: Sparkles, 
      label: 'Enhance', 
      description: 'Improve clarity & style',
      category: 'primary'
    },
    { 
      id: 'simplify', 
      icon: Type, 
      label: 'Simplify', 
      description: 'Make easier to read',
      category: 'primary'
    },
    { 
      id: 'explain', 
      icon: Brain, 
      label: 'Explain', 
      description: 'Clarify meaning',
      category: 'primary'
    },
    { 
      id: 'expand', 
      icon: ArrowRight, 
      label: 'Expand', 
      description: 'Add more details',
      category: 'primary'
    }
  ];

  const secondaryActions = [
    { 
      id: 'summarize', 
      icon: FileText, 
      label: 'Summarize', 
      description: 'Extract key points',
      category: 'transform'
    },
    { 
      id: 'bullet-points', 
      icon: Target, 
      label: 'Bullet Points', 
      description: 'Convert to list',
      category: 'transform'
    },
    { 
      id: 'formal', 
      icon: Type, 
      label: 'Formal Tone', 
      description: 'Professional style',
      category: 'tone'
    },
    { 
      id: 'casual', 
      icon: MessageSquare, 
      label: 'Casual Tone', 
      description: 'Conversational style',
      category: 'tone'
    },
    { 
      id: 'check-grammar', 
      icon: Check, 
      label: 'Grammar Check', 
      description: 'Fix errors',
      category: 'quality'
    },
    { 
      id: 'add-examples', 
      icon: Lightbulb, 
      label: 'Add Examples', 
      description: 'Include illustrations',
      category: 'enhance'
    },
    { 
      id: 'make-questions', 
      icon: MessageSquare, 
      label: 'Generate Questions', 
      description: 'Create discussion points',
      category: 'enhance'
    },
    { 
      id: 'translate-spanish', 
      icon: Languages, 
      label: 'Spanish', 
      description: 'Translate to Spanish',
      category: 'translate'
    }
  ];

  return (
    <MenuContainer 
      ref={menuRef}
      style={{
        left: position.x,
        top: position.y
      }}
    >
      {!result ? (
        <>
          <MenuHeader>
            <Zap size={14} />
            <span>AI Text Tools</span>
            {!aiReady && <StatusBadge>Offline</StatusBadge>}
          </MenuHeader>
          
          <ActionsContainer>
            <ActionsGrid>
              {primaryActions.map((action) => (
                <ActionButton
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  disabled={loading || !aiReady}
                  $active={activeAction === action.id}
                  $primary={true}
                >
                  {loading && activeAction === action.id ? (
                    <Loader className="spinner" size={16} />
                  ) : (
                    <action.icon size={16} />
                  )}
                  <div>
                    <div className="label">{action.label}</div>
                    <div className="description">{action.description}</div>
                  </div>
                </ActionButton>
              ))}
            </ActionsGrid>
            
            {showMore && (
              <SecondaryActionsGrid>
                {secondaryActions.map((action) => (
                  <SecondaryActionButton
                    key={action.id}
                    onClick={() => handleAction(action.id)}
                    disabled={loading || !aiReady}
                    $active={activeAction === action.id}
                  >
                    {loading && activeAction === action.id ? (
                      <Loader className="spinner" size={14} />
                    ) : (
                      <action.icon size={14} />
                    )}
                    <span className="label">{action.label}</span>
                  </SecondaryActionButton>
                ))}
              </SecondaryActionsGrid>
            )}
            
            <MoreToggle onClick={() => setShowMore(!showMore)}>
              {showMore ? 'Show Less' : 'More Options'}
            </MoreToggle>
          </ActionsContainer>
        </>
      ) : (
        <ResultContainer>
          <ResultHeader>
            <span>AI Result</span>
            <div className="actions">
              <ResultButton onClick={handleApply} disabled={!result}>
                <Check size={14} />
                Apply
              </ResultButton>
              <ResultButton onClick={() => setResult('')} variant="secondary">
                <ArrowRight size={14} />
                Try Again
              </ResultButton>
              <ResultButton onClick={onClose} variant="secondary">
                <X size={14} />
                Cancel
              </ResultButton>
            </div>
          </ResultHeader>
          <ResultText>{result}</ResultText>
          <ResultFooter>
            <span className="word-count">
              {result.split(/\s+/).length} words • {result.length} characters
            </span>
          </ResultFooter>
        </ResultContainer>
      )}
    </MenuContainer>
  );
};

const MenuContainer = styled.div`
  position: fixed;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 320px;
  max-width: 480px;
  animation: slideIn 0.2s ease-out;
  
  .dark & {
    background: rgba(15, 23, 42, 0.98);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const MenuHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  font-weight: 600;
  font-size: 0.875rem;
  color: #1e40af;
  
  .dark & {
    color: #60a5fa;
  }
`;

const StatusBadge = styled.span`
  font-size: 0.7rem;
  padding: 0.125rem 0.375rem;
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border-radius: 0.25rem;
  border: 1px solid rgba(239, 68, 68, 0.2);
`;

const ActionsContainer = styled.div`
  padding: 0.5rem;
`;

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem;
  border-radius: 0.5rem;
  text-align: left;
  transition: all 0.2s;
  border: 1px solid transparent;

  ${props => props.$primary ? `
    background: rgba(59, 130, 246, 0.05);
    border-color: rgba(59, 130, 246, 0.1);
  ` : `
    background: rgba(0, 0, 0, 0.02);
  `}

  ${props => props.$active ? `
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.2);
    transform: scale(0.98);
  ` : `
    &:hover:not(:disabled) {
      background: rgba(59, 130, 246, 0.08);
      transform: translateY(-1px);
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .label {
    font-weight: 500;
    font-size: 0.875rem;
    color: #374151;

    .dark & {
      color: #d1d5db;
    }
  }

  .description {
    font-size: 0.75rem;
    color: #6b7280;

    .dark & {
      color: #9ca3af;
    }
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const SecondaryActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.375rem;
  margin-bottom: 0.5rem;
`;

const SecondaryActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  text-align: left;
  transition: all 0.2s;
  background: rgba(0, 0, 0, 0.02);

  ${props => props.$active ? `
    background: rgba(59, 130, 246, 0.1);
  ` : `
    &:hover:not(:disabled) {
      background: rgba(0, 0, 0, 0.05);
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .label {
    font-weight: 400;
    font-size: 0.8rem;
    color: #374151;

    .dark & {
      color: #d1d5db;
    }
  }

  .spinner {
    animation: spin 1s linear infinite;
  }
`;

const MoreToggle = styled.button`
  width: 100%;
  padding: 0.5rem;
  text-align: center;
  font-size: 0.75rem;
  color: #6b7280;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.02);
    color: #374151;
  }

  .dark & {
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    color: #9ca3af;

    &:hover {
      background: rgba(255, 255, 255, 0.02);
      color: #d1d5db;
    }
  }
`;

const ResultContainer = styled.div`
  max-height: 400px;
  display: flex;
  flex-direction: column;
`;

const ResultHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  font-weight: 600;
  font-size: 0.875rem;
  
  .dark & {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .actions {
    display: flex;
    gap: 0.5rem;
  }
`;

const ResultButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s;
  
  ${props => props.variant === 'secondary' ? `
    background: rgba(0, 0, 0, 0.05);
    color: #6b7280;
    
    &:hover:not(:disabled) {
      background: rgba(0, 0, 0, 0.1);
    }
    
    .dark & {
      background: rgba(255, 255, 255, 0.05);
      color: #9ca3af;
      
      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  ` : `
    background: #3b82f6;
    color: white;
    
    &:hover:not(:disabled) {
      background: #2563eb;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ResultText = styled.div`
  padding: 1rem;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #374151;
  max-height: 240px;
  overflow-y: auto;
  white-space: pre-wrap;
  
  .dark & {
    color: #d1d5db;
  }
`;

const ResultFooter = styled.div`
  padding: 0.5rem 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 0.7rem;
  color: #6b7280;
  
  .dark & {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    color: #9ca3af;
  }
`;

export default AITextMenu;
