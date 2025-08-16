import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { aiService } from '../lib/aiService';
import AILoadingIndicator from './AILoadingIndicator';
import { 
  Sparkles, 
  Type, 
  Brain, 
  BookOpen,
  Lightbulb,
  Zap,
  Wand2,
  FileText,
  Loader,
  ChevronDown,
  Check,
  X
} from 'lucide-react';

const AIToolbar = ({ onAction, selectedText, disabled }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quickActions, setQuickActions] = useState([]);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [currentProvider, setCurrentProvider] = useState(aiService.getUserPreferredProvider() || 'gemini');
  const [currentModel, setCurrentModel] = useState({
    openai: aiService.getOpenAIModel ? aiService.getOpenAIModel() : 'gpt-3.5-turbo',
    gemini: aiService.getGeminiModel ? aiService.getGeminiModel() : 'gemini-1.5-flash'
  });
  const dropdownRef = useRef(null);
  const modelSelectorRef = useRef(null);

  // Available models
  const geminiModels = [
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', isPremium: false },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', isPremium: false },
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', isPremium: true },
    { id: 'gemini-exp-1206', name: 'Gemini Exp 1206', isPremium: true }
  ];

  const openaiModels = [
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', isPremium: false },
    { id: 'gpt-4', name: 'GPT-4', isPremium: true },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', isPremium: true }
  ];

  useEffect(() => {
    // Generate contextual quick actions based on selected text
    if (selectedText) {
      generateQuickActions();
    }
  }, [selectedText]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target)) {
        setShowModelSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleModelChange = (provider, modelId) => {
    setCurrentModel(prev => ({ ...prev, [provider]: modelId }));

    if (provider === 'openai' && aiService.setOpenAIModel) {
      aiService.setOpenAIModel(modelId);
    } else if (provider === 'gemini' && aiService.setGeminiModel) {
      aiService.setGeminiModel(modelId);
    }

    setShowModelSelector(false);
  };

  const handleProviderChange = (provider) => {
    setCurrentProvider(provider);
    aiService.setUserPreferredProvider(provider);
    setShowModelSelector(false);
  };

  const getCurrentModelName = () => {
    if (currentProvider === 'openai') {
      const model = openaiModels.find(m => m.id === currentModel.openai);
      return model?.name || 'GPT-3.5 Turbo';
    } else {
      const model = geminiModels.find(m => m.id === currentModel.gemini);
      return model?.name || 'Gemini 1.5 Flash';
    }
  };

  const generateQuickActions = () => {
    const actions = [];
    
    if (selectedText) {
      if (selectedText.length > 50) {
        actions.push({
          id: 'summarize',
          icon: FileText,
          label: 'Summarize',
          description: 'Create a brief summary'
        });
      }
      
      if (selectedText.length > 20) {
        actions.push({
          id: 'improve',
          icon: Sparkles,
          label: 'Improve',
          description: 'Enhance clarity and style'
        });
        
        actions.push({
          id: 'simplify',
          icon: Type,
          label: 'Simplify',
          description: 'Make easier to understand'
        });
      }
      
      actions.push({
        id: 'explain',
        icon: Brain,
        label: 'Explain',
        description: 'Provide detailed explanation'
      });
      
      actions.push({
        id: 'expand',
        icon: BookOpen,
        label: 'Expand',
        description: 'Add more details'
      });
    }
    
    setQuickActions(actions);
  };

  const handleAIAction = async (actionId) => {
    if (!selectedText && actionId !== 'continue') return;

    setLoading(true);
    setShowDropdown(false);

    try {
      let result = '';

      switch (actionId) {
        case 'improve':
          result = await aiService.improveWriting(selectedText);
          break;
        case 'simplify':
          result = await aiService.callAI(`Simplify this text to make it easier to understand:\n\n"${selectedText}"`);
          break;
        case 'explain':
          result = await aiService.callAI(`Explain this text in detail:\n\n"${selectedText}"`);
          break;
        case 'expand':
          result = await aiService.callAI(`Expand on this text with more details and examples:\n\n"${selectedText}"`);
          break;
        case 'summarize':
          result = await aiService.summarizeNotes(selectedText);
          break;
        case 'continue':
          result = await aiService.callAI(`Continue this text naturally:\n\n"${selectedText || 'Write something creative'}"`);
          break;
        case 'translate':
          result = await aiService.callAI(`Translate this text to Spanish:\n\n"${selectedText}"`);
          break;
        default:
          throw new Error(`Unknown action: ${actionId}`);
      }

      if (result && onAction) {
        onAction(actionId, result);
      } else if (!result) {
        throw new Error('No result generated from AI service');
      }
    } catch (error) {
      console.error('AI action failed:', error);

      // Provide helpful error message based on error type
      let errorMessage = error.message;
      if (error.message.includes('AI Service not available')) {
        errorMessage = 'AI Service is not configured. Please set up your API keys.';
      } else if (error.message.includes('Network error')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('API error')) {
        errorMessage = 'AI API error. Please try again later.';
      }

      if (onAction) {
        onAction('error', `AI Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const mainActions = [
    {
      id: 'improve',
      icon: Sparkles,
      label: 'Improve',
      primary: true
    },
    {
      id: 'explain',
      icon: Brain,
      label: 'Explain',
      primary: true
    },
    {
      id: 'continue',
      icon: Wand2,
      label: 'Continue',
      primary: false
    }
  ];

  const dropdownActions = [
    {
      id: 'simplify',
      icon: Type,
      label: 'Simplify Text',
      description: 'Make text easier to understand'
    },
    {
      id: 'expand',
      icon: BookOpen,
      label: 'Expand Details',
      description: 'Add more information and examples'
    },
    {
      id: 'summarize',
      icon: FileText,
      label: 'Summarize',
      description: 'Create a concise summary'
    },
    {
      id: 'translate',
      icon: Lightbulb,
      label: 'Translate',
      description: 'Translate to Spanish'
    }
  ];

  return (
    <ToolbarContainer>
      <MainActions>
        {mainActions.map((action) => (
          <ActionButton
            key={action.id}
            onClick={() => handleAIAction(action.id)}
            disabled={disabled || loading || (action.id !== 'continue' && !selectedText)}
            $primary={action.primary}
            title={action.id !== 'continue' && !selectedText ? 'Select text first' : action.label}
          >
            {loading ? (
              <Loader className="spinner" size={16} />
            ) : (
              <action.icon size={16} />
            )}
            <span>{action.label}</span>
          </ActionButton>
        ))}
      </MainActions>

      <ModelSelectorContainer ref={modelSelectorRef}>
        <ModelSelectorTrigger
          onClick={() => setShowModelSelector(!showModelSelector)}
          disabled={disabled || loading}
          title="Select AI Model"
        >
          <Brain size={14} />
          <ModelInfo>
            <span className="provider">{currentProvider === 'openai' ? 'OpenAI' : 'Gemini'}</span>
            <span className="model">{getCurrentModelName()}</span>
          </ModelInfo>
          <ChevronDown size={12} />
        </ModelSelectorTrigger>

        {showModelSelector && (
          <ModelDropdown>
            <ModelHeader>AI Model Selection</ModelHeader>

            <ModelSection>
              <ModelSectionTitle>Provider</ModelSectionTitle>
              <ModelItem
                onClick={() => handleProviderChange('openai')}
                $selected={currentProvider === 'openai'}
              >
                <div className="provider-info">
                  <span className="name">OpenAI</span>
                  <span className="current">{openaiModels.find(m => m.id === currentModel.openai)?.name}</span>
                </div>
                {currentProvider === 'openai' && <Check size={16} />}
              </ModelItem>
              <ModelItem
                onClick={() => handleProviderChange('gemini')}
                $selected={currentProvider === 'gemini'}
              >
                <div className="provider-info">
                  <span className="name">Google Gemini</span>
                  <span className="current">{geminiModels.find(m => m.id === currentModel.gemini)?.name}</span>
                </div>
                {currentProvider === 'gemini' && <Check size={16} />}
              </ModelItem>
            </ModelSection>

            <ModelDivider />

            {currentProvider === 'openai' && (
              <ModelSection>
                <ModelSectionTitle>OpenAI Models</ModelSectionTitle>
                {openaiModels.map((model) => (
                  <ModelItem
                    key={model.id}
                    onClick={() => handleModelChange('openai', model.id)}
                    $selected={currentModel.openai === model.id}
                    $premium={model.isPremium}
                  >
                    <div className="model-info">
                      <span className="name">{model.name}</span>
                      {model.isPremium && <span className="premium">Premium</span>}
                    </div>
                    {currentModel.openai === model.id && <Check size={16} />}
                  </ModelItem>
                ))}
              </ModelSection>
            )}

            {currentProvider === 'gemini' && (
              <ModelSection>
                <ModelSectionTitle>Gemini Models</ModelSectionTitle>
                {geminiModels.map((model) => (
                  <ModelItem
                    key={model.id}
                    onClick={() => handleModelChange('gemini', model.id)}
                    $selected={currentModel.gemini === model.id}
                    $premium={model.isPremium}
                  >
                    <div className="model-info">
                      <span className="name">{model.name}</span>
                      {model.isPremium && <span className="premium">Premium</span>}
                    </div>
                    {currentModel.gemini === model.id && <Check size={16} />}
                  </ModelItem>
                ))}
              </ModelSection>
            )}
          </ModelDropdown>
        )}
      </ModelSelectorContainer>

      <DropdownContainer ref={dropdownRef}>
        <DropdownTrigger
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={disabled || loading}
        >
          <Zap size={16} />
          <ChevronDown size={14} />
        </DropdownTrigger>

        {showDropdown && (
          <DropdownMenu>
            <DropdownHeader>
              <Sparkles size={14} />
              <span>AI Actions</span>
            </DropdownHeader>
            
            {selectedText && quickActions.length > 0 && (
              <>
                <DropdownSection>
                  <SectionTitle>Quick Actions for Selection</SectionTitle>
                  {quickActions.map((action) => (
                    <DropdownItem
                      key={action.id}
                      onClick={() => handleAIAction(action.id)}
                    >
                      <action.icon size={16} />
                      <div>
                        <div className="label">{action.label}</div>
                        <div className="description">{action.description}</div>
                      </div>
                    </DropdownItem>
                  ))}
                </DropdownSection>
                <Divider />
              </>
            )}

            <DropdownSection>
              <SectionTitle>All Actions</SectionTitle>
              {dropdownActions.map((action) => (
                <DropdownItem
                  key={action.id}
                  onClick={() => handleAIAction(action.id)}
                  disabled={action.id !== 'continue' && !selectedText}
                >
                  <action.icon size={16} />
                  <div>
                    <div className="label">{action.label}</div>
                    <div className="description">{action.description}</div>
                  </div>
                </DropdownItem>
              ))}
            </DropdownSection>
          </DropdownMenu>
        )}
      </DropdownContainer>
    </ToolbarContainer>
  );
};

const ToolbarContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  
  .dark & {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const MainActions = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;

  ${props => props.$primary ? `
    background: #3b82f6;
    color: white;

    &:hover:not(:disabled) {
      background: #2563eb;
    }
  ` : `
    background: rgba(0, 0, 0, 0.05);
    color: #374151;

    &:hover:not(:disabled) {
      background: rgba(0, 0, 0, 0.1);
    }

    .dark & {
      background: rgba(255, 255, 255, 0.05);
      color: #d1d5db;

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const DropdownContainer = styled.div`
  position: relative;
`;

const DropdownTrigger = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background: rgba(0, 0, 0, 0.05);
  color: #6b7280;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .dark & {
    background: rgba(255, 255, 255, 0.05);
    color: #9ca3af;
    
    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
    }
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  min-width: 280px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  z-index: 100;
  overflow: hidden;
  
  .dark & {
    background: rgba(15, 23, 42, 0.98);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const DropdownHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(59, 130, 246, 0.1);
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  font-weight: 600;
  font-size: 0.875rem;
  color: #1e40af;
  
  .dark & {
    color: #60a5fa;
  }
`;

const DropdownSection = styled.div`
  padding: 0.5rem 0;
`;

const SectionTitle = styled.div`
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  .dark & {
    color: #9ca3af;
  }
`;

const DropdownItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  text-align: left;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.1);
  }
  
  &:disabled {
    opacity: 0.5;
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
`;

const Divider = styled.div`
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
  margin: 0.5rem 0;

  .dark & {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ModelSelectorContainer = styled.div`
  position: relative;
`;

const ModelSelectorTrigger = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  background: rgba(0, 0, 0, 0.05);
  color: #374151;
  transition: all 0.2s;
  font-size: 0.8rem;
  min-width: 140px;

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .dark & {
    background: rgba(255, 255, 255, 0.05);
    color: #d1d5db;

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
    }
  }
`;

const ModelInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;

  .provider {
    font-weight: 600;
    font-size: 0.75rem;
    color: #6b7280;

    .dark & {
      color: #9ca3af;
    }
  }

  .model {
    font-weight: 500;
    font-size: 0.7rem;
    color: #374151;

    .dark & {
      color: #d1d5db;
    }
  }
`;

const ModelDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 0.5rem;
  min-width: 250px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  z-index: 100;
  overflow: hidden;

  .dark & {
    background: rgba(15, 23, 42, 0.98);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const ModelHeader = styled.div`
  padding: 0.75rem 1rem;
  background: rgba(59, 130, 246, 0.1);
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  font-weight: 600;
  font-size: 0.875rem;
  color: #1e40af;

  .dark & {
    color: #60a5fa;
  }
`;

const ModelSection = styled.div`
  padding: 0.5rem 0;
`;

const ModelSectionTitle = styled.div`
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  .dark & {
    color: #9ca3af;
  }
`;

const ModelItem = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.75rem 1rem;
  text-align: left;
  transition: all 0.2s;

  ${props => props.$selected ? `
    background: rgba(59, 130, 246, 0.1);
    color: #1e40af;

    .dark & {
      color: #60a5fa;
    }
  ` : `
    &:hover {
      background: rgba(59, 130, 246, 0.05);
    }
  `}

  ${props => props.$premium && `
    border-left: 3px solid #f59e0b;
  `}

  .provider-info, .model-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .name {
    font-weight: 500;
    font-size: 0.875rem;
    color: #374151;

    .dark & {
      color: #d1d5db;
    }
  }

  .current {
    font-size: 0.75rem;
    color: #6b7280;

    .dark & {
      color: #9ca3af;
    }
  }

  .premium {
    display: inline-block;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    font-size: 0.6rem;
    font-weight: 600;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 0.25rem;
  }
`;

const ModelDivider = styled.div`
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
  margin: 0.5rem 0;

  .dark & {
    background: rgba(255, 255, 255, 0.1);
  }
`;

export default AIToolbar;
