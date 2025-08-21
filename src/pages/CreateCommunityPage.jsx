import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  ArrowLeft,
  Save,
  X,
  Plus,
  Upload,
  Eye,
  Globe,
  Lock,
  Users,
  Crown,
  Image,
  Palette,
  Settings
} from 'lucide-react';
import { useToast } from '../components/ui/use-toast';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/ui/Avatar';
import {
  createCommunity,
  getUserProfile
} from '../lib/firestoreService';

const CreateCommunityPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDarkMode } = useTheme();
  const iconFileRef = useRef(null);
  const bannerFileRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const [communityData, setCommunityData] = useState({
    name: '',
    displayName: '',
    description: '',
    category: '',
    type: 'public', // public, restricted, private
    icon: '🏘️',
    iconFile: null,
    bannerFile: null,
    bannerColor: '#3b82f6',
    rules: [''],
    tags: [],
    allowedPostTypes: ['text', 'image', 'video', 'link', 'poll'],
    moderationLevel: 'moderate', // strict, moderate, relaxed
    requireApproval: false,
    allowCrossposting: true,
    allowPolls: true,
    minAccountAge: 0, // days
    minKarma: 0,
    welcomeMessage: '',
    flairEnabled: true,
    customColors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      accent: '#06b6d4'
    }
  });

  const [newTag, setNewTag] = useState('');

  React.useEffect(() => {
    getUserProfile().then(setUserProfile);
  }, []);

  const handleIconUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCommunityData(prev => ({
        ...prev,
        iconFile: file,
        icon: URL.createObjectURL(file)
      }));
    }
  };

  const handleBannerUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCommunityData(prev => ({
        ...prev,
        bannerFile: file
      }));
    }
  };

  const addRule = () => {
    setCommunityData(prev => ({
      ...prev,
      rules: [...prev.rules, '']
    }));
  };

  const updateRule = (index, value) => {
    setCommunityData(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) => i === index ? value : rule)
    }));
  };

  const removeRule = (index) => {
    if (communityData.rules.length > 1) {
      setCommunityData(prev => ({
        ...prev,
        rules: prev.rules.filter((_, i) => i !== index)
      }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !communityData.tags.includes(newTag.trim())) {
      setCommunityData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setCommunityData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async () => {
    if (!communityData.name.trim() || !communityData.displayName.trim() || !communityData.description.trim()) {
      toast({
        title: "❌ Missing Required Fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Filter out empty rules
      const filteredRules = communityData.rules.filter(rule => rule.trim());

      const payload = {
        ...communityData,
        rules: filteredRules,
        // In a real app, you'd upload files to storage first
        // For now, we'll use the emoji or placeholder
        icon: communityData.iconFile ? communityData.icon : communityData.icon
      };

      // Remove file objects before sending
      delete payload.iconFile;
      delete payload.bannerFile;

      await createCommunity(payload);

      toast({
        title: "🎉 Community Created!",
        description: `${communityData.displayName} has been created successfully`,
        variant: "success"
      });

      navigate('/communities');
    } catch (error) {
      console.error('Error creating community:', error);
      toast({
        title: "❌ Error",
        description: error.message || "Failed to create community. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'study', label: '📚 Study & Learning', desc: 'Academic discussions and learning resources' },
    { id: 'productivity', label: '⚡ Productivity', desc: 'Tips and tools for getting things done' },
    { id: 'technology', label: '💻 Technology', desc: 'Tech news, programming, and digital tools' },
    { id: 'lifestyle', label: '🌟 Lifestyle', desc: 'Health, fitness, and daily life' },
    { id: 'creative', label: '🎨 Creative', desc: 'Art, design, music, and creative projects' },
    { id: 'gaming', label: '🎮 Gaming', desc: 'Video games and gaming culture' },
    { id: 'science', label: '🔬 Science', desc: 'Scientific discussions and discoveries' },
    { id: 'general', label: '💬 General Discussion', desc: 'Open discussions on various topics' }
  ];

  const communityTypes = [
    { id: 'public', icon: Globe, label: 'Public', desc: 'Anyone can view and join' },
    { id: 'restricted', icon: Users, label: 'Restricted', desc: 'Anyone can view, approval required to join' },
    { id: 'private', icon: Lock, label: 'Private', desc: 'Only approved members can view and join' }
  ];

  const predefinedIcons = [
    '🏘️', '💻', '🎨', '📚', '🎮', '🍕', '⚽', '🎵', '📷', '🌟',
    '🚀', '💡', '🎯', '🔥', '⭐', '🌈', '🎪', '🎭', '🏆', '🎊'
  ];

  const colorPresets = [
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
          <Title $isDarkMode={isDarkMode}>Create Community</Title>
        </HeaderLeft>
        <HeaderRight>
          <CreateButton 
            $isDarkMode={isDarkMode} 
            onClick={handleSubmit}
            disabled={loading || !communityData.name.trim() || !communityData.displayName.trim()}
          >
            <Save size={16} />
            {loading ? 'Creating...' : 'Create Community'}
          </CreateButton>
        </HeaderRight>
      </Header>

      <Content>
        <>
          {/* Creator Info */}
            <UserSection $isDarkMode={isDarkMode}>
              <Avatar user={userProfile} size="md" isDarkMode={isDarkMode} />
              <UserInfo>
                <UserName $isDarkMode={isDarkMode}>
                  {userProfile?.displayName || 'Anonymous'}
                </UserName>
                <CreatingAs $isDarkMode={isDarkMode}>
                  Creating a new community
                </CreatingAs>
              </UserInfo>
            </UserSection>

            {/* Basic Information */}
            <Section $isDarkMode={isDarkMode}>
              <SectionTitle $isDarkMode={isDarkMode}>
                <Settings size={20} />
                Basic Information
              </SectionTitle>
              
              <FormGrid>
                <FormGroup>
                  <FormLabel $isDarkMode={isDarkMode}>
                    Community Name <Required>*</Required>
                  </FormLabel>
                  <Input
                    $isDarkMode={isDarkMode}
                    placeholder="CommunityName (no spaces)"
                    value={communityData.name}
                    onChange={(e) => setCommunityData(prev => ({
                      ...prev,
                      name: e.target.value.replace(/[^a-zA-Z0-9]/g, '')
                    }))}
                    maxLength={21}
                  />
                  <HelpText $isDarkMode={isDarkMode}>
                    This will be your community's unique URL. Only letters and numbers allowed.
                  </HelpText>
                </FormGroup>

                <FormGroup>
                  <FormLabel $isDarkMode={isDarkMode}>
                    Display Name <Required>*</Required>
                  </FormLabel>
                  <Input
                    $isDarkMode={isDarkMode}
                    placeholder="Friendly Community Name"
                    value={communityData.displayName}
                    onChange={(e) => setCommunityData(prev => ({
                      ...prev,
                      displayName: e.target.value
                    }))}
                    maxLength={50}
                  />
                </FormGroup>
              </FormGrid>

              <FormGroup>
                <FormLabel $isDarkMode={isDarkMode}>
                  Description <Required>*</Required>
                </FormLabel>
                <Textarea
                  $isDarkMode={isDarkMode}
                  placeholder="Describe what your community is about, what topics it covers, and what kind of discussions you want to encourage..."
                  value={communityData.description}
                  onChange={(e) => setCommunityData(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  rows={4}
                />
              </FormGroup>

              <FormGroup>
                <FormLabel $isDarkMode={isDarkMode}>
                  Category <Required>*</Required>
                </FormLabel>
                <CategoryGrid>
                  {categories.map(category => (
                    <CategoryCard
                      key={category.id}
                      $isDarkMode={isDarkMode}
                      $selected={communityData.category === category.id}
                      onClick={() => setCommunityData(prev => ({ ...prev, category: category.id }))}
                    >
                      <CategoryLabel>{category.label}</CategoryLabel>
                      <CategoryDesc $isDarkMode={isDarkMode}>{category.desc}</CategoryDesc>
                    </CategoryCard>
                  ))}
                </CategoryGrid>
              </FormGroup>
            </Section>

            {/* Appearance */}
            <Section $isDarkMode={isDarkMode}>
              <SectionTitle $isDarkMode={isDarkMode}>
                <Palette size={20} />
                Appearance
              </SectionTitle>

              <FormGrid>
                <FormGroup>
                  <FormLabel $isDarkMode={isDarkMode}>Community Icon</FormLabel>
                  <IconSection>
                    <CurrentIcon $isDarkMode={isDarkMode}>
                      {communityData.iconFile ? (
                        <img src={communityData.icon} alt="Community icon" />
                      ) : (
                        <span>{communityData.icon}</span>
                      )}
                    </CurrentIcon>
                    <IconOptions>
                      <UploadIconButton 
                        $isDarkMode={isDarkMode}
                        onClick={() => iconFileRef.current?.click()}
                      >
                        <Upload size={16} />
                        Upload Image
                      </UploadIconButton>
                      <input
                        ref={iconFileRef}
                        type="file"
                        accept="image/*"
                        onChange={handleIconUpload}
                        style={{ display: 'none' }}
                      />
                    </IconOptions>
                  </IconSection>
                  <IconPicker>
                    {predefinedIcons.map(icon => (
                      <IconOption
                        key={icon}
                        $selected={communityData.icon === icon && !communityData.iconFile}
                        onClick={() => setCommunityData(prev => ({ 
                          ...prev, 
                          icon, 
                          iconFile: null 
                        }))}
                      >
                        {icon}
                      </IconOption>
                    ))}
                  </IconPicker>
                </FormGroup>

                <FormGroup>
                  <FormLabel $isDarkMode={isDarkMode}>Color Theme</FormLabel>
                  <ColorPicker>
                    {colorPresets.map(color => (
                      <ColorOption
                        key={color}
                        $color={color}
                        $selected={communityData.customColors.primary === color}
                        onClick={() => setCommunityData(prev => ({
                          ...prev,
                          customColors: { ...prev.customColors, primary: color }
                        }))}
                      />
                    ))}
                  </ColorPicker>
                </FormGroup>
              </FormGrid>
            </Section>

            {/* Community Type & Privacy */}
            <Section $isDarkMode={isDarkMode}>
              <SectionTitle $isDarkMode={isDarkMode}>
                <Lock size={20} />
                Privacy & Access
              </SectionTitle>

              <TypeGrid>
                {communityTypes.map(type => (
                  <TypeCard
                    key={type.id}
                    $isDarkMode={isDarkMode}
                    $selected={communityData.type === type.id}
                    onClick={() => setCommunityData(prev => ({ ...prev, type: type.id }))}
                  >
                    <type.icon size={24} />
                    <div>
                      <TypeLabel>{type.label}</TypeLabel>
                      <TypeDesc $isDarkMode={isDarkMode}>{type.desc}</TypeDesc>
                    </div>
                  </TypeCard>
                ))}
              </TypeGrid>
            </Section>

            {/* Community Rules */}
            <Section $isDarkMode={isDarkMode}>
              <SectionTitle $isDarkMode={isDarkMode}>
                <Crown size={20} />
                Community Rules
              </SectionTitle>
              
              <RulesContainer>
                {communityData.rules.map((rule, index) => (
                  <RuleInput key={index}>
                    <Input
                      $isDarkMode={isDarkMode}
                      placeholder={`Rule ${index + 1}`}
                      value={rule}
                      onChange={(e) => updateRule(index, e.target.value)}
                    />
                    {communityData.rules.length > 1 && (
                      <RemoveButton onClick={() => removeRule(index)}>
                        <X size={16} />
                      </RemoveButton>
                    )}
                  </RuleInput>
                ))}
                <AddRuleButton $isDarkMode={isDarkMode} onClick={addRule}>
                  <Plus size={16} />
                  Add Rule
                </AddRuleButton>
              </RulesContainer>
            </Section>

            {/* Tags */}
            <Section $isDarkMode={isDarkMode}>
              <SectionTitle $isDarkMode={isDarkMode}>Tags (Optional)</SectionTitle>
              <TagInput>
                <Input
                  $isDarkMode={isDarkMode}
                  placeholder="Add relevant tags..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <AddTagButton $isDarkMode={isDarkMode} onClick={addTag}>
                  Add Tag
                </AddTagButton>
              </TagInput>
              {communityData.tags.length > 0 && (
                <TagsList>
                  {communityData.tags.map(tag => (
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

            {/* Advanced Settings */}
            <Section $isDarkMode={isDarkMode}>
              <SectionTitle $isDarkMode={isDarkMode}>Advanced Settings</SectionTitle>
              
              <SettingsGrid>
                <SettingGroup>
                  <SettingLabel $isDarkMode={isDarkMode}>Post Types</SettingLabel>
                  <CheckboxGrid>
                    {[
                      { id: 'text', label: 'Text Posts' },
                      { id: 'image', label: 'Images' },
                      { id: 'video', label: 'Videos' },
                      { id: 'link', label: 'Links' },
                      { id: 'poll', label: 'Polls' }
                    ].map(type => (
                      <CheckboxItem key={type.id}>
                        <Checkbox
                          type="checkbox"
                          id={type.id}
                          checked={communityData.allowedPostTypes.includes(type.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCommunityData(prev => ({
                                ...prev,
                                allowedPostTypes: [...prev.allowedPostTypes, type.id]
                              }));
                            } else {
                              setCommunityData(prev => ({
                                ...prev,
                                allowedPostTypes: prev.allowedPostTypes.filter(t => t !== type.id)
                              }));
                            }
                          }}
                        />
                        <CheckboxLabel htmlFor={type.id} $isDarkMode={isDarkMode}>
                          {type.label}
                        </CheckboxLabel>
                      </CheckboxItem>
                    ))}
                  </CheckboxGrid>
                </SettingGroup>

                <SettingGroup>
                  <SettingLabel $isDarkMode={isDarkMode}>Moderation</SettingLabel>
                  <Select
                    $isDarkMode={isDarkMode}
                    value={communityData.moderationLevel}
                    onChange={(e) => setCommunityData(prev => ({ 
                      ...prev, 
                      moderationLevel: e.target.value 
                    }))}
                  >
                    <option value="relaxed">Relaxed - Minimal moderation</option>
                    <option value="moderate">Moderate - Standard moderation</option>
                    <option value="strict">Strict - Heavy moderation</option>
                  </Select>
                </SettingGroup>
              </SettingsGrid>

              <ToggleSettings>
                <ToggleItem>
                  <Checkbox
                    type="checkbox"
                    id="requireApproval"
                    checked={communityData.requireApproval}
                    onChange={(e) => setCommunityData(prev => ({ 
                      ...prev, 
                      requireApproval: e.target.checked 
                    }))}
                  />
                  <ToggleLabel htmlFor="requireApproval" $isDarkMode={isDarkMode}>
                    Require post approval
                  </ToggleLabel>
                </ToggleItem>

                <ToggleItem>
                  <Checkbox
                    type="checkbox"
                    id="allowCrossposting"
                    checked={communityData.allowCrossposting}
                    onChange={(e) => setCommunityData(prev => ({ 
                      ...prev, 
                      allowCrossposting: e.target.checked 
                    }))}
                  />
                  <ToggleLabel htmlFor="allowCrossposting" $isDarkMode={isDarkMode}>
                    Allow crossposting
                  </ToggleLabel>
                </ToggleItem>

                <ToggleItem>
                  <Checkbox
                    type="checkbox"
                    id="flairEnabled"
                    checked={communityData.flairEnabled}
                    onChange={(e) => setCommunityData(prev => ({ 
                      ...prev, 
                      flairEnabled: e.target.checked 
                    }))}
                  />
                  <ToggleLabel htmlFor="flairEnabled" $isDarkMode={isDarkMode}>
                    Enable post flairs
                  </ToggleLabel>
                </ToggleItem>
              </ToggleSettings>
            </Section>

            {/* Welcome Message */}
            <Section $isDarkMode={isDarkMode}>
              <SectionTitle $isDarkMode={isDarkMode}>Welcome Message (Optional)</SectionTitle>
              <Textarea
                $isDarkMode={isDarkMode}
                placeholder="Write a welcome message for new members..."
                value={communityData.welcomeMessage}
                onChange={(e) => setCommunityData(prev => ({ 
                  ...prev, 
                  welcomeMessage: e.target.value 
                }))}
                rows={3}
              />
            </Section>
          </>
      </Content>
    </Container>
  );
};

// Styled Components (similar structure to CreatePostPage but adapted for communities)
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
  position: sticky;
  top: 0;
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

const CreateButton = styled.button`
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
  max-width: 900px;
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

const CreatingAs = styled.div`
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
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: ${props => props.$isDarkMode ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 15%)'};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const FormLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.$isDarkMode ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 15%)'};
`;

const Required = styled.span`
  color: #ef4444;
  font-size: 0.875rem;
`;

const Input = styled.input`
  padding: 0.875rem 1rem;
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
  padding: 0.875rem 1rem;
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

const Select = styled.select`
  padding: 0.875rem 1rem;
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

const HelpText = styled.div`
  font-size: 0.75rem;
  color: ${props => props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)'};
  margin-top: 0.25rem;
`;

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
`;

const CategoryCard = styled.div`
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
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.05);
  }
`;

const CategoryLabel = styled.div`
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
`;

const CategoryDesc = styled.div`
  font-size: 0.75rem;
  color: ${props => props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)'};
`;

const TypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const TypeCard = styled.div`
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
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.05);
  }
`;

const TypeLabel = styled.div`
  font-weight: 600;
  font-size: 0.875rem;
`;

const TypeDesc = styled.div`
  font-size: 0.75rem;
  color: ${props => props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)'};
`;

const IconSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const CurrentIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  background: ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.1)'
    : 'rgba(148, 163, 184, 0.05)'
  };
  border: 2px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.2)'
    : 'rgba(148, 163, 184, 0.15)'
  };

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 10px;
  }
`;

const IconOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const UploadIconButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid ${props => props.$isDarkMode
    ? 'rgba(148, 163, 184, 0.3)'
    : 'rgba(148, 163, 184, 0.4)'
  };
  border-radius: 6px;
  background: transparent;
  color: ${props => props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)'};
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.05);
  }
`;

const IconPicker = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
  gap: 0.5rem;
  margin-top: 1rem;
`;

const IconOption = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 6px;
  border: 2px solid ${props => props.$selected ? '#3b82f6' : 'transparent'};
  background: ${props => props.$selected 
    ? 'rgba(59, 130, 246, 0.1)' 
    : 'rgba(148, 163, 184, 0.05)'
  };
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
  }
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

const RulesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const RuleInput = styled.div`
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

const AddRuleButton = styled.button`
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
  padding: 0.875rem 1rem;
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

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
`;

const SettingGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SettingLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.$isDarkMode ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 15%)'};
`;

const CheckboxGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const CheckboxItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
`;

const CheckboxLabel = styled.label`
  font-size: 0.875rem;
  color: ${props => props.$isDarkMode ? 'hsl(210 40% 85%)' : 'hsl(222.2 84% 30%)'};
  cursor: pointer;
`;

const ToggleSettings = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
`;

const ToggleItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ToggleLabel = styled.label`
  font-size: 0.875rem;
  color: ${props => props.$isDarkMode ? 'hsl(210 40% 85%)' : 'hsl(222.2 84% 30%)'};
  cursor: pointer;
`;

const PreviewSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
`;

const CommunityPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PreviewIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  background: rgba(59, 130, 246, 0.1);
`;

const PreviewInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const PreviewName = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: ${props => props.$isDarkMode ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 15%)'};
  margin: 0;
`;

const PreviewDesc = styled.p`
  color: ${props => props.$isDarkMode ? 'hsl(215 20.2% 65.1%)' : 'hsl(222.2 84% 50%)'};
  margin: 0;
  font-size: 0.875rem;
`;

const PreviewMeta = styled.div`
  font-size: 0.75rem;
  color: ${props => props.$isDarkMode ? 'hsl(215 20.2% 55%)' : 'hsl(222.2 84% 60%)'};
`;

export default CreateCommunityPage;
