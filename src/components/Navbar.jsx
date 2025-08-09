import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  Sun,
  Moon,
  Settings,
  FilePlus,
  Star,
  FolderPlus,
  Save,
} from "lucide-react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const Navbar = ({ onToggleSidebar }) => {
  const { isDarkMode, setIsDarkMode } = useTheme();
  const navigate = useNavigate();

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
              onClick={() => navigate("/dashboard")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && navigate("/dashboard")
              }
            >
              Connect<span className="highlight">Ed</span>
            </div>
          </div>

          <div className="center">
            <div
              className="search"
              onClick={() => {
                setShowCommandPalette(true);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
            >
              <span className="icon">🔍</span>
              <input
                type="text"
                placeholder="Search notes, folders, tags..."
                value=""
                readOnly
              />
              <kbd>Ctrl+K</kbd>
            </div>
          </div>

          <div className="actions">
            <button onClick={() => setIsDarkMode((p) => !p)}>
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => navigate("/settings")}>
              <Settings size={18} />
            </button>
            <div className="avatar">DE</div>
          </div>
        </div>
      </NavWrapper>

      {showCommandPalette && (
        <CommandPaletteModal $isDarkMode={isDarkMode} onClick={closePalette}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="search-input-wrapper">
              <span className="icon">🔍</span>
              <input
                ref={inputRef}
                placeholder="Search or run a command..."
                className="modal-input"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
              />
            </div>

            <div className="modal-section">
              {filtered.length === 0 ? (
                <div className="modal-empty">No results</div>
              ) : (
                [...new Set(filtered.map((c) => c.section))].map((sec) => (
                  <div key={sec} className="section-group">
                    <div className="section-title">{sec}</div>
                    {filtered
                      .filter((c) => c.section === sec)
                      .map((c) => {
                        const idx = filtered.findIndex((x) => x.label === c.label);
                        return (
                          <div
                            key={c.label}
                            ref={(el) => (itemRefs.current[idx] = el)}
                            className={`modal-item ${
                              idx === activeIndex ? "active" : ""
                            }`}
                            onMouseEnter={() => setActiveIndex(idx)}
                            onClick={() => {
                              handleCommand(c.label);
                              closePalette();
                            }}
                          >
                            <div className="item-left">
                              {c.icon}
                              <span>{c.label}</span>
                            </div>
                            {c.shortcut && <kbd>{c.shortcut}</kbd>}
                          </div>
                        );
                      })}
                  </div>
                ))
              )}
            </div>
          </div>
        </CommandPaletteModal>
      )}
    </>
  );
};

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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    &:hover {
      transform: scale(1.05);
    }

    .highlight {
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
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

    .avatar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-weight: 700;
      padding: 0.5rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid rgba(255, 255, 255, 0.2);

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
      }
    }
  }
`;

const CommandPaletteModal = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
  display: flex;
  align-items: start;
  justify-content: center;
  padding-top: 6rem;

  .modal-container {
    background: ${({ $isDarkMode }) => ($isDarkMode ? "#1e293b" : "#ffffff")};
    width: 100%;
    max-width: 540px;
    border-radius: 0.75rem;
    overflow: hidden;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
    border: 1px solid
      ${({ $isDarkMode }) => ($isDarkMode ? "#334155" : "#e2e8f0")};
    transition: all 0.2s ease;
  }

  .search-input-wrapper {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-bottom: 1px solid
      ${({ $isDarkMode }) => ($isDarkMode ? "#334155" : "#e2e8f0")};

    .icon {
      font-size: 1rem;
      color: ${({ $isDarkMode }) => ($isDarkMode ? "#94a3b8" : "#64748b")};
    }

    .modal-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-size: 1rem;
      color: ${({ $isDarkMode }) => ($isDarkMode ? "#e2e8f0" : "#1e293b")};
      &::placeholder {
        color: ${({ $isDarkMode }) => ($isDarkMode ? "#64748b" : "#94a3b8")};
      }
    }
  }

  .modal-section {
    max-height: 320px;
    overflow-y: auto;
    padding: 0.5rem 0;

    .section-group {
      padding: 0.5rem 1rem 0.25rem;
    }

    .section-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: ${({ $isDarkMode }) => ($isDarkMode ? "#94a3b8" : "#475569")};
      margin-bottom: 0.25rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .modal-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.6rem 0.75rem;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: background 0.15s ease;
      color: ${({ $isDarkMode }) => ($isDarkMode ? "#e2e8f0" : "#1e293b")};

      &:hover,
      &.active {
        background: ${({ $isDarkMode }) =>
          $isDarkMode ? "#334155" : "#f1f5f9"};
      }

      .item-left {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.95rem;
      }

      kbd {
        font-size: 0.75rem;
        background: ${({ $isDarkMode }) =>
          $isDarkMode ? "#475569" : "#e2e8f0"};
        color: ${({ $isDarkMode }) => ($isDarkMode ? "#e2e8f0" : "#1e293b")};
        padding: 0.2rem 0.4rem;
        border-radius: 0.25rem;
        font-family: inherit;
      }
    }

    .modal-empty {
      padding: 1.25rem;
      text-align: center;
      font-size: 0.9rem;
      color: ${({ $isDarkMode }) => ($isDarkMode ? "#94a3b8" : "#64748b")};
    }
  }
`;
