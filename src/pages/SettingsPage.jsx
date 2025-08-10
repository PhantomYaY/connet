import React, { useEffect, useState } from "react";
import { LogOut, Trash, ArrowLeft, Eye, EyeOff, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { signOut, deleteUser } from "firebase/auth";
import styled from "styled-components";
import { useTheme } from "../context/ThemeContext";
import { aiService } from "../lib/aiService";

const SettingsPage = () => {
  const [user, setUser] = useState(null);
  const { isDarkMode, setIsDarkMode } = useTheme();
  const [autoSave, setAutoSave] = useState(localStorage.getItem('autoSave') !== 'false');
  const [showWordCount, setShowWordCount] = useState(localStorage.getItem('showWordCount') !== 'false');

  // AI Settings state
  const [customOpenAIKey, setCustomOpenAIKey] = useState(aiService.getCustomOpenAIKey());
  const [customGeminiKey, setCustomGeminiKey] = useState(aiService.getCustomGeminiKey());
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [preferredProvider, setPreferredProvider] = useState(aiService.getUserPreferredProvider() || 'gemini');

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) return navigate("/");
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/", { state: { toast: "Logged out successfully!" } });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "⚠️ WARNING: This will permanently delete your account and all your data. This action cannot be undone. Are you sure you want to proceed?"
    );

    if (!confirmed) return;

    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await deleteUser(currentUser);
        navigate("/", { state: { toast: "Account deleted successfully." } });
      }
    } catch (error) {
      console.error("Account deletion failed:", error);
      alert("Account deletion failed. Please try again after re-authenticating.");
    }
  };

  const handleAutoSaveChange = (checked) => {
    setAutoSave(checked);
    localStorage.setItem('autoSave', checked.toString());
  };

  const handleWordCountChange = (checked) => {
    setShowWordCount(checked);
    localStorage.setItem('showWordCount', checked.toString());
  };

  const handleSaveOpenAIKey = () => {
    aiService.setCustomOpenAIKey(customOpenAIKey);
    alert('OpenAI API key saved successfully!');
  };

  const handleSaveGeminiKey = () => {
    aiService.setCustomGeminiKey(customGeminiKey);
    alert('Gemini API key saved successfully!');
  };

  const handleProviderChange = (provider) => {
    setPreferredProvider(provider);
    aiService.setUserPreferredProvider(provider);
  };

  return (
    <StyledWrapper className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
      <button
        onClick={() => navigate('/dashboard')}
        className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 bg-white/30 dark:bg-zinc-800/40 backdrop-blur-md border border-white/30 dark:border-zinc-600/50 rounded-xl shadow-lg text-sm font-medium text-zinc-800 dark:text-white hover:bg-white/40 dark:hover:bg-zinc-800/60 transition-all"
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </button>

      <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)] bg-[linear-gradient(to_right,theme(colors.slate.300)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.300)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,theme(colors.slate.800)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.800)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-blue-500/0 to-teal-400/10 animate-pulse-slow" />

      <div className="relative z-10 w-full max-w-3xl space-y-10">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Settings</h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">Manage your Connected account</p>
        </header>

        <section className="glass-card hover:shadow-xl transition-shadow duration-300">
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Profile Information</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">View and manage your account details.</p>
          </div>

          <hr className="my-4 border-zinc-200 dark:border-zinc-700" />

          <div className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
            <div className="flex justify-between items-center">
              <span className="font-medium text-zinc-500 dark:text-zinc-400">Name</span>
              <span className="font-semibold">{user?.displayName || "Anonymous"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-zinc-500 dark:text-zinc-400">Email</span>
              <span className="font-semibold">{user?.email || "N/A"}</span>
            </div>
          </div>

          <div className="pt-5">
            <button onClick={handleLogout} className="button-logout w-full justify-center">
              <LogOut size={16} /> Log Out
            </button>
          </div>
        </section>

        <section className="glass-card">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Appearance</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Customize the look and feel of Connected.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Dark Mode</span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Switch between light and dark themes</p>
              </div>
              <div className="relative">
                <label className="switch">
                  <input type="checkbox" checked={isDarkMode} onChange={() => setIsDarkMode((prev) => !prev)} />
                  <span className="slider">
                    <div className="star star_1" />
                    <div className="star star_2" />
                    <div className="star star_3" />
                    <svg viewBox="0 0 16 16" className="cloud_1 cloud">
                      <path transform="matrix(.77976 0 0 .78395-299.99-418.63)" fill="#fff" d="m391.84 540.91c-.421-.329-.949-.524-1.523-.524-1.351 0-2.451 1.084-2.485 2.435-1.395.526-2.388 1.88-2.388 3.466 0 1.874 1.385 3.423 3.182 3.667v.034h12.73v-.006c1.775-.104 3.182-1.584 3.182-3.395 0-1.747-1.309-3.186-2.994-3.379.007-.106.011-.214.011-.322 0-2.707-2.271-4.901-5.072-4.901-2.073 0-3.856 1.202-4.643 2.925" />
                    </svg>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </section>


        <section className="glass-card">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Preferences</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Customize your note-taking experience.</p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Auto-save</span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Automatically save changes while typing</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => handleAutoSaveChange(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Show word count</span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Display word count in editor</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={showWordCount}
                  onChange={(e) => handleWordCountChange(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </section>



        <section className="glass-card">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Danger Zone</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">This action is irreversible. Please proceed with caution.</p>
          </div>

          <div className="bg-zinc-50 dark:bg-slate-800 rounded-xl border border-zinc-200 dark:border-slate-700 p-4 space-y-3">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">Deleting your account will erase all your notes, flashcards, and activity permanently.</p>
            <button onClick={handleDeleteAccount} className="button-delete">
              <Trash size={16} /> Delete My Account
            </button>
            <p className="text-xs text-red-500 text-center">This cannot be undone.</p>
          </div>
        </section>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .glass-card {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-radius: 1.5rem;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  }
  .button-logout {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: linear-gradient(to right, #ef4444, #b91c1c);
    color: white;
    padding: 0.625rem 1.25rem;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
    transition: transform 0.2s;
  }
  .button-logout:hover {
    background: linear-gradient(to right, #dc2626, #991b1b);
  }
  .button-delete {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: linear-gradient(to right, #dc2626, #991b1b);
    color: white;
    padding: 0.625rem 1.25rem;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
    transition: transform 0.2s;
  }
  .button-delete:hover {
    background: linear-gradient(to right, #b91c1c, #7f1d1d);
  }

  .switch {
    font-size: 17px;
    position: relative;
    display: inline-block;
    width: 4em;
    height: 2.2em;
    border-radius: 30px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #2a2a2a;
    transition: 0.4s;
    border-radius: 30px;
    overflow: hidden;
  }
  .slider:before {
    position: absolute;
    content: "";
    height: 1.2em;
    width: 1.2em;
    border-radius: 20px;
    left: 0.5em;
    bottom: 0.5em;
    transition: 0.4s;
    transition-timing-function: cubic-bezier(0.81, -0.04, 0.38, 1.5);
    box-shadow: inset 8px -4px 0px 0px #fff;
  }
  .switch input:checked + .slider {
    background-color: #00a6ff;
  }
  .switch input:checked + .slider:before {
    transform: translateX(1.8em);
    box-shadow: inset 15px -4px 0px 15px #ffcf48;
  }
  .star {
    background-color: #fff;
    border-radius: 50%;
    position: absolute;
    width: 5px;
    transition: all 0.4s;
    height: 5px;
  }
  .star_1 {
    left: 2.5em;
    top: 0.5em;
  }
  .star_2 {
    left: 2.2em;
    top: 1.2em;
  }
  .star_3 {
    left: 3em;
    top: 0.9em;
  }
  .switch input:checked ~ .slider .star {
    opacity: 0;
  }
  .cloud {
    width: 3.5em;
    position: absolute;
    bottom: -1.4em;
    left: -1.1em;
    opacity: 0;
    transition: all 0.4s;
  }
  .switch input:checked ~ .slider .cloud {
    opacity: 1;
  }

  @keyframes pulse-slow {
    0%,
    100% {
      transform: scale(1);
      opacity: 0.1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.3;
    }
  }
  .animate-pulse-slow {
    animation: pulse-slow 20s ease-in-out infinite;
  }

  .toggle {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
  }

  .toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #cbd5e1;
    transition: 0.3s;
    border-radius: 24px;
  }

  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .toggle input:checked + .toggle-slider {
    background-color: #3b82f6;
  }

  .toggle input:checked + .toggle-slider:before {
    transform: translateX(20px);
  }

  .dark .toggle-slider {
    background-color: #475569;
  }

  .dark .toggle input:checked + .toggle-slider {
    background-color: #60a5fa;
  }
`;

export default SettingsPage;
