import React from 'react';
import styled from 'styled-components';
import { ExternalLink, Copy, CheckCircle, AlertTriangle } from 'lucide-react';

const GoogleDriveSetup = () => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
      console.log('Copied to clipboard');
    });
  };

  return (
    <SetupContainer>
      <SetupHeader>
        <h2>🚀 Google Drive Integration Setup</h2>
        <p>Follow these steps to enable Google Drive integration for automatic file hosting</p>
      </SetupHeader>

      <StepsContainer>
        <Step>
          <StepNumber>1</StepNumber>
          <StepContent>
            <h3>Create Google Cloud Project</h3>
            <p>Go to Google Cloud Console and create a new project</p>
            <LinkButton onClick={() => window.open('https://console.cloud.google.com', '_blank')}>
              <ExternalLink size={14} />
              Open Google Cloud Console
            </LinkButton>
          </StepContent>
        </Step>

        <Step>
          <StepNumber>2</StepNumber>
          <StepContent>
            <h3>Enable Google Drive API</h3>
            <ol>
              <li>In your project, go to "APIs & Services" → "Library"</li>
              <li>Search for "Google Drive API"</li>
              <li>Click on it and press "Enable"</li>
              <li>Also enable "Google Picker API"</li>
            </ol>
          </StepContent>
        </Step>

        <Step>
          <StepNumber>3</StepNumber>
          <StepContent>
            <h3>Create API Credentials</h3>
            <ol>
              <li>Go to "APIs & Services" → "Credentials"</li>
              <li>Click "Create Credentials" → "API Key"</li>
              <li>Copy the API key and save it</li>
              <li>Click "Create Credentials" → "OAuth 2.0 Client ID"</li>
              <li>Choose "Web application"</li>
              <li>Add your domain to "Authorized JavaScript origins"</li>
            </ol>
            
            <UrlsToAdd>
              <h4>Add these URLs to Authorized JavaScript origins:</h4>
              <UrlItem>
                <code>http://localhost:5173</code>
                <CopyButton onClick={() => copyToClipboard('http://localhost:5173')}>
                  <Copy size={12} />
                </CopyButton>
              </UrlItem>
              <UrlItem>
                <code>https://your-domain.com</code>
                <CopyButton onClick={() => copyToClipboard('https://your-domain.com')}>
                  <Copy size={12} />
                </CopyButton>
              </UrlItem>
            </UrlsToAdd>
          </StepContent>
        </Step>

        <Step>
          <StepNumber>4</StepNumber>
          <StepContent>
            <h3>Configure Environment Variables</h3>
            <p>Create a <code>.env</code> file in your project root with:</p>
            <CodeBlock>
              <pre>
{`VITE_GOOGLE_API_KEY=your_api_key_here
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com`}
              </pre>
              <CopyButton onClick={() => copyToClipboard(`VITE_GOOGLE_API_KEY=your_api_key_here
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com`)}>
                <Copy size={14} />
              </CopyButton>
            </CodeBlock>
          </StepContent>
        </Step>

        <Step>
          <StepNumber>5</StepNumber>
          <StepContent>
            <h3>Restart Development Server</h3>
            <p>After adding environment variables, restart your development server</p>
            <CodeBlock>
              <pre>npm run dev</pre>
            </CodeBlock>
          </StepContent>
        </Step>
      </StepsContainer>

      <BenefitsSection>
        <h3>✨ Benefits of Google Drive Integration</h3>
        <BenefitsList>
          <BenefitItem>
            <CheckCircle size={16} />
            <div>
              <strong>Automatic URL Generation:</strong> No need to manually create shareable links
            </div>
          </BenefitItem>
          <BenefitItem>
            <CheckCircle size={16} />
            <div>
              <strong>15GB Free Storage:</strong> Google Drive provides generous free storage
            </div>
          </BenefitItem>
          <BenefitItem>
            <CheckCircle size={16} />
            <div>
              <strong>One-Click Upload:</strong> Upload files directly from the app
            </div>
          </BenefitItem>
          <BenefitItem>
            <CheckCircle size={16} />
            <div>
              <strong>Reliable Hosting:</strong> Files hosted on Google's infrastructure
            </div>
          </BenefitItem>
        </BenefitsList>
      </BenefitsSection>

      <WarningSection>
        <AlertTriangle size={16} />
        <div>
          <strong>Important:</strong> Keep your API keys secure and never commit them to public repositories. 
          Use environment variables and add <code>.env</code> to your <code>.gitignore</code> file.
        </div>
      </WarningSection>
    </SetupContainer>
  );
};

const SetupContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 32px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const SetupHeader = styled.div`
  text-align: center;
  margin-bottom: 48px;

  h2 {
    margin: 0 0 12px 0;
    font-size: 28px;
    color: #1f2937;

    .dark & {
      color: #e5e7eb;
    }
  }

  p {
    margin: 0;
    color: #6b7280;
    font-size: 16px;

    .dark & {
      color: #9ca3af;
    }
  }
`;

const StepsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  margin-bottom: 48px;
`;

const Step = styled.div`
  display: flex;
  gap: 20px;
  align-items: flex-start;
`;

const StepNumber = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4285f4, #34a853);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 18px;
  flex-shrink: 0;
`;

const StepContent = styled.div`
  flex: 1;

  h3 {
    margin: 0 0 8px 0;
    color: #1f2937;
    font-size: 18px;

    .dark & {
      color: #e5e7eb;
    }
  }

  p {
    margin: 0 0 16px 0;
    color: #6b7280;
    line-height: 1.6;

    .dark & {
      color: #9ca3af;
    }
  }

  ol {
    margin: 0 0 16px 0;
    padding-left: 20px;
    color: #4b5563;

    .dark & {
      color: #d1d5db;
    }
  }

  li {
    margin-bottom: 8px;
    line-height: 1.5;
  }

  code {
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 13px;

    .dark & {
      background: #374151;
    }
  }
`;

const LinkButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #4285f4;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #3367d6;
    transform: translateY(-1px);
  }
`;

const UrlsToAdd = styled.div`
  margin-top: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;

  .dark & {
    background: #374151;
    border-color: #4b5563;
  }

  h4 {
    margin: 0 0 12px 0;
    color: #374151;
    font-size: 14px;

    .dark & {
      color: #d1d5db;
    }
  }
`;

const UrlItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;

  code {
    flex: 1;
    padding: 8px 12px;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 4px;

    .dark & {
      background: #1f2937;
      border-color: #4b5563;
    }
  }
`;

const CopyButton = styled.button`
  background: #e5e7eb;
  border: 1px solid #d1d5db;
  color: #374151;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #d1d5db;
  }

  .dark & {
    background: #4b5563;
    border-color: #6b7280;
    color: #d1d5db;

    &:hover {
      background: #6b7280;
    }
  }
`;

const CodeBlock = styled.div`
  position: relative;
  background: #1f2937;
  color: #e5e7eb;
  padding: 16px;
  border-radius: 8px;
  margin: 12px 0;

  pre {
    margin: 0;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 13px;
    line-height: 1.5;
  }

  ${CopyButton} {
    position: absolute;
    top: 8px;
    right: 8px;
    background: #374151;
    border-color: #4b5563;

    &:hover {
      background: #4b5563;
    }
  }
`;

const BenefitsSection = styled.div`
  margin-bottom: 32px;

  h3 {
    margin: 0 0 20px 0;
    color: #1f2937;
    font-size: 20px;

    .dark & {
      color: #e5e7eb;
    }
  }
`;

const BenefitsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const BenefitItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;

  svg {
    color: #059669;
    margin-top: 2px;
    flex-shrink: 0;
  }

  div {
    color: #4b5563;
    line-height: 1.5;

    .dark & {
      color: #d1d5db;
    }

    strong {
      color: #1f2937;

      .dark & {
        color: #e5e7eb;
      }
    }
  }
`;

const WarningSection = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  color: #92400e;

  .dark & {
    background: #451a03;
    border-color: #92400e;
    color: #fcd34d;
  }

  svg {
    flex-shrink: 0;
    margin-top: 2px;
  }

  code {
    background: #fbbf24;
    color: #78350f;
    padding: 2px 4px;
    border-radius: 3px;

    .dark & {
      background: #92400e;
      color: #fef3c7;
    }
  }
`;

export default GoogleDriveSetup;
