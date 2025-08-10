import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowLeft, Save, Download, Share2, Settings, Trash2, Plus } from 'lucide-react';
import EnhancedFlashCardViewer from '../components/EnhancedFlashCardViewer';
import { saveFlashCards, getUserFlashCards, deleteFlashCard } from '../lib/firestoreService';
import { useToast } from '../components/ui/use-toast';
import { auth } from '../lib/firebase';

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
  }, []);

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
        
        {flashCards.length > 0 && (
          <HeaderActions>
            <NameInput
              type="text"
              placeholder="Enter set name..."
              value={setName}
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
        {showViewer && flashCards.length > 0 ? (
          <ViewerContainer>
            <FlashCardViewer 
              flashcardsData={flashCards} 
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
                <div className="spinner" />
                Loading flashcards...
              </LoadingContainer>
            ) : savedSets.length === 0 ? (
              <EmptyState>
                <Plus size={48} />
                <h3>No flashcard sets yet</h3>
                <p>Create flashcards from your notes using the AI assistant to get started.</p>
              </EmptyState>
            ) : (
              <SetsGrid>
                {savedSets.map((set) => (
                  <SetCard key={set.id}>
                    <SetHeader>
                      <SetName>{set.name}</SetName>
                      <SetActions>
                        <IconButton 
                          onClick={() => {
                            setFlashCards(set.flashCards);
                            setSetName(set.name);
                            setShowViewer(true);
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
                      <span>{new Date(set.createdAt?.toDate?.() || set.createdAt).toLocaleDateString()}</span>
                    </SetInfo>
                    
                    <StudyButton 
                      onClick={() => {
                        setFlashCards(set.flashCards);
                        setSetName(set.name);
                        setShowViewer(true);
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
  background: #f8fafc;
  color: #1f2937;
  position: relative;

  .dark & {
    background: #0f172a;
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
      linear-gradient(to_right, #e2e8f0 1px, transparent 1px),
      linear-gradient(to_bottom, #e2e8f0 1px, transparent 1px);
    background-size: 40px 40px;
    opacity: 0.3;
    pointer-events: none;

    .dark & {
      background:
        linear-gradient(to_right, #1e293b 1px, transparent 1px),
        linear-gradient(to_bottom, #1e293b 1px, transparent 1px);
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
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const SetCard = styled.div`
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 1.5rem;
  padding: 1.75rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  .dark & {
    background: rgba(30, 41, 59, 0.25);
    border: 1px solid rgba(148, 163, 184, 0.15);
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    background: rgba(255, 255, 255, 0.3);

    .dark & {
      background: rgba(30, 41, 59, 0.35);
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
  padding: 0.75rem;
  background: rgba(59, 130, 246, 0.8);
  border: 1px solid rgba(59, 130, 246, 1);
  border-radius: 0.5rem;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(59, 130, 246, 1);
    transform: translateY(-2px);
  }
`;

export default FlashCardPage;
