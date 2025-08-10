import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { aiService } from '../lib/aiService';
import { getAIStatus } from '../lib/envHelper';
import { 
  Sparkles, 
  BookOpen, 
  FileText, 
  Lightbulb, 
  Settings,
  X,
  Loader,
  ChevronDown,
  ChevronRight,
  Send,
  History,
  Wand2,
  Brain,
  MessageSquare,
  Code,
  Search,
  Zap
} from 'lucide-react';

const AISidebar = ({ isOpen, onClose, notes = [], currentNote = null, selectedText = '', onApplyText, onUpdateNote }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tools');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [aiStatus, setAiStatus] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    quickActions: false,
    suggestions: false,
    contextualActions: false,
    controls: false,
    analysis: false
  });
  const [contextualActions, setContextualActions] = useState([]);
  const [writingTone, setWritingTone] = useState('professional');
  const [contentAnalysis, setContentAnalysis] = useState(null);
  const [showNoteSelector, setShowNoteSelector] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedNoteForAction, setSelectedNoteForAction] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);


  useEffect(() => {
    // Check AI configuration status when sidebar opens
    if (isOpen) {
      setAiStatus(getAIStatus());
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K to trigger quick action
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && isOpen) {
        e.preventDefault();
        if (currentNote?.content) {
          handleQuickAction('improve-writing');
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, currentNote]);

  // Generate contextual suggestions based on content
  useEffect(() => {
    if (isOpen && currentNote?.content) {
      generateSuggestions();
      analyzeContent();
      generateContextualActions();
    }
  }, [isOpen, currentNote?.content]);


  const analyzeContent = async () => {
    if (!currentNote?.content) return;

    try {
      const content = currentNote.content.replace(/<[^>]*>/g, '').slice(0, 1000);
      const analysis = {
        wordCount: content.split(/\s+/).filter(w => w.length > 0).length,
        readingTime: Math.ceil(content.split(/\s+/).length / 200),
        contentType: detectContentType(content),
        complexity: analyzeComplexity(content),
        completeness: analyzeCompleteness(content)
      };
      setContentAnalysis(analysis);
    } catch (error) {
      console.warn('Content analysis failed:', error);
    }
  };

  const detectContentType = (content) => {
    if (content.includes('def ') || content.includes('function') || content.includes('class ')) return 'code';
    if (content.includes('# ') || content.includes('## ')) return 'documentation';
    if (content.match(/\d+\.\s/) || content.includes('Step ')) return 'tutorial';
    if (content.includes('TODO') || content.includes('- [ ]')) return 'planning';
    return 'general';
  };

  const analyzeComplexity = (content) => {
    const avgSentenceLength = content.split(/[.!?]/).reduce((acc, s) => acc + s.length, 0) / content.split(/[.!?]/).length;
    return avgSentenceLength > 100 ? 'high' : avgSentenceLength > 50 ? 'medium' : 'low';
  };

  const analyzeCompleteness = (content) => {
    const hasIntro = content.length > 100;
    const hasConclusion = content.toLowerCase().includes('conclusion') || content.toLowerCase().includes('summary');
    const hasStructure = content.includes('#') || content.match(/\d+\./);
    return { hasIntro, hasConclusion, hasStructure };
  };

  const generateContextualActions = () => {
    if (!currentNote?.content) return;

    const content = currentNote.content.replace(/<[^>]*>/g, '');
    const actions = [];

    // Smart contextual actions based on content analysis
    if (contentAnalysis?.contentType === 'code') {
      actions.push({
        icon: Code,
        title: 'Explain Code Logic',
        description: 'Break down the code flow and purpose',
        action: () => handleSmartAction('explain-code-logic')
      });
      actions.push({
        icon: Zap,
        title: 'Suggest Optimizations',
        description: 'Find performance improvements',
        action: () => handleSmartAction('optimize-code')
      });
    }

    if (contentAnalysis?.completeness && !contentAnalysis.completeness.hasConclusion) {
      actions.push({
        icon: FileText,
        title: 'Add Conclusion',
        description: 'Wrap up with key takeaways',
        action: () => handleSmartAction('add-conclusion')
      });
    }

    if (contentAnalysis?.complexity === 'high') {
      actions.push({
        icon: Brain,
        title: 'Simplify Language',
        description: 'Make content more accessible',
        action: () => handleSmartAction('simplify-content')
      });
    }

    if (content.length > 300 && !content.includes('tl;dr') && !content.includes('summary')) {
      actions.push({
        icon: Zap,
        title: 'Add TL;DR',
        description: 'Quick summary at the top',
        action: () => handleSmartAction('add-tldr')
      });
    }

    setContextualActions(actions.slice(0, 3));
  };

  const generateSuggestions = async () => {
    if (!currentNote?.content) return;

    const content = currentNote.content.slice(0, 500); // First 500 chars for context
    const suggestions = [];

    // Contextual suggestions based on content type
    if (content.includes('def ') || content.includes('function') || content.includes('class')) {
      suggestions.push({
        icon: Code,
        title: 'Explain Code',
        description: 'Get explanation of the code structure',
        action: () => handleQuickAction('explain-code')
      });
      suggestions.push({
        icon: Zap,
        title: 'Optimize Code',
        description: 'Suggest code improvements',
        action: () => handleQuickAction('optimize-code')
      });
    }

    if (content.length > 100) {
      suggestions.push({
        icon: FileText,
        title: 'Summarize',
        description: 'Create a concise summary',
        action: () => handleQuickAction('summarize')
      });
    }

    if (content.includes('TODO') || content.includes('FIXME')) {
      suggestions.push({
        icon: Brain,
        title: 'Action Items',
        description: 'Extract and organize tasks',
        action: () => handleQuickAction('extract-tasks')
      });
    }

    suggestions.push({
      icon: Lightbulb,
      title: 'Related Topics',
      description: 'Discover related concepts',
      action: () => handleQuickAction('related-topics')
    });

    setSuggestions(suggestions.slice(0, 4)); // Increased to 4 suggestions
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;

    // Check AI status before proceeding
    const currentStatus = getAIStatus();
    if (currentStatus.status !== 'ready') {
      const errorMessage = {
        type: 'setup',
        content: currentStatus.instructions,
        timestamp: Date.now()
      };
      setChatHistory(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage = chatInput.trim();
    setChatInput('');

    // Add user message to history
    const newHistory = [...chatHistory, { type: 'user', content: userMessage, timestamp: Date.now() }];
    setChatHistory(newHistory);
    setLoading(true);

    try {
      // Create context-aware prompt
      let context = '';
      if (currentNote?.content) {
        context = `Current note content: "${currentNote.content.slice(0, 300)}..."`;
      }
      if (selectedText) {
        context += `\nSelected text: "${selectedText}"`;
      }

      const prompt = context ? `${context}\n\nUser question: ${userMessage}` : userMessage;
      const response = await aiService.callAI(prompt);

      setChatHistory([...newHistory, {
        type: 'assistant',
        content: response,
        timestamp: Date.now()
      }]);
    } catch (error) {
      setChatHistory([...newHistory, {
        type: 'error',
        content: `Error: ${error.message}`,
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickActionWithNoteSelector = (action) => {
    setSelectedAction(action);
    setShowNoteSelector(true);
  };

  const executeActionOnNote = async (action, targetNote) => {
    // Check AI status before proceeding
    const currentStatus = getAIStatus();
    if (currentStatus.status !== 'ready') {
      const errorMessage = {
        type: 'setup',
        content: currentStatus.instructions,
        timestamp: Date.now()
      };
      setChatHistory(prev => [...prev, errorMessage]);
      return;
    }

    setLoading(true);
    try {
      const enhancedPrompt = `Context: This is a ${contentAnalysis?.contentType || 'general'} document with ${contentAnalysis?.wordCount || 0} words. Writing tone should be ${writingTone}.\n\n`;

      let result = '';

      switch (action) {
        case 'summarize':
          result = await aiService.summarizeNotes(targetNote.content);
          break;
        case 'improve-writing':
          result = await aiService.callAI(enhancedPrompt + `Improve this text for clarity, grammar, and style while maintaining the original meaning. Use ${writingTone} tone:\n\n${targetNote.content}`);
          break;
        case 'flashcards':
          result = await aiService.generateFlashcards(targetNote.content);
          // Navigate to dedicated flashcard page
          navigate('/flashcards', {
            state: {
              flashCards: result,
              title: `${targetNote.title || 'Untitled'} - Flashcards`
            }
          });
          setShowNoteSelector(false);
          setSelectedAction(null);
          setSelectedNoteForAction(null);
          setLoading(false);
          onClose(); // Close sidebar when navigating
          return; // Exit early to avoid adding to chat history
        case 'related-topics':
          result = await aiService.discoverRelatedTopics(targetNote.content);
          break;
        default:
          result = 'Action not supported';
      }

      setChatHistory(prev => [...prev, {
        type: 'assistant',
        content: `**Action: ${action} on "${targetNote.title || 'Untitled'}"**\n\n${result}`,
        timestamp: Date.now(),
        action: action,
        targetNote: targetNote.title || 'Untitled'
      }]);
    } catch (error) {
      setChatHistory(prev => [...prev, {
        type: 'error',
        content: `Error performing ${action} on "${targetNote.title || 'Untitled'}": ${error.message}`,
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
      setShowNoteSelector(false);
      setSelectedAction(null);
      setSelectedNoteForAction(null);
    }
  };

  const applyPreviewToNote = () => {
    if (previewContent && onUpdateNote && currentNote) {
      onUpdateNote({
        ...currentNote,
        content: previewContent
      });

      // Add confirmation message to chat
      setChatHistory(prev => [...prev, {
        type: 'assistant',
        content: '✅ Changes applied to your note successfully!',
        timestamp: Date.now()
      }]);

      // Clear preview
      setPreviewContent(null);
      setShowPreview(false);
      setPendingAction(null);
    }
  };

  const handleSmartAction = async (action) => {
    if (!currentNote?.content) return;

    setLoading(true);
    try {
      let result = '';

      const enhancedPrompt = `Context: This is a ${contentAnalysis?.contentType || 'general'} document with ${contentAnalysis?.wordCount || 0} words. Writing tone should be ${writingTone}.\n\n`;

      switch (action) {
        case 'explain-code-logic':
          result = await aiService.callAI(enhancedPrompt + `Explain the logic and flow of this code in simple terms:\n\n${currentNote.content}`);
          break;
        case 'optimize-code':
          result = await aiService.callAI(enhancedPrompt + `Suggest specific optimizations for this code. Focus on performance, readability, and best practices:\n\n${currentNote.content}`);
          break;
        case 'add-conclusion':
          result = await aiService.callAI(enhancedPrompt + `Write a compelling conclusion for this content that summarizes key points and provides actionable takeaways:\n\n${currentNote.content}`);
          // Show preview for content-modifying actions
          if (onUpdateNote) {
            setPreviewContent(currentNote.content + '\n\n' + result);
            setShowPreview(true);
            setPendingAction(action);
            setLoading(false);
            return;
          }
          break;
        case 'simplify-content':
          result = await aiService.callAI(enhancedPrompt + `Rewrite this content using simpler language while maintaining all key information:\n\n${currentNote.content}`);
          // Show preview for content replacement
          if (onUpdateNote) {
            setPreviewContent(result);
            setShowPreview(true);
            setPendingAction(action);
            setLoading(false);
            return;
          }
          break;
        case 'add-tldr':
          result = await aiService.callAI(enhancedPrompt + `Create a concise TL;DR (too long; didn't read) summary for this content. Format as bullet points:\n\n${currentNote.content}`);
          // Show preview for content addition
          if (onUpdateNote) {
            setPreviewContent(result + '\n\n' + currentNote.content);
            setShowPreview(true);
            setPendingAction(action);
            setLoading(false);
            return;
          }
          break;
      }

      setChatHistory(prev => [...prev, {
        type: 'assistant',
        content: result,
        timestamp: Date.now(),
        action: action
      }]);
    } catch (error) {
      setChatHistory(prev => [...prev, {
        type: 'error',
        content: `Error: ${error.message}`,
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (action) => {
    if (!currentNote?.content && action !== 'organize') return;

    // Check AI status before proceeding
    const currentStatus = getAIStatus();
    if (currentStatus.status !== 'ready') {
      const errorMessage = {
        type: 'setup',
        content: currentStatus.instructions,
        timestamp: Date.now()
      };
      setChatHistory(prev => [...prev, errorMessage]);
      return;
    }

    setLoading(true);
    try {
      let result = '';
      
      switch (action) {
        case 'explain-code':
          result = await aiService.callAI(`Explain this code in detail:\n\n${selectedText || currentNote.content}`);
          break;
        case 'optimize-code':
          result = await aiService.callAI(`Suggest optimizations for this code:\n\n${selectedText || currentNote.content}`);
          break;
        case 'summarize':
          result = await aiService.summarizeNotes(selectedText || currentNote.content);
          break;
        case 'extract-tasks':
          result = await aiService.callAI(`Extract all action items, TODOs, and tasks from this content:\n\n${currentNote.content}`);
          break;
        case 'related-topics':
          result = await aiService.discoverRelatedTopics(currentNote.content);
          break;
        case 'improve-writing':
          result = await aiService.improveWriting(selectedText || currentNote.content);
          if (selectedText && onApplyText) {
            onApplyText(result);
            setLoading(false);
            return;
          }
          // Apply improvement directly to note content
          if (onUpdateNote && currentNote) {
            onUpdateNote({
              ...currentNote,
              content: result
            });
            setLoading(false);
            return;
          }
          break;
        case 'flashcards':
          result = await aiService.generateFlashcards(currentNote.content);
          // Navigate to dedicated flashcard page
          navigate('/flashcards', {
            state: {
              flashCards: result,
              title: `${currentNote.title || 'Untitled'} - Flashcards`
            }
          });
          setLoading(false);
          onClose(); // Close sidebar when navigating
          return; // Exit early to avoid adding to chat history
        case 'organize':
        result = await aiService.optimizeNoteOrganization(notes);
        break;
      case 'explain-code-logic':
        result = await aiService.callAI(`Explain the logic and flow of this code in simple terms:\n\n${currentNote.content}`);
        break;
      case 'optimize-code':
        result = await aiService.callAI(`Suggest specific optimizations for this code. Focus on performance, readability, and best practices:\n\n${currentNote.content}`);
        break;
      case 'add-conclusion':
        result = await aiService.callAI(`Write a compelling conclusion for this content that summarizes key points and provides actionable takeaways:\n\n${currentNote.content}`);
        break;
      case 'simplify-content':
        result = await aiService.callAI(`Rewrite this content using simpler language while maintaining all key information. Tone: ${writingTone}:\n\n${currentNote.content}`);
        break;
      case 'add-tldr':
        result = await aiService.callAI(`Create a concise TL;DR (too long; didn't read) summary for this content. Format as bullet points:\n\n${currentNote.content}`);
        break;
      }

      setChatHistory(prev => [...prev, {
        type: 'assistant',
        content: result,
        timestamp: Date.now(),
        action: action
      }]);
    } catch (error) {
      setChatHistory(prev => [...prev, {
        type: 'error',
        content: `Error: ${error.message}`,
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!isOpen) return null;

  return (
    <SidebarContainer>
      <SidebarHeader>
        <TabContainer data-tab-container>
          <Tab
            data-tab="chat"
            $active={activeTab === 'chat'}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={16} />
            Chat
          </Tab>
          <Tab
            data-tab="tools"
            $active={activeTab === 'tools'}
            onClick={() => setActiveTab('tools')}
          >
            <Wand2 size={16} />
            Tools
          </Tab>
        </TabContainer>
        <CloseButton onClick={onClose}>
          <X size={20} />
        </CloseButton>
      </SidebarHeader>

      {/* Tools Container */}
      {activeTab === 'tools' && (
        <ToolsContainer>
          {/* Quick Actions */}
          <Section>
            <SectionHeader onClick={() => toggleSection('quickActions')}>
              {expandedSections.quickActions ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <Zap size={16} />
              Quick Actions
            </SectionHeader>
            {expandedSections.quickActions && (
              <SectionContent>
                <QuickAction onClick={() => currentNote ? handleQuickAction('summarize') : handleQuickActionWithNoteSelector('summarize')}>
                  <FileText size={16} />
                  <div>
                    <div className="title">Summarize</div>
                    <div className="desc">Create summary</div>
                  </div>
                </QuickAction>
                <QuickAction onClick={() => currentNote ? handleQuickAction('improve-writing') : handleQuickActionWithNoteSelector('improve-writing')}>
                  <Sparkles size={16} />
                  <div>
                    <div className="title">Improve Writing</div>
                    <div className="desc">Enhance clarity</div>
                  </div>
                </QuickAction>
                <QuickAction onClick={() => currentNote ? handleQuickAction('flashcards') : handleQuickActionWithNoteSelector('flashcards')}>
                  <BookOpen size={16} />
                  <div>
                    <div className="title">Flashcards</div>
                    <div className="desc">Generate study cards</div>
                  </div>
                </QuickAction>
              </SectionContent>
            )}
          </Section>

          {/* Content Analysis */}
          {contentAnalysis && (
            <Section>
              <SectionHeader onClick={() => toggleSection('analysis')}>
                {expandedSections.analysis ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <Search size={16} />
                Content Analysis
              </SectionHeader>
              {expandedSections.analysis && (
                <SectionContent>
                  <AnalysisGrid>
                    <AnalysisItem>
                      <span className="label">Words:</span>
                      <span className="value">{contentAnalysis.wordCount}</span>
                    </AnalysisItem>
                    <AnalysisItem>
                      <span className="label">Reading Time:</span>
                      <span className="value">{contentAnalysis.readingTime}m</span>
                    </AnalysisItem>
                    <AnalysisItem>
                      <span className="label">Type:</span>
                      <span className="value">{contentAnalysis.contentType}</span>
                    </AnalysisItem>
                    <AnalysisItem>
                      <span className="label">Complexity:</span>
                      <span className={`value ${contentAnalysis.complexity}`}>{contentAnalysis.complexity}</span>
                    </AnalysisItem>
                  </AnalysisGrid>
                </SectionContent>
              )}
            </Section>
          )}

          {/* Contextual AI Actions */}
          {contextualActions.length > 0 && (
            <Section>
              <SectionHeader onClick={() => toggleSection('contextualActions')}>
                {expandedSections.contextualActions ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <Brain size={16} />
                Smart Suggestions
              </SectionHeader>
              {expandedSections.contextualActions && (
                <SectionContent>
                  {contextualActions.map((action, index) => (
                    <QuickAction key={index} onClick={action.action}>
                      <action.icon size={16} />
                      <div>
                        <div className="title">{action.title}</div>
                        <div className="desc">{action.description}</div>
                      </div>
                    </QuickAction>
                  ))}
                </SectionContent>
              )}
            </Section>
          )}

          {/* Smart Suggestions */}
          {suggestions.length > 0 && (
            <Section>
              <SectionHeader onClick={() => toggleSection('suggestions')}>
                {expandedSections.suggestions ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <Sparkles size={16} />
                Quick Actions
              </SectionHeader>
              {expandedSections.suggestions && (
                <SectionContent>
                  {suggestions.map((suggestion, index) => (
                    <QuickAction key={index} onClick={suggestion.action}>
                      <suggestion.icon size={16} />
                      <div>
                        <div className="title">{suggestion.title}</div>
                        <div className="desc">{suggestion.description}</div>
                      </div>
                    </QuickAction>
                  ))}
                </SectionContent>
              )}
            </Section>
          )}

          {/* Writing Controls */}
          <Section>
            <SectionHeader onClick={() => toggleSection('controls')}>
              {expandedSections.controls ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <Settings size={16} />
              AI Settings
            </SectionHeader>
            {expandedSections.controls && (
              <SectionContent>
                <ControlGroup>
                  <ControlLabel>Writing Tone:</ControlLabel>
                  <ToneSelector value={writingTone} onChange={(e) => setWritingTone(e.target.value)}>
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="academic">Academic</option>
                    <option value="creative">Creative</option>
                    <option value="technical">Technical</option>
                  </ToneSelector>
                </ControlGroup>
              </SectionContent>
            )}
          </Section>

        </ToolsContainer>
      )}

      {/* Chat Container */}
      {activeTab === 'chat' && (
        <ChatContainer>
          <ChatHistory>
            {chatHistory.length === 0 && (
              <WelcomeMessage>
                <Sparkles size={32} />
                <h3>AI Assistant</h3>
                {aiStatus?.status === 'ready' ? (
                  <p>Ask me anything about your notes, code, or get help with writing!</p>
                ) : (
                  <div>
                    <p className="setup-message">⚠️ AI Setup Required</p>
                    <p className="setup-instructions">
                      To use AI features, you need to configure API keys.
                      Contact your administrator or check the documentation for setup instructions.
                    </p>
                  </div>
                )}
              </WelcomeMessage>
            )}

            {chatHistory.map((message, index) => (
              <ChatMessage key={index} $type={message.type}>
                <MessageContent $type={message.type}>
                  {message.type === 'user' && <span className="label">You</span>}
                  {message.type === 'assistant' && <span className="label">AI</span>}
                  {message.type === 'error' && <span className="label">Error</span>}
                  <div className="content">{message.content}</div>
                </MessageContent>
              </ChatMessage>
            ))}

            {loading && (
              <ChatMessage $type="assistant">
                <MessageContent $type="assistant">
                  <span className="label">AI</span>
                  <div className="loading">
                    <Loader className="spinner" size={16} />
                    Thinking...
                  </div>
                </MessageContent>
              </ChatMessage>
            )}
            <div ref={chatEndRef} />
          </ChatHistory>

          <ChatInputContainer>
            <ChatInputWrapper>
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask anything..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                disabled={loading || (aiStatus?.status !== 'ready')}
              />
              <SendButton onClick={handleChat} disabled={loading || !chatInput.trim() || (aiStatus?.status !== 'ready')}>
                <Send size={16} />
              </SendButton>
            </ChatInputWrapper>
          </ChatInputContainer>
        </ChatContainer>
      )}

      {/* Note Selector Modal */}
      {showNoteSelector && (
        <NoteSelectorOverlay onClick={() => setShowNoteSelector(false)}>
          <NoteSelectorModal onClick={(e) => e.stopPropagation()}>
            <NoteSelectorHeader>
              <h3>Select Note for {selectedAction}</h3>
              <CloseButton onClick={() => setShowNoteSelector(false)}>
                <X size={16} />
              </CloseButton>
            </NoteSelectorHeader>
            <NoteSelectorContent>
              {notes.length === 0 ? (
                <EmptyState>No notes available</EmptyState>
              ) : (
                notes.map((note) => (
                  <NoteItem
                    key={note.id}
                    onClick={() => {
                      setSelectedNoteForAction(note);
                      executeActionOnNote(selectedAction, note);
                    }}
                    $selected={selectedNoteForAction?.id === note.id}
                  >
                    <NoteTitle>{note.title || 'Untitled'}</NoteTitle>
                    <NotePreview>{note.content?.substring(0, 100)}...</NotePreview>
                    <NoteInfo>{note.content?.length || 0} characters</NoteInfo>
                  </NoteItem>
                ))
              )}
            </NoteSelectorContent>
            {currentNote && (
              <NoteSelectorFooter>
                <QuickAction onClick={() => {
                  setSelectedNoteForAction(currentNote);
                  executeActionOnNote(selectedAction, currentNote);
                }}>
                  <FileText size={16} />
                  <div>
                    <div className="title">Use Current Note</div>
                    <div className="desc">{currentNote.title || 'Untitled'}</div>
                  </div>
                </QuickAction>
              </NoteSelectorFooter>
            )}
          </NoteSelectorModal>
        </NoteSelectorOverlay>
      )}

      {/* Preview Modal */}
      {showPreview && previewContent && (
        <PreviewOverlay onClick={() => setShowPreview(false)}>
          <PreviewModal onClick={(e) => e.stopPropagation()}>
            <PreviewHeader>
              <h3>Preview Changes - {pendingAction}</h3>
              <CloseButton onClick={() => setShowPreview(false)}>
                <X size={16} />
              </CloseButton>
            </PreviewHeader>
            <PreviewContent>
              <PreviewText>{previewContent}</PreviewText>
            </PreviewContent>
            <PreviewFooter>
              <PreviewButton
                onClick={() => {
                  setShowPreview(false);
                  setPreviewContent(null);
                  setPendingAction(null);
                }}
                $secondary
              >
                Cancel
              </PreviewButton>
              <PreviewButton onClick={applyPreviewToNote}>
                Apply Changes
              </PreviewButton>
            </PreviewFooter>
          </PreviewModal>
        </PreviewOverlay>
      )}

    </SidebarContainer>
  );
};

const SidebarContainer = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: 380px;
  height: 100vh;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-left: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 100;
  
  .dark & {
    background: rgba(15, 23, 42, 0.95);
    border-left: 1px solid rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);

  .dark & {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  color: #1f2937;

  .dark & {
    color: #f9fafb;
  }
`;

const TabContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Tab = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s;

  ${props => props.$active ? `
    background: #3b82f6;
    color: white;
  ` : `
    background: rgba(0, 0, 0, 0.05);
    color: #6b7280;

    &:hover {
      background: rgba(0, 0, 0, 0.1);
    }

    .dark & {
      background: rgba(255, 255, 255, 0.05);
      color: #9ca3af;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  `}
`;

const CloseButton = styled.button`
  padding: 0.5rem;
  border-radius: 0.5rem;
  color: #6b7280;
  
  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
  
  .dark & {
    color: #9ca3af;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
`;

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
`;

const ChatHistory = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const WelcomeMessage = styled.div`
  text-align: center;
  padding: 2rem 1rem;
  color: #6b7280;

  h3 {
    margin: 1rem 0 0.5rem 0;
    color: #111827;

    .dark & {
      color: #f9fafb;
    }
  }

  p {
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .setup-message {
    font-weight: 600;
    color: #f59e0b;
    margin-bottom: 0.5rem;
  }

  .setup-instructions {
    font-size: 0.8rem;
    color: #6b7280;
    background: rgba(245, 158, 11, 0.1);
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(245, 158, 11, 0.2);
    text-align: left;

    .dark & {
      background: rgba(245, 158, 11, 0.1);
      color: #9ca3af;
    }
  }
`;

const ChatMessage = styled.div`
  display: flex;
  ${props => props.$type === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
`;

const MessageContent = styled.div`
  max-width: 80%;

  .label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    margin-bottom: 0.25rem;
    display: block;
  }

  .content {
    padding: 0.75rem 1rem;
    border-radius: 1rem;
    font-size: 0.875rem;
    line-height: 1.5;
    white-space: pre-wrap;

    ${props => props.$type === 'user' ? `
      background: #3b82f6;
      color: white;
      border-bottom-right-radius: 0.25rem;
    ` : props.$type === 'error' ? `
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
      border: 1px solid rgba(239, 68, 68, 0.2);
    ` : props.$type === 'setup' ? `
      background: rgba(245, 158, 11, 0.1);
      color: #92400e;
      border: 1px solid rgba(245, 158, 11, 0.2);
      white-space: pre-line;
    ` : `
      background: rgba(0, 0, 0, 0.05);
      color: #374151;
      border-bottom-left-radius: 0.25rem;

      .dark & {
        background: rgba(255, 255, 255, 0.05);
        color: #d1d5db;
      }
    `}
  }

  .loading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #6b7280;

    .spinner {
      animation: spin 1s linear infinite;
    }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ChatInputContainer = styled.div`
  padding: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  
  .dark & {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const ChatInputWrapper = styled.div`
  display: flex;
  gap: 0.5rem;
  
  input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.75rem;
    background: rgba(255, 255, 255, 0.8);
    
    &:focus {
      outline: none;
      border-color: #3b82f6;
    }
    
    .dark & {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #f9fafb;
    }
  }
`;

const SendButton = styled.button`
  padding: 0.75rem;
  background: #3b82f6;
  color: white;
  border-radius: 0.75rem;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #2563eb;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ToolsContainer = styled.div`
  padding: 1rem;
  height: calc(100vh - 80px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Section = styled.div`
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  overflow: hidden;
  
  .dark & {
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const SectionHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.02);
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  
  .dark & {
    background: rgba(255, 255, 255, 0.02);
    color: #d1d5db;
    
    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }
  }
`;

const SectionContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const QuickAction = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  text-align: left;
  transition: all 0.2s;

  &:hover {
    background: rgba(59, 130, 246, 0.1);
  }

  .title {
    font-weight: 500;
    font-size: 0.875rem;
    color: #374151;

    .dark & {
      color: #d1d5db;
    }
  }

  .desc {
    font-size: 0.75rem;
    color: #6b7280;

    .dark & {
      color: #9ca3af;
    }
  }
`;

const AnalysisGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  padding: 0.5rem;
`;

const AnalysisItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  .label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #6b7280;

    .dark & {
      color: #9ca3af;
    }
  }

  .value {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;

    &.high {
      color: #dc2626;
    }

    &.medium {
      color: #d97706;
    }

    &.low {
      color: #059669;
    }

    .dark & {
      color: #d1d5db;

      &.high {
        color: #f87171;
      }

      &.medium {
        color: #fbbf24;
      }

      &.low {
        color: #10b981;
      }
    }
  }
`;

const ControlGroup = styled.div`
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ControlLabel = styled.label`
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;

  .dark & {
    color: #d1d5db;
  }
`;

const ToneSelector = styled.select`
  padding: 0.5rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.375rem;
  background: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  color: #374151;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  .dark & {
    background: rgba(30, 41, 59, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #d1d5db;
  }
`;

const NoteSelectorOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const NoteSelectorModal = styled.div`
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 1rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 500px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;

  .dark & {
    background: rgba(15, 23, 42, 0.98);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const NoteSelectorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
    text-transform: capitalize;
  }

  .dark & {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    h3 {
      color: #f9fafb;
    }
  }
`;

const NoteSelectorContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  max-height: 400px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-style: italic;
`;

const NoteItem = styled.button`
  width: 100%;
  text-align: left;
  padding: 1rem;
  border-radius: 0.75rem;
  transition: all 0.2s;
  border: 1px solid transparent;
  margin-bottom: 0.5rem;

  &:hover {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.2);
  }

  ${props => props.$selected && `
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
  `}
`;

const NoteTitle = styled.div`
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
  margin-bottom: 0.5rem;

  .dark & {
    color: #d1d5db;
  }
`;

const NotePreview = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
  margin-bottom: 0.5rem;

  .dark & {
    color: #9ca3af;
  }
`;

const NoteInfo = styled.div`
  font-size: 0.7rem;
  color: #9ca3af;

  .dark & {
    color: #6b7280;
  }
`;

const NoteSelectorFooter = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);

  .dark & {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const PreviewOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const PreviewModal = styled.div`
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 1rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;

  .dark & {
    background: rgba(15, 23, 42, 0.98);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const PreviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
    text-transform: capitalize;
  }

  .dark & {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    h3 {
      color: #f9fafb;
    }
  }
`;

const PreviewContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  max-height: 500px;
`;

const PreviewText = styled.div`
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #374151;
  white-space: pre-wrap;
  background: rgba(0, 0, 0, 0.02);
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(0, 0, 0, 0.1);

  .dark & {
    color: #d1d5db;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const PreviewFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem 1.5rem 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);

  .dark & {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const PreviewButton = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s;

  ${props => props.$secondary ? `
    background: rgba(0, 0, 0, 0.05);
    color: #6b7280;

    &:hover {
      background: rgba(0, 0, 0, 0.1);
    }

    .dark & {
      background: rgba(255, 255, 255, 0.05);
      color: #9ca3af;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  ` : `
    background: #3b82f6;
    color: white;

    &:hover {
      background: #2563eb;
    }
  `}
`;

export default AISidebar;
