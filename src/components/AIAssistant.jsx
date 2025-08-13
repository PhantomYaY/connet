import React, { useState } from 'react';
import styled from 'styled-components';
import { aiService } from '../lib/aiService';
import { 
  Sparkles, 
  BookOpen, 
  FileText, 
  Lightbulb, 
  Settings,
  X,
  Loader
} from 'lucide-react';

const AIAssistant = ({ isOpen, onClose, notes = [], currentNote = null }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [activeFeature, setActiveFeature] = useState(null);

  const handleFeature = async (featureType) => {
    setLoading(true);
    setActiveFeature(featureType);
    setResult('');

    // Check if AI service is available
    const hasApiKeys = process.env?.REACT_APP_OPENAI_API_KEY || process.env?.REACT_APP_GEMINI_API_KEY;

    if (!hasApiKeys) {
      setLoading(false);
      setResult('🔧 Demo Mode: AI features require API keys to function. Please add REACT_APP_OPENAI_API_KEY or REACT_APP_GEMINI_API_KEY to your environment variables.\n\nFor demo purposes, here\'s what this feature would do:\n\n' + getDemoText(featureType));
      return;
    }

    try {
      let response = '';

      switch (featureType) {
        case 'flashcards':
          if (currentNote?.content) {
            response = await aiService.generateFlashcards(currentNote.content);
            try {
              const flashcards = JSON.parse(response);
              setResult(formatFlashcards(flashcards));
            } catch {
              setResult(response);
            }
          } else {
            setResult('Please select a note to generate flashcards from.');
          }
          break;

        case 'summarize':
          if (notes.length > 0) {
            const allContent = notes.map(note => `${note.title}\n${note.content || ''}`).join('\n\n');
            response = await aiService.summarizeNotes(allContent);
            setResult(response);
          } else {
            setResult('No notes available to summarize.');
          }
          break;

        case 'organize':
          if (notes.length > 0) {
            response = await aiService.optimizeNoteOrganization(notes);
            try {
              const organization = JSON.parse(response);
              setResult(formatOrganization(organization));
            } catch {
              setResult(response);
            }
          } else {
            setResult('No notes available to organize.');
          }
          break;

        case 'related':
          if (currentNote?.content) {
            response = await aiService.discoverRelatedTopics(currentNote.content);
            setResult(response);
          } else {
            setResult('Please select a note to discover related topics.');
          }
          break;

        case 'improve':
          if (currentNote?.content) {
            response = await aiService.improveWriting(currentNote.content);
            setResult(response);
          } else {
            setResult('Please select a note to improve writing.');
          }
          break;

        default:
          setResult('Feature not implemented yet.');
      }
    } catch (error) {
      console.error('AI Assistant Error:', error);
      let errorMessage = 'An error occurred while processing your request.';

      if (error.message.includes('No AI API keys configured')) {
        errorMessage = '⚠️ AI features require your own API keys. Please go to Settings and add your OpenAI or Gemini API key to use AI features.';
      } else if (error.message.includes('Network error')) {
        errorMessage = '🌐 Network error: Please check your internet connection and try again.';
      } else if (error.message.includes('API error')) {
        errorMessage = `🔑 API Error: ${error.message}. Please check your API key and try again.`;
      } else {
        errorMessage = `❌ Error: ${error.message}`;
      }

      setResult(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatFlashcards = (flashcards) => {
    return flashcards.map((card, index) => 
      `Card ${index + 1}:\nQ: ${card.question}\nA: ${card.answer}\n`
    ).join('\n');
  };

  const formatOrganization = (organization) => {
    return Object.entries(organization).map(([folder, notesList]) =>
      `📁 ${folder}:\n${notesList.map(note => `  • ${note}`).join('\n')}\n`
    ).join('\n');
  };

  const getDemoText = (featureType) => {
    switch (featureType) {
      case 'flashcards':
        return '📚 Generate Flashcards: Automatically creates study flashcards from your note content with questions and answers.';
      case 'summarize':
        return '📝 Summarize Notes: Creates concise summaries of your notes, highlighting key points and main ideas.';
      case 'organize':
        return '📁 Organize Notes: Analyzes your note titles and suggests folder organization categories for better structure.';
      case 'related':
        return '💡 Related Topics: Suggests 5 related topics you might want to study based on your note content.';
      case 'improve':
        return '✨ Improve Writing: Enhances your text for clarity, grammar, and style while maintaining the original meaning.';
      default:
        return 'This AI feature will help enhance your note-taking experience.';
    }
  };

  if (!isOpen) return null;

  return (
    <AIOverlay onClick={onClose}>
      <AIPanel onClick={(e) => e.stopPropagation()}>
        <AIHeader>
          <h3>✨ AI Assistant</h3>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </AIHeader>

        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '0.5rem',
          padding: '0.75rem',
          marginBottom: '1rem',
          fontSize: '0.875rem',
          color: '#1e40af'
        }}>
          <strong>📝 Note:</strong> AI features require your own API keys. Add them in Settings → AI Settings to get started.
        </div>

        <AIFeatures>
          <FeatureButton onClick={() => handleFeature('flashcards')}>
            <BookOpen size={20} />
            <span>Generate Flashcards</span>
          </FeatureButton>
          
          <FeatureButton onClick={() => handleFeature('summarize')}>
            <FileText size={20} />
            <span>Summarize Notes</span>
          </FeatureButton>
          
          <FeatureButton onClick={() => handleFeature('organize')}>
            <Settings size={20} />
            <span>Organize Notes</span>
          </FeatureButton>
          
          <FeatureButton onClick={() => handleFeature('related')}>
            <Lightbulb size={20} />
            <span>Related Topics</span>
          </FeatureButton>
          
          <FeatureButton onClick={() => handleFeature('improve')}>
            <Sparkles size={20} />
            <span>Improve Writing</span>
          </FeatureButton>
        </AIFeatures>

        {loading && (
          <LoadingSection>
            <Loader className="spinner" size={20} />
            <span>AI is thinking...</span>
          </LoadingSection>
        )}

        {result && (
          <ResultSection>
            <h4>Result:</h4>
            <ResultText>{result}</ResultText>
          </ResultSection>
        )}
      </AIPanel>
    </AIOverlay>
  );
};

const AIOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const AIPanel = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  
  .dark & {
    background: #1e293b;
    color: white;
  }
`;

const AIHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  
  h3 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  button {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.5rem;
    
    &:hover {
      background: rgba(0, 0, 0, 0.1);
    }
    
    .dark & {
      color: #9ca3af;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  }
`;

const AIFeatures = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const FeatureButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #3b82f6;
    color: white;
    transform: translateY(-1px);
  }
  
  .dark & {
    background: #334155;
    border: 1px solid #475569;
    color: white;
    
    &:hover {
      background: #3b82f6;
    }
  }
  
  span {
    font-weight: 500;
  }
`;

const LoadingSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f1f5f9;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  
  .dark & {
    background: #334155;
  }
  
  .spinner {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ResultSection = styled.div`
  h4 {
    margin: 0 0 0.75rem 0;
    font-size: 1.125rem;
    font-weight: 600;
  }
`;

const ResultText = styled.pre`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1rem;
  white-space: pre-wrap;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  line-height: 1.5;
  max-height: 300px;
  overflow-y: auto;
  
  .dark & {
    background: #334155;
    border: 1px solid #475569;
    color: white;
  }
`;

export default AIAssistant;
