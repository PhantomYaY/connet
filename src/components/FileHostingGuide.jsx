import React from 'react';
import styled from 'styled-components';
import { Cloud, ExternalLink } from 'lucide-react';

const FileHostingGuide = ({ onClose }) => {
  return (
    <GuideOverlay onClick={onClose}>
      <GuideContainer onClick={(e) => e.stopPropagation()}>
        <GuideHeader>
          <HeaderContent>
            <Cloud size={24} color="#4285f4" />
            <h2>Google Drive File Hosting</h2>
          </HeaderContent>
          <CloseButton onClick={onClose}>×</CloseButton>
        </GuideHeader>
        
        <GuideContent>
          <IntroSection>
            <p>Use Google Drive to host your files for free and get shareable URLs. Here's how to do it properly:</p>
          </IntroSection>

          <StepsSection>
            <h3>📝 How to Host Files on Google Drive:</h3>
            <StepsList>
              <StepItem>
                <StepNumber>1</StepNumber>
                <StepContent>
                  <strong>Upload your file</strong> to Google Drive
                  <div className="sub-step">Go to <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer">drive.google.com</a> and upload your PDF, document, or presentation</div>
                </StepContent>
              </StepItem>
              <StepItem>
                <StepNumber>2</StepNumber>
                <StepContent>
                  <strong>Make it shareable</strong>
                  <div className="sub-step">Right-click the file → "Share" → Change from "Restricted" to "Anyone with the link"</div>
                </StepContent>
              </StepItem>
              <StepItem>
                <StepNumber>3</StepNumber>
                <StepContent>
                  <strong>Get the sharing link</strong>
                  <div className="sub-step">Click "Copy link" to get the shareable URL</div>
                </StepContent>
              </StepItem>
              <StepItem>
                <StepNumber>4</StepNumber>
                <StepContent>
                  <strong>Modify the URL for preview</strong>
                  <div className="sub-step">Change the end of the URL from <code>/view</code> to <code>/preview</code> for better viewing</div>
                </StepContent>
              </StepItem>
            </StepsList>
          </StepsSection>

          <ExampleSection>
            <h3>💡 URL Example:</h3>
            <UrlExample>
              <div className="label">Original:</div>
              <div className="url">https://drive.google.com/file/d/ABC123/view</div>
              <div className="label">Modified:</div>
              <div className="url highlight">https://drive.google.com/file/d/ABC123/preview</div>
            </UrlExample>
          </ExampleSection>

          <BenefitsSection>
            <h3>✨ Why Google Drive?</h3>
            <BenefitsList>
              <BenefitItem>📄 Supports PDFs, documents, presentations</BenefitItem>
              <BenefitItem>☁️ 15GB free storage</BenefitItem>
              <BenefitItem>🔗 Direct preview links</BenefitItem>
              <BenefitItem>🔒 You control privacy settings</BenefitItem>
              <BenefitItem>🌐 Works from anywhere</BenefitItem>
              <BenefitItem>💰 Completely free</BenefitItem>
            </BenefitsList>
          </BenefitsSection>

          <TipsSection>
            <h3>🎯 Pro Tips:</h3>
            <TipsList>
              <li>Always test your links in an incognito/private browser window</li>
              <li>Keep your files organized in folders for easy management</li>
              <li>Consider creating a dedicated folder just for shareable files</li>
              <li>The "preview" URL works better than "view" for embedding</li>
            </TipsList>
          </TipsSection>

          <ActionSection>
            <ActionButton
              onClick={() => window.open('https://drive.google.com', '_blank')}
            >
              <ExternalLink size={16} />
              Open Google Drive
            </ActionButton>
          </ActionSection>
        </GuideContent>
      </GuideContainer>
    </GuideOverlay>
  );
};

const GuideOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
`;

const GuideContainer = styled.div`
  background: white;
  border-radius: 16px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

  .dark & {
    background: #1f2937;
    color: #e5e7eb;
  }
`;

const GuideHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background: white;
  border-radius: 16px 16px 0 0;

  .dark & {
    background: #1f2937;
    border-color: #374151;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;

    .dark & {
      color: #e5e7eb;
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

const GuideContent = styled.div`
  padding: 32px;
`;

const IntroSection = styled.div`
  margin-bottom: 32px;

  p {
    font-size: 16px;
    color: #6b7280;
    margin: 0;
    line-height: 1.6;

    .dark & {
      color: #9ca3af;
    }
  }
`;

const StepsSection = styled.div`
  margin-bottom: 32px;

  h3 {
    margin: 0 0 20px 0;
    color: #1f2937;
    font-size: 18px;

    .dark & {
      color: #e5e7eb;
    }
  }
`;

const StepsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StepItem = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;
`;

const StepNumber = styled.div`
  background: #4285f4;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 2px;
`;

const StepContent = styled.div`
  flex: 1;

  strong {
    color: #1f2937;
    font-weight: 600;
    display: block;
    margin-bottom: 4px;

    .dark & {
      color: #e5e7eb;
    }
  }

  .sub-step {
    color: #6b7280;
    font-size: 14px;
    line-height: 1.5;

    .dark & {
      color: #9ca3af;
    }

    a {
      color: #4285f4;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    code {
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 13px;

      .dark & {
        background: #374151;
        color: #e5e7eb;
      }
    }
  }
`;

const ExampleSection = styled.div`
  margin-bottom: 32px;
  background: #f8fafc;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;

  h3 {
    margin: 0 0 16px 0;
    color: #1f2937;
    font-size: 16px;

    .dark & {
      color: #e5e7eb;
    }
  }

  .dark & {
    background: #111827;
    border-color: #374151;
  }
`;

const UrlExample = styled.div`
  .label {
    font-size: 13px;
    font-weight: 600;
    color: #6b7280;
    margin-bottom: 4px;
    margin-top: 12px;

    &:first-child {
      margin-top: 0;
    }

    .dark & {
      color: #9ca3af;
    }
  }

  .url {
    background: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 13px;
    color: #374151;
    border: 1px solid #d1d5db;
    word-break: break-all;

    &.highlight {
      background: #ecfdf5;
      color: #059669;
      border-color: #10b981;
    }

    .dark & {
      background: #374151;
      color: #e5e7eb;
      border-color: #4b5563;

      &.highlight {
        background: #064e3b;
        color: #34d399;
        border-color: #059669;
      }
    }
  }
`;

const BenefitsSection = styled.div`
  margin-bottom: 32px;

  h3 {
    margin: 0 0 16px 0;
    color: #1f2937;
    font-size: 16px;

    .dark & {
      color: #e5e7eb;
    }
  }
`;

const BenefitsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 8px;
`;

const BenefitItem = styled.div`
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;

  .dark & {
    color: #9ca3af;
  }
`;

const TipsSection = styled.div`
  margin-bottom: 32px;
  background: #fefce8;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #fef3c7;

  h3 {
    margin: 0 0 12px 0;
    color: #92400e;
    font-size: 16px;
  }

  .dark & {
    background: #451a03;
    border-color: #92400e;

    h3 {
      color: #fcd34d;
    }
  }
`;

const TipsList = styled.ul`
  margin: 0;
  padding-left: 20px;
  color: #1c1917;

  li {
    margin-bottom: 8px;
    line-height: 1.5;

    .dark & {
      color: #e7e5e4;
    }
  }
`;

const ActionSection = styled.div`
  text-align: center;
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #4285f4;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #3367d6;
    transform: translateY(-1px);
  }
`;

export default FileHostingGuide;
