import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowLeft, Save, Download, Share2, Settings, Trash2, Plus } from 'lucide-react';
import EnhancedFlashCardViewer from '../components/EnhancedFlashCardViewer';
import { saveFlashCards, getUserFlashCards, deleteFlashCard } from '../lib/firestoreService';
import { useToast } from '../components/ui/use-toast';
import { auth } from '../lib/firebase';
import AILoadingIndicator from '../components/AILoadingIndicator';

const FlashCardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [flashCards, setFlashCards] = useState(location.state?.flashCards || []);
  const [savedSets, setSavedSets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showViewer, setShowViewer] = useState(!!location.state?.flashCards);
  const [setName, setSetName] = useState(location.state?.title || '');

  useEffect(() => {
    loadSavedFlashCards();

    // Auto-save if flashcards were generated from AI
    if (location.state?.flashCards && location.state?.title && !loading) {
      handleAutoSave();
    }
  }, [location.state]);

  const handleAutoSave = async () => {
    if (!location.state?.flashCards || !location.state?.title) return;

    try {
      await saveFlashCards({
        name: location.state.title,
        flashCards: location.state.flashCards,
        createdAt: new Date(),
        userId: auth.currentUser?.uid
      });

      toast({
        title: "Auto-saved",
        description: "Flashcard set has been automatically saved!",
        variant: "default"
      });

      await loadSavedFlashCards();
    } catch (error) {
      console.error('Error auto-saving flashcards:', error);
    }
  };

  const loadSavedFlashCards = async () => {
    try {
      setLoading(true);
      const sets = await getUserFlashCards();
      setSavedSets(sets);
    } catch (error) {
      console.error('Error loading flashcards:', error);
      toast({
        title: "Error",
        description: "Failed to load saved flashcards",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!setName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for this flashcard set",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      await saveFlashCards({
        name: setName,
        flashCards,
        createdAt: new Date(),
        userId: auth.currentUser?.uid
      });
      
      toast({
        title: "Success",
        description: "Flashcard set saved successfully!",
        variant: "default"
      });
      
      await loadSavedFlashCards();
    } catch (error) {
      console.error('Error saving flashcards:', error);
      toast({
        title: "Error",
        description: "Failed to save flashcard set",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (setId) => {
    if (!setId) return;

    try {
      await deleteFlashCard(setId);
      toast({
        title: "Deleted",
        description: "Flashcard set deleted successfully",
        variant: "default"
      });
      await loadSavedFlashCards();
    } catch (error) {
      console.error('Error deleting flashcards:', error);
      toast({
        title: "Error",
        description: "Failed to delete flashcard set",
        variant: "destructive"
      });
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(flashCards, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `flashcards-${setName || 'untitled'}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <PageContainer>
      <Header>
        <HeaderLeft>
          <BackButton onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
            Back
          </BackButton>
          <PageTitle>Flashcards</PageTitle>
        </HeaderLeft>
        
        {flashCards && flashCards.length > 0 && (
          <HeaderActions>
            <NameInput
              type="text"
              placeholder="Enter set name..."
              value={setName || ''}
              onChange={(e) => setSetName(e.target.value)}
            />
            <ActionButton onClick={handleSave} disabled={loading}>
              <Save size={16} />
              Save Set
            </ActionButton>
            <ActionButton onClick={handleExport} variant="secondary">
              <Download size={16} />
              Export
            </ActionButton>
          </HeaderActions>
        )}
      </Header>

      <Content>
        {showViewer && flashCards && flashCards.length > 0 ? (
          <ViewerContainer>
            <EnhancedFlashCardViewer
              flashcardsData={flashCards}
              setName={setName}
              onClose={() => {
                setShowViewer(false);
                setFlashCards([]);
              }}
            />
          </ViewerContainer>
        ) : (
          <SavedSetsContainer>
            <SectionTitle>Saved Flashcard Sets</SectionTitle>
            
            {loading ? (
              <LoadingContainer>
                <AILoadingIndicator
                  type="flashcards"
                  message="Loading your flashcard sets..."
                  size="large"
                />
              </LoadingContainer>
            ) : savedSets.length === 0 ? (
              <EmptyState>
                <Plus size={48} />
                <h3>No flashcard sets yet</h3>
                <p>Create flashcards from your notes using the AI assistant to get started.</p>
              </EmptyState>
            ) : (
              <SetsGrid>
                {savedSets && savedSets.length > 0 && savedSets.map((set) => set && (
                  <SetCard key={set.id}>
                    <SetHeader>
                      <SetName>{set.name}</SetName>
                      <SetActions>
                        <IconButton
                          onClick={() => {
                            if (set.flashCards && set.flashCards.length > 0) {
                              setFlashCards(set.flashCards);
                              setSetName(set.name || 'Untitled');
                              setShowViewer(true);
                            }
                          }}
                          title="Study"
                        >
                          <Settings size={16} />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleDelete(set.id)}
                          variant="danger"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </SetActions>
                    </SetHeader>
                    
                    <SetInfo>
                      <span>{set.flashCards?.length || 0} cards</span>
                      <span>•</span>
                      <span>{
                        (() => {
                          try {
                            const date = set.createdAt?.toDate?.() || set.createdAt;
                            return date ? new Date(date).toLocaleDateString() : 'Unknown date';
                          } catch (error) {
                            return 'Unknown date';
                          }
                        })()
                      }</span>
                    </SetInfo>
                    
                    <StudyButton
                      onClick={() => {
                        if (set.flashCards && set.flashCards.length > 0) {
                          setFlashCards(set.flashCards);
                          setSetName(set.name || 'Untitled');
                          setShowViewer(true);
                        }
                      }}
                    >
                      Study Now
                    </StudyButton>
                  </SetCard>
                ))}
              </SetsGrid>
            )}
          </SavedSetsContainer>
        )}
      </Content>
    </PageContainer>
  );
};

const PageContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #1f2937;
  position: relative;

  .dark & {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    color: #f1f5f9;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.2) 0%, transparent 50%);
    pointer-events: none;

    .dark & {
      background:
        radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.1) 0%, transparent 50%);
    }
  }
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(203, 213, 225, 0.3);
  position: relative;
  z-index: 10;

  .dark & {
    background: rgba(15, 23, 42, 0.8);
    border-bottom: 1px solid rgba(51, 65, 85, 0.3);
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 1rem;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(-1px) scale(0.98);
  }
`;

const PageTitle = styled.h1`
  font-size: 1.8rem;
  font-weight: 700;
  color: white;
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const NameInput = styled.input`
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 0.9rem;
  min-width: 200px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.3);
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${props => props.variant === 'secondary' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(59, 130, 246, 0.8)'};
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.variant === 'secondary' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(59, 130, 246, 1)'};
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const Content = styled.main`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ViewerContainer = styled.div`
  flex: 1;
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const SavedSetsContainer = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  margin-bottom: 1.5rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  height: 200px;
  color: white;

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top: 3px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: white;
  text-align: center;
  gap: 1rem;

  h3 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
  }

  p {
    opacity: 0.8;
    max-width: 400px;
    line-height: 1.6;
  }
`;

const SetsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const SetCard = styled.div`
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 2rem;
  padding: 2rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;

  .dark & {
    background: rgba(15, 23, 42, 0.3);
    border: 1px solid rgba(148, 163, 184, 0.1);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.6s ease;
  }

  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.3);

    &::before {
      left: 100%;
    }

    .dark & {
      background: rgba(15, 23, 42, 0.4);
      border-color: rgba(148, 163, 184, 0.2);
    }
  }
`;

const SetHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const SetName = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
  margin: 0;
  line-height: 1.4;
`;

const SetActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: ${props => props.variant === 'danger' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.2)'};
  border: 1px solid ${props => props.variant === 'danger' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.3)'};
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.variant === 'danger' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.3)'};
    transform: scale(1.1);
  }
`;

const SetInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const StudyButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 1rem;
  color: white;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.6s ease;
  }

  &:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
    background: linear-gradient(135deg, #5a67d8 0%, #667eea 100%);

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(-1px) scale(0.98);
  }
`;

export default FlashCardPage;
