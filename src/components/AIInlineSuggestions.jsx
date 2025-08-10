import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { aiService } from '../lib/aiService';
import { getAIStatus } from '../lib/envHelper';
import { 
  Lightbulb, 
  ArrowRight, 
  Zap,
  FileText,
  BookOpen,
  Brain,
  Code,
  Type,
  Sparkles,
  List,
  MessageSquare,
  Target
} from 'lucide-react';

const AIInlineSuggestions = ({ content, position, onInsert, onClose, selectedText = '' }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [contextMode, setContextMode] = useState('auto');
  const [aiReady, setAiReady] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const status = getAIStatus();
    setAiReady(status.status === 'ready');
    
    if (content && content.length > 20) {
      generateSuggestions();
    }
  }, [content]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (suggestions.length === 0) return;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setCurrentIndex(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setCurrentIndex(prev => Math.min(suggestions.length - 1, prev + 1));
          break;
        case 'Enter':
          e.preventDefault();
          handleInsert(suggestions[currentIndex]);
          break;
        case 'Escape':
          onClose();
          break;
        case 'Tab':
          e.preventDefault();
          setCurrentIndex(prev => (prev + 1) % suggestions.length);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [suggestions, currentIndex]);

  const generateSuggestions = async () => {
    if (loading || !aiReady) {
      generateFallbackSuggestions();
      return;
    }

    setLoading(true);
    try {
      // Intelligent content analysis
      const cleanContent = content.replace(/<[^>]*>/g, '').trim();
      const lastParagraph = cleanContent.split('\n').filter(p => p.trim()).slice(-1)[0] || '';
      const lastSentence = lastParagraph.split('.').slice(-1)[0]?.trim() || '';
      const wordCount = cleanContent.split(/\s+/).length;
      const hasSelectedText = selectedText && selectedText.length > 0;
      
      const suggestions = [];
      
      // Priority suggestions based on context
      if (hasSelectedText) {
        await generateSelectionBasedSuggestions(suggestions);
      } else {
        await generateContentBasedSuggestions(suggestions, cleanContent, lastSentence, wordCount);
      }
      
      // Sort by priority and limit
      suggestions.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
      });
      
      setSuggestions(suggestions.slice(0, 5)); // Show up to 5 suggestions
    } catch (error) {
      console.error('Error generating suggestions:', error);
      generateFallbackSuggestions();
    } finally {
      setLoading(false);
    }
  };

  const generateSelectionBasedSuggestions = async (suggestions) => {
    try {
      // Enhanced suggestions for selected text
      if (selectedText.length > 5 && selectedText.length < 200) {
        const enhancePrompt = `Improve this selected text while maintaining its meaning and context:\n\n"${selectedText}"`;
        const enhanced = await aiService.callAI(enhancePrompt);
        
        if (enhanced && enhanced.length < selectedText.length * 2) {
          suggestions.push({
            type: 'enhance',
            icon: Sparkles,
            title: 'Enhance Selected Text',
            content: enhanced.trim(),
            preview: enhanced.slice(0, 50) + '...',
            priority: 'high'
          });
        }
      }
      
      // Explain selected concept
      if (selectedText.length > 5 && selectedText.length < 100) {
        suggestions.push({
          type: 'explain',
          icon: Brain,
          title: 'Explain This',
          content: `\n\n**Explanation:** [AI will explain "${selectedText.slice(0, 30)}..."]`,
          preview: `Explain "${selectedText.slice(0, 30)}..."`,
          needsGeneration: true,
          priority: 'medium'
        });
      }
      
      // Expand on selected text
      suggestions.push({
        type: 'expand',
        icon: ArrowRight,
        title: 'Expand This Point',
        content: `\n\n**More details:** [AI will expand on "${selectedText.slice(0, 30)}..."]`,
        preview: `Expand on "${selectedText.slice(0, 30)}..."`,
        needsGeneration: true,
        priority: 'medium'
      });

      // Format options
      suggestions.push({
        type: 'format-bold',
        icon: Type,
        title: 'Make Bold',
        content: `**${selectedText}**`,
        preview: 'Apply bold formatting...',
        priority: 'low'
      });

    } catch (error) {
      console.warn('Failed to generate selection-based suggestions:', error);
    }
  };

  const generateContentBasedSuggestions = async (suggestions, cleanContent, lastSentence, wordCount) => {
    // Smart continuation based on writing pattern
    if (lastSentence && lastSentence.length > 10 && !lastSentence.endsWith('.')) {
      try {
        const continuationPrompt = `Complete this unfinished sentence naturally and concisely:\n\n"${lastSentence}"`;
        const completion = await aiService.callAI(continuationPrompt);
        
        if (completion && completion.length < 150) {
          suggestions.push({
            type: 'complete',
            icon: ArrowRight,
            title: 'Complete Sentence',
            content: completion.replace(lastSentence, '').trim(),
            preview: completion.slice(0, 60) + '...',
            priority: 'high'
          });
        }
      } catch (error) {
        console.warn('Failed to generate completion:', error);
      }
    }
    
    // Intelligent next paragraph suggestion
    if (lastSentence && lastSentence.endsWith('.') && wordCount > 50) {
      try {
        const nextPrompt = `Based on this context, suggest the next logical paragraph or section:\n\n"${cleanContent.slice(-300)}"`;
        const nextParagraph = await aiService.callAI(nextPrompt);
        
        if (nextParagraph && nextParagraph.length < 300) {
          suggestions.push({
            type: 'continue',
            icon: FileText,
            title: 'Continue Writing',
            content: `\n\n${nextParagraph.trim()}`,
            preview: nextParagraph.slice(0, 60) + '...',
            priority: 'high'
          });
        }
      } catch (error) {
        console.warn('Failed to generate continuation:', error);
      }
    }
    
    // Content-specific suggestions
    await generateContextSpecificSuggestions(suggestions, cleanContent);
  };

  const generateContextSpecificSuggestions = async (suggestions, content) => {
    // Code-specific suggestions
    if (content.includes('def ') || content.includes('function') || content.includes('class ')) {
      suggestions.push({
        type: 'code-comment',
        icon: Code,
        title: 'Add Code Comments',
        content: '\n\n// [AI will add helpful comments]',
        preview: 'Add explanatory comments...',
        needsGeneration: true,
        priority: 'medium'
      });
      
      suggestions.push({
        type: 'code-example',
        icon: Lightbulb,
        title: 'Usage Example',
        content: '\n\n**Example Usage:**\n[AI will provide usage example]',
        preview: 'Show how to use this code...',
        needsGeneration: true,
        priority: 'medium'
      });
    }
    
    // List continuation
    if (content.match(/\d+\./g) && content.match(/\d+\./g).length >= 2) {
      const numbers = content.match(/\d+/g).map(Number);
      const lastNumber = Math.max(...numbers);
      suggestions.push({
        type: 'list-item',
        icon: List,
        title: `Add Item ${lastNumber + 1}`,
        content: `\n${lastNumber + 1}. [Next logical item]`,
        preview: `Continue numbered list...`,
        needsGeneration: true,
        priority: 'high'
      });
    }
    
    // Question answering
    if (content.includes('?') && !content.toLowerCase().includes('answer')) {
      suggestions.push({
        type: 'answer',
        icon: MessageSquare,
        title: 'Answer Questions',
        content: '\n\n**Answer:** [AI will provide answers]',
        preview: 'Answer the questions in the text...',
        needsGeneration: true,
        priority: 'medium'
      });
    }
    
    // Key points extraction
    if (content.length > 200) {
      suggestions.push({
        type: 'key-points',
        icon: Target,
        title: 'Key Points',
        content: '\n\n**Key Points:**\n[AI will extract key points]',
        preview: 'Extract main points...',
        needsGeneration: true,
        priority: 'low'
      });
    }
    
    // Summary for long content
    if (content.length > 400) {
      suggestions.push({
        type: 'summary',
        icon: FileText,
        title: 'Add Summary',
        content: '\n\n**Summary:**\n[AI will generate summary here]',
        preview: 'Add a summary section...',
        needsGeneration: true,
        priority: 'medium'
      });
    }
  };

  const generateFallbackSuggestions = () => {
    const fallbackSuggestions = [];

    if (selectedText) {
      fallbackSuggestions.push({
        type: 'format-bold',
        icon: Type,
        title: 'Make Bold',
        content: `**${selectedText}**`,
        preview: 'Apply bold formatting...',
        priority: 'medium'
      });
      
      fallbackSuggestions.push({
        type: 'format-italic',
        icon: Type,
        title: 'Make Italic',
        content: `*${selectedText}*`,
        preview: 'Apply italic formatting...',
        priority: 'low'
      });
    }

    if (content.length > 200) {
      fallbackSuggestions.push({
        type: 'structure',
        icon: Brain,
        title: 'Add Section',
        content: '\n\n## Next Section\n[Add content here]',
        preview: 'Add section heading...',
        priority: 'low'
      });
    }

    fallbackSuggestions.push({
      type: 'note',
      icon: Lightbulb,
      title: 'Add Note',
      content: '\n\n> **Note:** [Add important note here]',
      preview: 'Add important note...',
      priority: 'low'
    });

    setSuggestions(fallbackSuggestions);
  };

  const handleInsert = async (suggestion) => {
    if (suggestion.needsGeneration) {
      setLoading(true);
      try {
        const contextualContent = selectedText || content.slice(-500);
        let generatedContent = '';
        
        switch (suggestion.type) {
          case 'explain':
            generatedContent = await aiService.callAI(`Explain this concept clearly and concisely: "${selectedText}"`);
            suggestion.content = `\n\n**Explanation:** ${generatedContent}`;
            break;
          case 'expand':
            generatedContent = await aiService.callAI(`Expand on this point with more details and examples: "${selectedText}"`);
            suggestion.content = `\n\n**More details:** ${generatedContent}`;
            break;
          case 'code-comment':
            generatedContent = await aiService.callAI(`Add helpful inline comments to this code:\n\n${content}`);
            suggestion.content = generatedContent;
            break;
          case 'code-example':
            generatedContent = await aiService.callAI(`Provide a practical usage example for this code:\n\n${contextualContent}`);
            suggestion.content = `\n\n**Example Usage:**\n${generatedContent}`;
            break;
          case 'list-item':
            generatedContent = await aiService.callAI(`Based on this list context, suggest the next logical item:\n\n${contextualContent}`);
            const numbers = content.match(/\d+/g).map(Number);
            const lastNumber = Math.max(...numbers);
            suggestion.content = `\n${lastNumber + 1}. ${generatedContent}`;
            break;
          case 'answer':
            generatedContent = await aiService.callAI(`Answer the questions found in this text:\n\n${content}`);
            suggestion.content = `\n\n**Answer:** ${generatedContent}`;
            break;
          case 'key-points':
            generatedContent = await aiService.callAI(`Extract 3-5 key points from this content in bullet format:\n\n${content}`);
            suggestion.content = `\n\n**Key Points:**\n${generatedContent}`;
            break;
          case 'summary':
            generatedContent = await aiService.summarizeNotes(content);
            suggestion.content = `\n\n**Summary:**\n${generatedContent}`;
            break;
        }
      } catch (error) {
        console.error('Error generating content:', error);
        suggestion.content = suggestion.content.replace('[AI will', '[Please add');
      } finally {
        setLoading(false);
      }
    }

    onInsert(suggestion.content);
    onClose();
  };

  if (!suggestions.length || !position) return null;

  return (
    <SuggestionsContainer 
      ref={containerRef}
      style={{
        left: position.x,
        top: position.y
      }}
    >
      <Header>
        <Zap size={14} />
        <span>AI Suggestions</span>
        {!aiReady && <StatusBadge>Offline</StatusBadge>}
      </Header>
      
      <SuggestionsList>
        {suggestions.map((suggestion, index) => (
          <SuggestionItem
            key={index}
            $active={index === currentIndex}
            $priority={suggestion.priority}
            onClick={() => handleInsert(suggestion)}
          >
            <suggestion.icon size={16} />
            <div className="content">
              <div className="title">
                {suggestion.title}
                {suggestion.priority === 'high' && <PriorityBadge>🔥</PriorityBadge>}
              </div>
              <div className="preview">{suggestion.preview}</div>
            </div>
            <div className="hint">
              {index === currentIndex && <KeyHint>↵</KeyHint>}
            </div>
          </SuggestionItem>
        ))}
      </SuggestionsList>
      
      <Footer>
        <span>↑↓ navigate • ↵ insert • Tab cycle • Esc close</span>
      </Footer>
    </SuggestionsContainer>
  );
};

const SuggestionsContainer = styled.div`
  position: fixed;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 320px;
  max-width: 420px;
  overflow: hidden;
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

const Header = styled.div`
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

const SuggestionsList = styled.div`
  max-height: 280px;
  overflow-y: auto;
`;

const SuggestionItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 1rem;
  text-align: left;
  transition: all 0.2s;
  border-left: 3px solid transparent;

  ${props => props.$active ? `
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.05));
    border-left-color: #3b82f6;
  ` : `
    &:hover {
      background: rgba(0, 0, 0, 0.05);

      .dark & {
        background: rgba(255, 255, 255, 0.05);
      }
    }
  `}

  ${props => props.$priority === 'high' && `
    border-left-color: #f59e0b;
  `}

  .content {
    flex: 1;
  }

  .title {
    font-weight: 500;
    font-size: 0.875rem;
    color: #374151;
    margin-bottom: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .dark & {
      color: #d1d5db;
    }
  }

  .preview {
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.4;

    .dark & {
      color: #9ca3af;
    }
  }

  .hint {
    opacity: ${props => props.$active ? 1 : 0};
    transition: opacity 0.2s;
  }
`;

const PriorityBadge = styled.span`
  font-size: 0.7rem;
`;

const KeyHint = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
`;

const Footer = styled.div`
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.02);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 0.7rem;
  color: #6b7280;
  
  .dark & {
    background: rgba(255, 255, 255, 0.02);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    color: #9ca3af;
  }
`;

export default AIInlineSuggestions;
