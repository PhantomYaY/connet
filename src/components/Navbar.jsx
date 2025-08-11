import React, { useState, useEffect, useRef } from "react";
import React, { useState } from "react";
import {
  Menu,
  Sun,
  Moon,
  Settings,
  FilePlus,
  Star,
  FolderPlus,
  Save,
  Bot,
  Sparkles,
} from "lucide-react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useCommandPalette } from "./CommandPalette";
import OptimizedProfileAvatar from "./OptimizedProfileAvatar";
import NotificationButton from "./NotificationButton";

const Navbar = ({ onToggleSidebar }) => {
  const { isDarkMode, setIsDarkMode } = useTheme();
  const commandPalette = useCommandPalette();
  const { openPalette } = commandPalette || {};
  const navigate = useNavigate();
  const [showASCII, setShowASCII] = useState(false);


  return (
    <>
      <NavWrapper $isDarkMode={isDarkMode}>
        <div className="container">
          <div className="left">
            <button className="menu-btn" onClick={onToggleSidebar}>
              <Menu size={20} />
            </button>
            <div
              className="logo"
              onClick={(e) => {
                if (e.shiftKey) {
                  e.preventDefault();
                  setShowASCII(prev => !prev);
                } else {
                  navigate("/dashboard");
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && navigate("/dashboard")
              }
              title={showASCII ? "Click to return to normal logo" : "Shift+Click for ASCII art"}
            >
              {showASCII ? (
                <ASCIILogo>
                  <pre>{`
 ██████╗ ██████╗ ███╗   ██╗███╗   ██╗███████╗ ██████╗████████╗███████╗██████╗
██╔════╝██╔═══██╗████��  ██║████╗  ██║██╔════╝██╔════╝╚══██╔══╝██╔════╝██╔══██╗
██║     ██║   ██║██╔██╗ ██║██╔██╗ ██║█████╗  ██║        ██║   █████╗  ██║  ██║
██║     ██║   ██║██║╚██╗██║██║╚██╗██║██╔══╝  ██║        ██║   ██╔══╝  ██║  ██║
╚██████╗╚██████╔╝██║ ╚████║██║ ╚████║███████╗╚██████╗   ██║   ███████╗██████╔╝
 ╚═════╝ ╚���════╝ ╚═╝  ╚═══╝╚═╝  ╚═══╝╚══════╝ ╚═════╝   ╚═╝   ╚══════╝╚═════╝`}</pre>
                </ASCIILogo>
              ) : (
                <>Connect<span className="highlight">Ed</span></>
              )}
            </div>
          </div>

          <div className="center">
            <div className="search" onClick={() => openPalette && openPalette()}>
              <span className="icon">⌘</span>
              <input
                type="text"
                placeholder="Press Ctrl+K for commands..."
                value=""
                readOnly
              />
              <kbd>Ctrl+K</kbd>
            </div>
          </div>

          <div className="actions">
            <button onClick={() => {
              // Open AI chat directly
              window.dispatchEvent(new CustomEvent('openAIChat'));
            }} title="AI Assistant">
              <Bot size={18} />
            </button>
            <NotificationButton />
            <button onClick={() => setIsDarkMode((p) => !p)}>
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => navigate("/settings")}>
              <Settings size={18} />
            </button>
            <OptimizedProfileAvatar size="medium" />
          </div>
        </div>
      </NavWrapper>

    </>
  );
};

const ASCIILogo = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 0.35rem;
  line-height: 0.4rem;
  color: ${({ theme }) => theme?.isDark ? '#22c55e' : '#3b82f6'};
  text-shadow: 0 0 10px currentColor;
  white-space: pre;
  cursor: pointer;
  transform: scale(0.8);
  transform-origin: left center;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(0.85);
    text-shadow: 0 0 15px currentColor;
  }

  pre {
    margin: 0;
    padding: 0;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
  }

  @media (max-width: 1024px) {
    transform: scale(0.6);

    &:hover {
      transform: scale(0.65);
    }
  }

  @media (max-width: 768px) {
    transform: scale(0.4);

    &:hover {
      transform: scale(0.45);
    }
  }
`;

export default Navbar;

// Styled Components

const NavWrapper = styled.nav`
  position: fixed;
  width: 100%;
  top: 0;
  padding: 0.5rem 1.5rem;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  background: ${({ $isDarkMode }) =>
    $isDarkMode ? "rgba(15, 23, 42, 0.8)" : "rgba(255, 255, 255, 0.8)"};
  border-bottom: 1px solid ${({ $isDarkMode }) =>
    $isDarkMode ? "rgba(148, 163, 184, 0.1)" : "rgba(203, 213, 225, 0.3)"};
  z-index: 50;
  box-shadow: ${({ $isDarkMode }) =>
    $isDarkMode
      ? "0 4px 24px rgba(0, 0, 0, 0.3)"
      : "0 4px 24px rgba(0, 0, 0, 0.05)"};

  .container {
    max-width: 1500px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    height: 3.5rem;
    padding: 0;
  }

  .left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    z-index: 1;
  }

  .menu-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 8px;
    cursor: pointer;
    color: ${({ $isDarkMode }) => ($isDarkMode ? "#e2e8f0" : "#1e293b")};
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }

    .dark & {
      background: rgba(30, 41, 59, 0.3);
      border: 1px solid rgba(148, 163, 184, 0.1);

      &:hover {
        background: rgba(30, 41, 59, 0.5);
      }
    }
  }

  .logo {
    font-size: 1.4rem;
    font-weight: 900;
    color: ${({ $isDarkMode }) => ($isDarkMode ? "#fff" : "#0f172a")};
    cursor: pointer;
    transition: all 0.2s ease;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    &:hover {
      transform: scale(1.05);
    }

    .highlight {
      background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  .center {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 400px;
    z-index: 0;
  }

  .search {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: ${({ $isDarkMode }) =>
      $isDarkMode ? "rgba(30, 41, 59, 0.5)" : "rgba(241, 245, 249, 0.8)"};
    padding: 0.75rem 1rem;
    border-radius: 12px;
    width: 100%;
    cursor: pointer;
    border: 1px solid ${({ $isDarkMode }) =>
      $isDarkMode ? "rgba(148, 163, 184, 0.1)" : "rgba(203, 213, 225, 0.3)"};
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);

    &:hover {
      background: ${({ $isDarkMode }) =>
        $isDarkMode ? "rgba(30, 41, 59, 0.7)" : "rgba(241, 245, 249, 0.95)"};
      border-color: ${({ $isDarkMode }) =>
        $isDarkMode ? "rgba(148, 163, 184, 0.2)" : "rgba(59, 130, 246, 0.3)"};
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    input {
      border: none;
      outline: none;
      background: transparent;
      flex: 1;
      font-size: 0.875rem;
      color: ${({ $isDarkMode }) => ($isDarkMode ? "#e2e8f0" : "#1e293b")};
      cursor: pointer;
    }

    .icon {
      color: ${({ $isDarkMode }) => ($isDarkMode ? "#94a3b8" : "#475569")};
    }

    kbd {
      font-size: 0.75rem;
      background: ${({ $isDarkMode }) =>
        $isDarkMode ? "rgba(51, 65, 85, 0.8)" : "rgba(226, 232, 240, 0.8)"};
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      color: ${({ $isDarkMode }) => ($isDarkMode ? "#e2e8f0" : "#1e293b")};
      border: 1px solid ${({ $isDarkMode }) =>
        $isDarkMode ? "rgba(148, 163, 184, 0.2)" : "rgba(203, 213, 225, 0.5)"};
      font-weight: 500;
    }
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    z-index: 1;

    button {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      padding: 8px;
      cursor: pointer;
      color: ${({ $isDarkMode }) => ($isDarkMode ? "#e2e8f0" : "#1e293b")};
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
      }

      .dark & {
        background: rgba(30, 41, 59, 0.3);
        border: 1px solid rgba(148, 163, 184, 0.1);

        &:hover {
          background: rgba(30, 41, 59, 0.5);
        }
      }
    }

  }
`;
