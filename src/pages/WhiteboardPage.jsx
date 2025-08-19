import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PenTool, Square, Circle, Type, Eraser, Download, Upload, Trash2 } from 'lucide-react';

const WhiteboardPage = () => {
  const navigate = useNavigate();

  return (
    <StyledWrapper className="bg-slate-100 dark:bg-slate-900">
      {/* Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]
        bg-[linear-gradient(to_right,theme(colors.slate.300)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.300)_1px,transparent_1px)]
        dark:bg-[linear-gradient(to_right,theme(colors.slate.800)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.800)_1px,transparent_1px)]
        bg-[size:40px_40px]"
      />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-cyan-400/10 via-blue-500/0 to-teal-400/10 animate-pulse-slow" />

      {/* Header */}
      <div className="header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
      </div>

      {/* Canvas Area */}
      <div className="canvas-container">
        <div className="coming-soon">
          <div className="icon">🎨</div>
          <h2>Whiteboard Coming Soon</h2>
          <p>
            The interactive whiteboard feature is currently under development.
            You'll be able to create visual notes, diagrams, and collaborate on ideas.
          </p>
          <div className="features">
            <div className="feature">
              <PenTool size={24} />
              <span>Drawing Tools</span>
            </div>
            <div className="feature">
              <Type size={24} />
              <span>Text & Shapes</span>
            </div>
            <div className="feature">
              <Download size={24} />
              <span>Export & Share</span>
            </div>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;

  @keyframes pulse-slow {
    0%, 100% {
      transform: scale(1);
      opacity: 0.08;
    }
    50% {
      transform: scale(1.03);
      opacity: 0.16;
    }
  }

  .animate-pulse-slow {
    animation: pulse-slow 20s ease-in-out infinite;
  }

  .header {
    display: flex;
    align-items: center;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px);

    .dark & {
      background: rgba(15, 23, 42, 0.8);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.75rem;
    color: #374151;
    font-weight: 500;
    transition: all 0.2s;
    
    .dark & {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #d1d5db;
    }
    
    &:hover {
      background: rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
      
      .dark & {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  }


  .canvas-container {
    flex: 1;
    position: relative;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.5);
    
    .dark & {
      background: rgba(15, 23, 42, 0.5);
    }
  }

  .coming-soon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    max-width: 500px;
    padding: 3rem;
  }

  .icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .coming-soon h2 {
    font-size: 2rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 1rem;
    
    .dark & {
      color: #f9fafb;
    }
  }

  .coming-soon p {
    color: #6b7280;
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 2rem;
    
    .dark & {
      color: #9ca3af;
    }
  }

  .features {
    display: flex;
    justify-content: center;
    gap: 2rem;
    
    .feature {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      color: #3b82f6;
      
      .dark & {
        color: #60a5fa;
      }
      
      span {
        font-size: 0.875rem;
        font-weight: 500;
      }
    }
  }

  @media (max-width: 768px) {
    .header {
      padding: 1rem;
    }

    .features {
      flex-direction: column;
      gap: 1rem;
    }
  }
`;

export default WhiteboardPage;
