import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { 
  Users, 
  FileText, 
  Calendar, 
  User, 
  ArrowLeft,
  Search,
  Clock,
  Star,
  Eye
} from 'lucide-react';
import { getSharedNotes } from '../lib/firestoreService';
import { useToast } from '../components/ui/use-toast';
import OptimizedModernLoader from '../components/OptimizedModernLoader';

const SharedNotesPage = () => {
  const { isDarkMode } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sharedNotes, setSharedNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSharedNotes();
  }, []);

  const loadSharedNotes = async () => {
    try {
      setLoading(true);
      const notes = await getSharedNotes();
      setSharedNotes(notes);
    } catch (error) {
      console.error('Error loading shared notes:', error);
      toast({
        title: "Error",
        description: "Failed to load shared notes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openNote = (note) => {
    navigate(`/page?id=${note.id}&owner=${note.originalOwnerId}`);
  };

  const filteredNotes = sharedNotes.filter(note =>
    note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const calculateReadingTime = (content) => {
    if (!content) return 0;
    const words = content.split(/\s+/).filter(word => word.length > 0).length;
    return Math.ceil(words / 250);
  };

  if (loading) return <OptimizedModernLoader />;

  return (
    <Container $isDarkMode={isDarkMode}>
      <Header $isDarkMode={isDarkMode}>
        <HeaderLeft>
          <BackButton $isDarkMode={isDarkMode} onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={20} />
          </BackButton>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Users size={24} />
            <div>
              <h1>Shared with Me</h1>
              <Subtitle $isDarkMode={isDarkMode}>
                Notes that others have shared with you
              </Subtitle>
            </div>
          </div>
        </HeaderLeft>
      </Header>

      <Content>
        <SearchSection>
          <SearchContainer $isDarkMode={isDarkMode}>
            <Search size={20} />
            <SearchInput
              $isDarkMode={isDarkMode}
              placeholder="Search shared notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchContainer>
        </SearchSection>

        {filteredNotes.length === 0 ? (
          <EmptyState $isDarkMode={isDarkMode}>
            {searchQuery ? (
              <>
                <Search size={64} />
                <h3>No notes found</h3>
                <p>No shared notes match "{searchQuery}"</p>
              </>
            ) : (
              <>
                <Users size={64} />
                <h3>No shared notes</h3>
                <p>When someone shares a note with you, it will appear here.</p>
              </>
            )}
          </EmptyState>
        ) : (
          <NotesGrid>
            {filteredNotes.map(note => (
              <NoteCard 
                key={`${note.id}-${note.originalOwnerId}`} 
                $isDarkMode={isDarkMode}
                onClick={() => openNote(note)}
              >
                <NoteHeader>
                  <NoteTitle $isDarkMode={isDarkMode}>
                    {note.title || 'Untitled'}
                  </NoteTitle>
                  {note.pinned && (
                    <StarIcon>
                      <Star size={16} fill="currentColor" />
                    </StarIcon>
                  )}
                </NoteHeader>

                <NoteContent $isDarkMode={isDarkMode}>
                  {note.content ? (
                    note.content.substring(0, 200) + (note.content.length > 200 ? '...' : '')
                  ) : (
                    'No content'
                  )}
                </NoteContent>

                <NoteFooter $isDarkMode={isDarkMode}>
                  <NoteStats>
                    <StatItem>
                      <Clock size={12} />
                      <span>{calculateReadingTime(note.content)} min read</span>
                    </StatItem>
                    <StatItem>
                      <Calendar size={12} />
                      <span>Shared {formatDate(note.sharedAt)}</span>
                    </StatItem>
                  </NoteStats>
                  
                  <SharedBy $isDarkMode={isDarkMode}>
                    <User size={12} />
                    <span>Shared by owner</span>
                  </SharedBy>
                </NoteFooter>

                <CollaborationBadge $isDarkMode={isDarkMode}>
                  <Users size={12} />
                  <span>{note.permissions === 'edit' ? 'Can Edit' : 'View Only'}</span>
                </CollaborationBadge>
              </NoteCard>
            ))}
          </NotesGrid>
        )}
      </Content>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: ${props => props.$isDarkMode 
    ? 'linear-gradient(135deg, hsl(222.2 84% 4.9%) 0%, hsl(217.2 32.6% 17.5%) 100%)'
    : 'linear-gradient(135deg, hsl(210 40% 98%) 0%, hsl(210 40% 96%) 100%)'
  };
  color: ${props => props.$isDarkMode 
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 4.9%)'
  };
`;

const Header = styled.header`
  padding: 2rem;
  border-bottom: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(0, 0, 0, 0.1)'
  };
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  h1 {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
  }
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 35%)'
  };
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: none;
  background: ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(255, 255, 255, 0.8)'
  };
  color: ${props => props.$isDarkMode 
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 15%)'
  };
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isDarkMode 
      ? 'rgba(148, 163, 184, 0.25)'
      : 'rgba(255, 255, 255, 1)'
    };
    transform: translateY(-1px);
  }
`;

const Content = styled.main`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const SearchSection = styled.div`
  margin-bottom: 2rem;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: ${props => props.$isDarkMode 
    ? 'rgba(30, 41, 59, 0.5)'
    : 'rgba(255, 255, 255, 0.8)'
  };
  border: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(0, 0, 0, 0.1)'
  };
  border-radius: 12px;
  backdrop-filter: blur(20px);
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 25%)'
  };
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: ${props => props.$isDarkMode 
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 4.9%)'
  };
  font-size: 1rem;

  &::placeholder {
    color: ${props => props.$isDarkMode 
      ? 'hsl(215 20.2% 65.1%)'
      : 'hsl(222.2 84% 35%)'
    };
  }
`;

const NotesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
`;

const NoteCard = styled.div`
  position: relative;
  background: ${props => props.$isDarkMode 
    ? 'rgba(30, 41, 59, 0.5)'
    : 'rgba(255, 255, 255, 0.8)'
  };
  border: 1px solid ${props => props.$isDarkMode 
    ? 'rgba(148, 163, 184, 0.15)'
    : 'rgba(0, 0, 0, 0.1)'
  };
  border-radius: 16px;
  padding: 1.5rem;
  backdrop-filter: blur(20px);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border-color: ${props => props.$isDarkMode 
      ? 'rgba(59, 130, 246, 0.3)'
      : 'rgba(59, 130, 246, 0.2)'
    };
  }
`;

const NoteHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const NoteTitle = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.$isDarkMode 
    ? 'hsl(210 40% 98%)'
    : 'hsl(222.2 84% 15%)'
  };
  line-height: 1.4;
  flex: 1;
`;

const StarIcon = styled.div`
  color: #f59e0b;
  margin-left: 0.5rem;
`;

const NoteContent = styled.p`
  margin: 0 0 1.5rem 0;
  font-size: 0.875rem;
  line-height: 1.6;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 35%)'
  };
`;

const NoteFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const NoteStats = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: ${props => props.theme?.isDark 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 35%)'
  };
`;

const SharedBy = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 35%)'
  };
`;

const CollaborationBadge = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: ${props => props.$isDarkMode 
    ? 'hsl(215 20.2% 65.1%)'
    : 'hsl(222.2 84% 35%)'
  };

  h3 {
    margin: 1rem 0 0.5rem 0;
    color: ${props => props.$isDarkMode 
      ? 'hsl(210 40% 98%)'
      : 'hsl(222.2 84% 15%)'
    };
  }

  p {
    font-size: 0.875rem;
    margin: 0;
  }
`;

export default SharedNotesPage;
