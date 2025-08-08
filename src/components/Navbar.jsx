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

const COMMANDS = [
  { label: "All Notes", icon: <FilePlus size={16} />, section: "Note Actions" },
  { label: "Favorites", icon: <Star size={16} />, section: "Note Actions" },
  { label: "New Note", shortcut: "Ctrl+N", icon: <FilePlus size={16} />, section: "Note Actions" },
  { label: "New Folder", icon: <FolderPlus size={16} />, section: "Folder Actions" },
  { label: "Save Note", shortcut: "Ctrl+S", icon: <Save size={16} />, section: "Note Actions" },
  { label: "Set Light Mode", icon: <Sun size={16} />, section: "Customization" },
  { label: "Set Dark Mode", icon: <Moon size={16} />, section: "Customization" },
];

const Navbar = ({ onToggleSidebar }) => {
  const { isDarkMode, setIsDarkMode } = useTheme();
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const itemRefs = useRef([]);
  const navigate = useNavigate();

  const filtered = COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommandPalette(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }

      if (!showCommandPalette) return;

      if (["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === "ArrowDown") {
        setActiveIndex((prev) => (prev + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter" && filtered.length > 0) {
        handleCommand(filtered[activeIndex].label);
        closePalette();
      } else if (e.key === "Escape") {
        closePalette();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showCommandPalette, filtered, activeIndex]);

  useEffect(() => {
    const el = itemRefs.current[activeIndex];
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeIndex]);

  const handleCommand = (label) => {
    switch (label) {
      case "Set Light Mode":
        setIsDarkMode(false);
        break;
      case "Set Dark Mode":
        setIsDarkMode(true);
        break;
      default:
        alert(`Executed: ${label}`);
    }
  };

  const closePalette = () => {
    setShowCommandPalette(false);
    setQuery("");
    setActiveIndex(0);
  };

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
  padding: 0.4rem 1.25rem;
  backdrop-filter: blur(10px);
  background-color: ${({ $isDarkMode }) =>
    $isDarkMode ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.5)"};
  border-bottom: 1px solid
    ${({ $isDarkMode }) => ($isDarkMode ? "#1e293b" : "#e2e8f0")};
  z-index: 50;

  .container {
    max-width: 1500px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    height: 3.3rem;
    padding: 0.4rem 1.25rem;
  }

  .left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    z-index: 1;
  }

  .menu-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: ${({ $isDarkMode }) => ($isDarkMode ? "#e2e8f0" : "#1e293b")};
  }

  .logo {
    font-size: 1.25rem;
    font-weight: 800;
    color: ${({ $isDarkMode }) => ($isDarkMode ? "#fff" : "#0f172a")};

    .highlight {
      color: #3b82f6;
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
    gap: 0.5rem;
    background: ${({ $isDarkMode }) => ($isDarkMode ? "#1e293b" : "#f1f5f9")};
    padding: 0.4rem 0.8rem;
    border-radius: 0.5rem;
    width: 100%;
    cursor: pointer;

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
      background: ${({ $isDarkMode }) => ($isDarkMode ? "#334155" : "#e2e8f0")};
      padding: 0.2rem 0.4rem;
      border-radius: 0.25rem;
      color: ${({ $isDarkMode }) => ($isDarkMode ? "#e2e8f0" : "#1e293b")};
    }
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    z-index: 1;

    button {
      background: none;
      border: none;
      cursor: pointer;
      color: ${({ $isDarkMode }) => ($isDarkMode ? "#e2e8f0" : "#1e293b")};
    }

    .avatar {
      background-color: #3b82f6;
      color: white;
      font-weight: bold;
      padding: 0.25rem 0.5rem;
      border-radius: 999px;
      font-size: 0.75rem;
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
