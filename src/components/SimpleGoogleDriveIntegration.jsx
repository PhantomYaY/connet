import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { Cloud, Upload, ExternalLink, Info, Check, AlertCircle, Loader2, FileText, Share } from 'lucide-react';
import simpleGoogleDrive from '../lib/simpleGoogleDrive';

const SimpleGoogleDriveIntegration = ({ onFilesSelected, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  useEffect(() => {
    initializeGoogleDrive();
  }, []);

  const initializeGoogleDrive = async () => {
    try {
      setIsLoading(true);
      await simpleGoogleDrive.initialize();
    } catch (error) {
      console.error('Failed to initialize Google Drive:', error);

      if (error.message.includes('Failed to load Google APIs')) {
        setError('Could not load Google APIs. Please check your internet connection and try again.');
      } else if (error.message.includes('Failed to load Google Sign-In client')) {
        setError('Could not load Google Sign-In. Please ensure you have access to Google services.');
      } else if (error.message.includes('Failed to load Google API modules')) {
        setError('Could not initialize Google Drive APIs. Please try refreshing the page.');
      } else {
        setError('Failed to load Google Drive. Please check your internet connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const files = await simpleGoogleDrive.pickFiles();
      
      if (files && files.length > 0) {
        setSelectedFiles(files);
        onFilesSelected(files);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('File picker failed:', error);
      setError('Failed to access Google Drive. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadToDrive = async () => {
    try {
      const result = await simpleGoogleDrive.uploadToGoogleDrive();
      setShowInstructions(true);
    } catch (error) {
      console.error('Upload failed:', error);
      setError('Failed to open Google Drive.');
    }
  };

  const handleManualUrl = () => {
    if (!manualUrl.trim()) {
      setError('Please enter a valid Google Drive URL');
      return;
    }

    // Extract file ID from Google Drive URL and create file object
    const fileIdMatch = manualUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const fileId = fileIdMatch ? fileIdMatch[1] : null;

    if (!fileId) {
      setError('Invalid Google Drive URL. Please make sure it\'s a valid sharing link.');
      return;
    }

    const fileName = `Document_${Date.now()}`;
    const manualFile = {
      id: fileId,
      name: fileName,
      fileName: fileName,
      title: fileName,
      downloadURL: `https://drive.google.com/file/d/${fileId}/preview`,
      size: 0,
      fileType: 'pdf', // Default to PDF, user can change later
      folderId: 'root',
      createdAt: new Date(),
      updatedAt: new Date(),
      source: 'manual-google-drive',
      driveFileId: fileId
    };

    onFilesSelected([manualFile]);
    onClose();
  };

  const instructions = simpleGoogleDrive.getPublicSharingInstructions();

  return createPortal(
    <ModalOverlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <HeaderContent>
            <Cloud size={24} color="#4285f4" />
            <HeaderText>
              <h2>Connect to Google Drive</h2>
              <p>Access files from your Google Drive</p>
            </HeaderText>
          </HeaderContent>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

        <ModalContent>
          {error && (
            <ErrorMessage>
              <AlertCircle size={16} />
              {error}
              {(error.includes('Failed to load') || error.includes('Could not load')) && (
                <FallbackButton onClick={() => setShowManualInput(true)}>
                  Use Manual URL Instead
                </FallbackButton>
              )}
            </ErrorMessage>
          )}

          {selectedFiles.length > 0 && (
            <SuccessMessage>
              <Check size={16} />
              Successfully selected {selectedFiles.length} file(s)!
            </SuccessMessage>
          )}

          {showManualInput ? (
            <ManualInputSection>
              <h3>Enter Google Drive URL</h3>
              <p>Paste a Google Drive sharing link directly (use this if the automatic picker isn't working):</p>
              <UrlInputContainer>
                <UrlInput
                  type="url"
                  placeholder="https://drive.google.com/file/d/your-file-id/view"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                />
                <ActionButton onClick={handleManualUrl} $primary>
                  Add File
                </ActionButton>
              </UrlInputContainer>
              <ManualNote>
                <Info size={14} />
                Make sure the file is set to "Anyone with the link can view"
              </ManualNote>
              <ActionButton onClick={() => setShowManualInput(false)}>
                Back to Google Drive Options
              </ActionButton>
            </ManualInputSection>
          ) : (
            <OptionsSection>
            <OptionCard className="option-card">
              <OptionIcon>
                <FileText size={40} color="#4285f4" />
              </OptionIcon>
                <OptionContent>
                  <h3>Select from Google Drive</h3>
                  <p>Choose files already in your Google Drive</p>
                  <ActionButton
                    onClick={handlePickFiles}
                    disabled={isLoading || !!error}
                    $primary
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <FileText size={16} />
                        Pick Files from Drive
                      </>
                    )}
                  </ActionButton>
                </OptionContent>
              </OptionCard>

              <OptionCard className="option-card">
              <OptionIcon>
                <Upload size={40} color="#34a853" />
              </OptionIcon>
                <OptionContent>
                  <h3>Upload New Files</h3>
                  <p>Upload files to your Google Drive first</p>
                  <ActionButton
                    onClick={handleUploadToDrive}
                    disabled={isLoading}
                  >
                    <ExternalLink size={16} />
                    Open Google Drive
                  </ActionButton>
                </OptionContent>
              </OptionCard>
            </OptionsSection>
          )}

          {showInstructions && (
            <InstructionsSection>
              <InstructionsHeader>
                <Info size={20} />
                <h3>Make Your Files Public</h3>
              </InstructionsHeader>
              <p>To view files in the app, they need to be publicly accessible:</p>
              <StepsList>
                {instructions.steps.map((step, index) => (
                  <StepItem key={index}>{step}</StepItem>
                ))}
              </StepsList>
              <Note>
                <Share size={14} />
                {instructions.note}
              </Note>
              <QuickLinks>
                <LinkButton onClick={() => window.open('https://drive.google.com', '_blank')}>
                  <ExternalLink size={14} />
                  Open Google Drive
                </LinkButton>
                <LinkButton onClick={() => setShowInstructions(false)}>
                  Got it!
                </LinkButton>
              </QuickLinks>
            </InstructionsSection>
          )}

          <FeaturesSection>
            <h4>✨ What you can do:</h4>
            <FeatureList>
              <FeatureItem>📄 View PDFs, documents, and presentations</FeatureItem>
              <FeatureItem>🔗 Get shareable links automatically</FeatureItem>
              <FeatureItem>☁️ Files stay in your own Google Drive</FeatureItem>
              <FeatureItem>🔒 You control privacy and permissions</FeatureItem>
            </FeatureList>
          </FeaturesSection>
        </ModalContent>
      </ModalContainer>
    </ModalOverlay>,
    document.body
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 40px;

  /* Ensure it's above everything */
  pointer-events: auto;

  /* Force it to be on top of any potential parent containers */
  isolation: isolate;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 20px;
  max-width: 800px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
  transform: scale(1);
  animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .dark & {
    background: #0f172a;
    color: #e2e8f0;
    border: 1px solid #1e293b;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 20px 20px 0 0;

  .dark & {
    border-color: #334155;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HeaderText = styled.div`
  h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;
    background: linear-gradient(135deg, #4285f4, #34a853);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    .dark & {
      color: #e2e8f0;
      background: linear-gradient(135deg, #60a5fa, #4ade80);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  p {
    margin: 6px 0 0 0;
    font-size: 16px;
    color: #64748b;
    font-weight: 500;

    .dark & {
      color: #94a3b8;
    }
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 4px;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .dark &:hover {
    background: #374151;
    color: #e5e7eb;
  }
`;

const ModalContent = styled.div`
  padding: 32px;
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
  margin-bottom: 20px;

  .dark & {
    background: #7f1d1d;
    border-color: #b91c1c;
    color: #fca5a5;
  }
`;

const SuccessMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  color: #15803d;
  font-size: 14px;
  margin-bottom: 20px;

  .dark & {
    background: #064e3b;
    border-color: #059669;
    color: #a7f3d0;
  }
`;

const OptionsSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const OptionCard = styled.div`
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 28px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #4285f4, #34a853, #fbbc04, #ea4335);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    border-color: #4285f4;
    box-shadow: 0 8px 32px rgba(66, 133, 244, 0.2);
    transform: translateY(-4px) scale(1.02);

    &::before {
      opacity: 1;
    }
  }

  .dark & {
    border-color: #334155;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);

    &:hover {
      border-color: #60a5fa;
      box-shadow: 0 8px 32px rgba(96, 165, 250, 0.2);
    }
  }
`;

const OptionIcon = styled.div`
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
  padding: 16px;
  background: rgba(66, 133, 244, 0.1);
  border-radius: 50%;
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  align-items: center;
  transition: all 0.3s ease;

  .option-card:hover & {
    background: rgba(66, 133, 244, 0.2);
    transform: scale(1.1);
  }

  .dark & {
    background: rgba(96, 165, 250, 0.1);

    .option-card:hover & {
      background: rgba(96, 165, 250, 0.2);
    }
  }
`;

const OptionContent = styled.div`
  h3 {
    margin: 0 0 12px 0;
    color: #1f2937;
    font-size: 18px;
    font-weight: 700;

    .dark & {
      color: #e2e8f0;
    }
  }

  p {
    margin: 0 0 20px 0;
    color: #64748b;
    font-size: 15px;
    line-height: 1.5;

    .dark & {
      color: #94a3b8;
    }
  }
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: ${props => props.$primary ? 'linear-gradient(135deg, #4285f4, #3367d6)' : '#f8fafc'};
  color: ${props => props.$primary ? 'white' : '#475569'};
  border: ${props => props.$primary ? 'none' : '2px solid #e2e8f0'};
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s ease;
  }

  &:hover:not(:disabled) {
    background: ${props => props.$primary ? 'linear-gradient(135deg, #3367d6, #2563eb)' : '#f1f5f9'};
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(66, 133, 244, 0.3);

    &::before {
      left: 100%;
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .dark & {
    background: ${props => props.$primary ? 'linear-gradient(135deg, #4285f4, #3367d6)' : '#1e293b'};
    color: ${props => props.$primary ? 'white' : '#cbd5e1'};
    border-color: ${props => props.$primary ? 'transparent' : '#334155'};

    &:hover:not(:disabled) {
      background: ${props => props.$primary ? 'linear-gradient(135deg, #3367d6, #2563eb)' : '#334155'};
    }
  }
`;

const InstructionsSection = styled.div`
  background: #f0f9ff;
  border: 1px solid #e0f2fe;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;

  .dark & {
    background: #1e3a8a;
    border-color: #1e40af;
  }
`;

const InstructionsHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0c4a6e;
  margin-bottom: 12px;

  h3 {
    margin: 0;
    font-size: 16px;
  }

  .dark & {
    color: #dbeafe;
  }
`;

const StepsList = styled.ol`
  margin: 12px 0;
  padding-left: 20px;
  color: #0f172a;

  .dark & {
    color: #e2e8f0;
  }
`;

const StepItem = styled.li`
  margin-bottom: 6px;
  line-height: 1.4;
`;

const Note = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #e0f2fe;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: #0c4a6e;
  margin: 12px 0;

  .dark & {
    background: #1e40af;
    color: #dbeafe;
  }
`;

const QuickLinks = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
`;

const LinkButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: white;
  color: #0c4a6e;
  border: 1px solid #0c4a6e;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #0c4a6e;
    color: white;
  }

  .dark & {
    background: #1e40af;
    color: #dbeafe;
    border-color: #dbeafe;

    &:hover {
      background: #dbeafe;
      color: #1e40af;
    }
  }
`;

const FeaturesSection = styled.div`
  h4 {
    margin: 0 0 12px 0;
    color: #1f2937;
    font-size: 14px;

    .dark & {
      color: #e5e7eb;
    }
  }
`;

const FeatureList = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureItem = styled.div`
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;

  .dark & {
    color: #9ca3af;
  }
`;

const FallbackButton = styled.button`
  margin-top: 8px;
  background: #4285f4;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #3367d6;
  }
`;

const ManualInputSection = styled.div`
  text-align: center;
  padding: 20px;

  h3 {
    margin: 0 0 8px 0;
    color: #1f2937;
    font-size: 18px;

    .dark & {
      color: #e5e7eb;
    }
  }

  p {
    margin: 0 0 20px 0;
    color: #6b7280;

    .dark & {
      color: #9ca3af;
    }
  }
`;

const UrlInputContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const UrlInput = styled.input`
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #4285f4;
    box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
  }

  .dark & {
    background: #374151;
    border-color: #4b5563;
    color: #e5e7eb;

    &:focus {
      border-color: #60a5fa;
      box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
    }
  }
`;

const ManualNote = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #f0f9ff;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  color: #0c4a6e;
  margin-bottom: 16px;

  .dark & {
    background: #1e3a8a;
    color: #dbeafe;
  }
`;

export default SimpleGoogleDriveIntegration;
