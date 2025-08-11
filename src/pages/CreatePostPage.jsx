import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  ArrowLeft,
  Image,
  Video,
  Link,
  Poll,
  FileText,
  Send,
  X,
  Plus,
  Eye,
  Upload,
  Paperclip,
  Hash,
  MapPin,
  Calendar,
  Users,
  Globe
} from 'lucide-react';
import { useToast } from '../components/ui/use-toast';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/ui/Avatar';
import {
  getCommunities,
  createCommunityPost,
  getUserProfile
} from '../lib/firestoreService';
import { auth } from '../lib/firebase';

const CreatePostPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDarkMode } = useTheme();
  const fileInputRef = useRef(null);

  const [communities, setCommunities] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const [postData, setPostData] = useState({
    type: 'text',
    title: '',
    content: '',
    community: '',
    tags: [],
    flairText: '',
    flairColor: '#3b82f6',
    location: '',
    eventDate: '',
    allowComments: true,
    nsfw: false,
    spoiler: false,
    mediaFiles: [],
    pollOptions: ['', ''],
    pollDuration: 7 // days
  });

  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [communitiesData, profileData] = await Promise.all([
        getCommunities(),
        getUserProfile()
      ]);
      setCommunities(communitiesData.filter(c => c.id !== 'all'));
      setUserProfile(profileData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "❌ Error",
        description: "Failed to load communities",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      const newFiles = files.map(file => ({
        file,
        url: URL.createObjectURL(file),
        type: file.type.startsWith('image/') ? 'image' : 'video'
      }));
      
      setPostData(prev => ({
        ...prev,
        mediaFiles: [...prev.mediaFiles, ...newFiles]
      }));
    }
  };

  const removeFile = (index) => {
    setPostData(prev => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !postData.tags.includes(newTag.trim())) {
      setPostData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setPostData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addPollOption = () => {
    setPostData(prev => ({
      ...prev,
      pollOptions: [...prev.pollOptions, '']
    }));
  };

  const removePollOption = (index) => {
    if (postData.pollOptions.length > 2) {
      setPostData(prev => ({
        ...prev,
        pollOptions: prev.pollOptions.filter((_, i) => i !== index)
      }));
    }
  };

  const updatePollOption = (index, value) => {
    setPostData(prev => ({
      ...prev,
      pollOptions: prev.pollOptions.map((option, i) => i === index ? value : option)
    }));
  };

  const handleSubmit = async () => {
    if (!postData.title.trim() || !postData.community) {
      toast({
        title: "❌ Missing Required Fields",
        description: "Please fill in the title and select a community",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // For now, we'll create the post without actual file upload
      // In a real app, you'd upload files to storage first
      const postPayload = {
        ...postData,
        mediaAttachments: postData.mediaFiles.map(file => ({
          type: file.type,
          url: file.url, // In real app, this would be the uploaded URL
          caption: ''
        }))
      };

      delete postPayload.mediaFiles; // Remove the file objects

      await createCommunityPost(postPayload);

      toast({
        title: "🎉 Post Created!",
        description: "Your post has been published successfully",
        variant: "success"
      });

      navigate('/communities');
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "❌ Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const postTypes = [
    { id: 'text', icon: FileText, label: 'Text Post', desc: 'Share your thoughts' },
    { id: 'image', icon: Image, label: 'Photo', desc: 'Share images' },
    { id: 'video', icon: Video, label: 'Video', desc: 'Share videos' },
    { id: 'link', icon: Link, label: 'Link', desc: 'Share a link' },
    { id: 'poll', icon: Poll, label: 'Poll', desc: 'Ask the community' }
  ];

  const flairColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ];

  return (
    <Container $isDarkMode={isDarkMode}>
      <Header $isDarkMode={isDarkMode}>
        <HeaderLeft>
          <BackButton $isDarkMode={isDarkMode} onClick={() => navigate('/communities')}>
            <ArrowLeft size={20} />
          </BackButton>
          <Title $isDarkMode={isDarkMode}>Create Post</Title>
        </HeaderLeft>
        <HeaderRight>
          <PreviewButton 
            $isDarkMode={isDarkMode} 
            $active={previewMode}
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye size={16} />
            Preview
          </PreviewButton>
          <PublishButton 
            $isDarkMode={isDarkMode} 
            onClick={handleSubmit}
            disabled={loading || !postData.title.trim() || !postData.community}
          >
            <Send size={16} />
            {loading ? 'Publishing...' : 'Publish'}
          </PublishButton>
        </HeaderRight>
      </Header>

      <Content>
        {!previewMode ? (
          <>
            {/* User Info */}
            <UserSection $isDarkMode={isDarkMode}>
              <Avatar user={userProfile} size="md" isDarkMode={isDarkMode} />
              <UserInfo>
                <UserName $isDarkMode={isDarkMode}>
                  {userProfile?.displayName || 'Anonymous'}
                </UserName>
                <PostingAs $isDarkMode={isDarkMode}>
                  Posting to community
                </PostingAs>
              </UserInfo>
            </UserSection>

            {/* Post Type Selection */}
            <Section $isDarkMode={isDarkMode}>
              <SectionTitle $isDarkMode={isDarkMode}>Post Type</SectionTitle>
              <PostTypeGrid>
                {postTypes.map(type => (
                  <PostTypeCard
                    key={type.id}
                    $isDarkMode={isDarkMode}
                    $selected={postData.type === type.id}
                    onClick={() => setPostData(prev => ({ ...prev, type: type.id }))}
                  >
                    <type.icon size={24} />
                    <div>
                      <PostTypeLabel>{type.label}</PostTypeLabel>
                      <PostTypeDesc $isDarkMode={isDarkMode}>{type.desc}</PostTypeDesc>
                    </div>
                  </PostTypeCard>
                ))}
              </PostTypeGrid>
            </Section>

            {/* Community Selection */}
            <Section $isDarkMode={isDarkMode}>
              <SectionTitle $isDarkMode={isDarkMode}>
                Community <Required>*</Required>
              </SectionTitle>
              <Select
                $isDarkMode={isDarkMode}
                value={postData.community}
                onChange={(e) => setPostData(prev => ({ ...prev, community: e.target.value }))}
              >
                <option value="">Choose a community...</option>
                {communities.map(community => (
                  <option key={community.id} value={community.id}>
                    {community.icon} {community.displayName}
                  </option>
                ))}
              </Select>
            </Section>

            {/* Title */}
            <Section $isDarkMode={isDarkMode}>
              <SectionTitle $isDarkMode={isDarkMode}>
                Title <Required>*</Required>
              </SectionTitle>
              <Input
                $isDarkMode={isDarkMode}
                placeholder="What's your post about?"
                value={postData.title}
                onChange={(e) => setPostData(prev => ({ ...prev, title: e.target.value }))}
                maxLength={300}
              />
              <CharCounter $isDarkMode={isDarkMode}>
                {postData.title.length}/300
              </CharCounter>
            </Section>

            {/* Content */}
            <Section $isDarkMode={isDarkMode}>
              <SectionTitle $isDarkMode={isDarkMode}>Content</SectionTitle>
              <Textarea
                $isDarkMode={isDarkMode}
                placeholder="Share your thoughts, experiences, or questions..."
                value={postData.content}
                onChange={(e) => setPostData(prev => ({ ...prev, content: e.target.value }))}
                rows={8}
              />
            </Section>

            {/* Media Upload */}
            {(postData.type === 'image' || postData.type === 'video') && (
              <Section $isDarkMode={isDarkMode}>
                <SectionTitle $isDarkMode={isDarkMode}>Media</SectionTitle>
                <MediaUploadArea $isDarkMode={isDarkMode}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={postData.type === 'image' ? 'image/*' : 'video/*'}
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <UploadButton 
                    $isDarkMode={isDarkMode}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={20} />
                    Upload {postData.type}s
                  </UploadButton>
                  
                  {postData.mediaFiles.length > 0 && (
                    <MediaPreview>
                      {postData.mediaFiles.map((file, index) => (
                        <MediaItem key={index} $isDarkMode={isDarkMode}>
                          {file.type === 'image' ? (
                            <img src={file.url} alt="Upload preview" />
                          ) : (
                            <video src={file.url} controls />
                          )}
                          <RemoveMediaButton onClick={() => removeFile(index)}>
                            <X size={16} />
                          </RemoveMediaButton>
                        </MediaItem>
                      ))}
                    </MediaPreview>
                  )}
                </MediaUploadArea>
              </Section>
            )}

            {/* Poll Options */}
            {postData.type === 'poll' && (
              <Section $isDarkMode={isDarkMode}>
                <SectionTitle $isDarkMode={isDarkMode}>Poll Options</SectionTitle>
                <PollOptions>
                  {postData.pollOptions.map((option, index) => (
                    <PollOptionInput key={index}>
                      <Input
                        $isDarkMode={isDarkMode}
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => updatePollOption(index, e.target.value)}
                      />
                      {postData.pollOptions.length > 2 && (
                        <RemoveButton onClick={() => removePollOption(index)}>
                          <X size={16} />
                        </RemoveButton>
                      )}
                    </PollOptionInput>
                  ))}
                  <AddOptionButton $isDarkMode={isDarkMode} onClick={addPollOption}>
                    <Plus size={16} />
                    Add Option
                  </AddOptionButton>
                </PollOptions>
              </Section>
            )}

            {/* Tags */}
            <Section $isDarkMode={isDarkMode}>
              <SectionTitle $isDarkMode={isDarkMode}>Tags</SectionTitle>
              <TagInput>
                <Input
                  $isDarkMode={isDarkMode}
                  placeholder="Add tags..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <AddTagButton $isDarkMode={isDarkMode} onClick={addTag}>
                  <Hash size={16} />
                  Add
                </AddTagButton>
              </TagInput>
              {postData.tags.length > 0 && (
                <TagsList>
                  {postData.tags.map(tag => (
                    <Tag key={tag} $isDarkMode={isDarkMode}>
                      #{tag}
                      <RemoveTagButton onClick={() => removeTag(tag)}>
                        <X size={12} />
                      </RemoveTagButton>
                    </Tag>
                  ))}
                </TagsList>
              )}
            </Section>

            {/* Flair */}
            <Section $isDarkMode={isDarkMode}>
              <SectionTitle $isDarkMode={isDarkMode}>Flair (Optional)</SectionTitle>
              <FlairSection>
                <Input
                  $isDarkMode={isDarkMode}
                  placeholder="Add flair text..."
                  value={postData.flairText}
                  onChange={(e) => setPostData(prev => ({ ...prev, flairText: e.target.value }))}
                />
                <ColorPicker>
                  {flairColors.map(color => (
                    <ColorOption
                      key={color}
                      $color={color}
                      $selected={postData.flairColor === color}
                      onClick={() => setPostData(prev => ({ ...prev, flairColor: color }))}
                    />
                  ))}
                </ColorPicker>
              </FlairSection>
            </Section>

            {/* Settings */}
            <Section $isDarkMode={isDarkMode}>
              <SectionTitle $isDarkMode={isDarkMode}>Post Settings</SectionTitle>
              <SettingsGrid>
                <SettingItem>
                  <Checkbox
                    type="checkbox"
                    id="allowComments"
                    checked={postData.allowComments}
                    onChange={(e) => setPostData(prev => ({ ...prev, allowComments: e.target.checked }))}
                  />
                  <SettingLabel htmlFor="allowComments" $isDarkMode={isDarkMode}>
                    Allow comments
                  </SettingLabel>
                </SettingItem>
                <SettingItem>
                  <Checkbox
                    type="checkbox"
                    id="nsfw"
                    checked={postData.nsfw}
                    onChange={(e) => setPostData(prev => ({ ...prev, nsfw: e.target.checked }))}
                  />
                  <SettingLabel htmlFor="nsfw" $isDarkMode={isDarkMode}>
                    Mark as NSFW
                  </SettingLabel>
                </SettingItem>
                <SettingItem>
                  <Checkbox
                    type="checkbox"
                    id="spoiler"
                    checked={postData.spoiler}
                    onChange={(e) => setPostData(prev => ({ ...prev, spoiler: e.target.checked }))}
                  />
                  <SettingLabel htmlFor="spoiler" $isDarkMode={isDarkMode}>
                    Mark as Spoiler
                  </SettingLabel>
                </SettingItem>
              </SettingsGrid>
            </Section>
          </>
        ) : (
          <PreviewSection $isDarkMode={isDarkMode}>
            <PreviewTitle $isDarkMode={isDarkMode}>Post Preview</PreviewTitle>
            {/* Add preview content here */}
            <PreviewCard $isDarkMode={isDarkMode}>
              <p>Preview functionality would show how the post will look when published.</p>
            </PreviewCard>
          </PreviewSection>
        )}
      </Content>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: ${props => props.$isDarkMode
    ? 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e293b 100%)'
    : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)'
  };
  color: ${props => props.$isDarkMode ? 'hsl(210 40% 98%)' : 'hsl(215.4 16.3% 26.9%)'};
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: ${props => props.$isDarkMode
    ? 'rgba(15, 23, 42, 0.8)'
    : 'rgba(255, 255, 255, 0.9)'
  };
  backdrop-filter: blur(20px);
  border-bottom: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(148, 163, 184, 0.15)'
  };
  sticky: top 0;
  z-index: 100;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
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
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(148, 163, 184, 0.08)'
  };
  color: ${props => props.$isDarkMode ? 'hsl(210 40% 85%)' : 'hsl(222.2 84% 30%)'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$isDarkMode
      ? 'rgba(148, 163, 184, 0.2)'
      : 'rgba(148, 163, 184, 0.15)'
    };
    transform: translateY(-1px);
  }
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.$isDarkMode ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 15%)'};
  margin: 0;
`;

const PreviewButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid ${props => props.$active 
    ? '#3b82f6' 
    : props.$isDarkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.15)'
  };
  border-radius: 8px;
  background: ${props => props.$active 
    ? 'rgba(59, 130, 246, 0.1)' 
    : 'transparent'
  };
  color: ${props => props.$active 
    ? '#3b82f6' 
    : props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)'
  };
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
  }
`;

const PublishButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const Content = styled.main`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
    gap: 1.5rem;
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: ${props => props.$isDarkMode
    ? 'rgba(15, 23, 42, 0.6)'
    : 'rgba(255, 255, 255, 0.8)'
  };
  backdrop-filter: blur(20px);
  border-radius: 12px;
  border: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(148, 163, 184, 0.15)'
  };
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const UserName = styled.div`
  font-weight: 600;
  color: ${props => props.$isDarkMode ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 15%)'};
`;

const PostingAs = styled.div`
  font-size: 0.875rem;
  color: ${props => props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)'};
`;

const Section = styled.div`
  background: ${props => props.$isDarkMode
    ? 'rgba(15, 23, 42, 0.6)'
    : 'rgba(255, 255, 255, 0.8)'
  };
  backdrop-filter: blur(20px);
  border-radius: 12px;
  border: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(148, 163, 184, 0.15)'
  };
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: ${props => props.$isDarkMode ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 15%)'};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Required = styled.span`
  color: #ef4444;
  font-size: 0.875rem;
`;

const PostTypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const PostTypeCard = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid ${props => props.$selected 
    ? '#3b82f6' 
    : props.$isDarkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.15)'
  };
  border-radius: 8px;
  background: ${props => props.$selected 
    ? 'rgba(59, 130, 246, 0.1)' 
    : 'transparent'
  };
  color: ${props => props.$selected 
    ? '#3b82f6' 
    : props.$isDarkMode ? 'hsl(210 40% 85%)' : 'hsl(222.2 84% 30%)'
  };
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.05);
  }
`;

const PostTypeLabel = styled.div`
  font-weight: 600;
  font-size: 0.875rem;
`;

const PostTypeDesc = styled.div`
  font-size: 0.75rem;
  color: ${props => props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)'};
`;

const Select = styled.select`
  padding: 0.75rem 1rem;
  border: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.2)'
    : 'rgba(148, 163, 184, 0.15)'
  };
  border-radius: 8px;
  background: ${props => props.$isDarkMode
    ? 'rgba(15, 23, 42, 0.8)'
    : 'rgba(255, 255, 255, 0.9)'
  };
  color: ${props => props.$isDarkMode ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)'};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.2)'
    : 'rgba(148, 163, 184, 0.15)'
  };
  border-radius: 8px;
  background: ${props => props.$isDarkMode
    ? 'rgba(15, 23, 42, 0.8)'
    : 'rgba(255, 255, 255, 0.9)'
  };
  color: ${props => props.$isDarkMode ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)'};
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: ${props => props.$isDarkMode
      ? 'hsl(215 20.2% 55%)'
      : 'hsl(222.2 84% 55%)'
    };
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem 1rem;
  border: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.2)'
    : 'rgba(148, 163, 184, 0.15)'
  };
  border-radius: 8px;
  background: ${props => props.$isDarkMode
    ? 'rgba(15, 23, 42, 0.8)'
    : 'rgba(255, 255, 255, 0.9)'
  };
  color: ${props => props.$isDarkMode ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)'};
  font-size: 0.875rem;
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: ${props => props.$isDarkMode
      ? 'hsl(215 20.2% 55%)'
      : 'hsl(222.2 84% 55%)'
    };
  }
`;

const CharCounter = styled.div`
  font-size: 0.75rem;
  color: ${props => props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)'};
  text-align: right;
`;

const MediaUploadArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const UploadButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  border: 2px dashed ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.3)'
    : 'rgba(148, 163, 184, 0.4)'
  };
  border-radius: 8px;
  background: transparent;
  color: ${props => props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)'};
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.05);
  }
`;

const MediaPreview = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const MediaItem = styled.div`
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(148, 163, 184, 0.05)'
  };

  img, video {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
`;

const RemoveMediaButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: #ef4444;
    transform: scale(1.1);
  }
`;

const PollOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const PollOptionInput = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const RemoveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
  }
`;

const AddOptionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px dashed ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.3)'
    : 'rgba(148, 163, 184, 0.4)'
  };
  border-radius: 8px;
  background: transparent;
  color: ${props => props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)'};
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.05);
  }
`;

const TagInput = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const AddTagButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: #2563eb;
  }
`;

const TagsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Tag = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: ${props => props.$isDarkMode
    ? 'rgba(59, 130, 246, 0.2)'
    : 'rgba(59, 130, 246, 0.1)'
  };
  color: #3b82f6;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const RemoveTagButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: none;
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.3);
  }
`;

const FlairSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ColorPicker = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ColorOption = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 2px solid ${props => props.$selected ? 'white' : 'transparent'};
  background: ${props => props.$color};
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${props => props.$selected ? '0 0 0 2px #3b82f6' : 'none'};

  &:hover {
    transform: scale(1.1);
  }
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const SettingItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
`;

const SettingLabel = styled.label`
  font-size: 0.875rem;
  color: ${props => props.$isDarkMode ? 'hsl(210 40% 85%)' : 'hsl(222.2 84% 30%)'};
  cursor: pointer;
`;

const PreviewSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const PreviewTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${props => props.$isDarkMode ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 15%)'};
  margin: 0;
`;

const PreviewCard = styled.div`
  padding: 2rem;
  background: ${props => props.$isDarkMode
    ? 'rgba(15, 23, 42, 0.6)'
    : 'rgba(255, 255, 255, 0.8)'
  };
  backdrop-filter: blur(20px);
  border-radius: 12px;
  border: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(148, 163, 184, 0.15)'
  };
  color: ${props => props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)'};
`;

export default CreatePostPage;
