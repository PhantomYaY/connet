import React, { useEffect, useState, useCallback } from "react";
import { LogOut, Trash, ArrowLeft, Eye, EyeOff, Wifi } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { signOut, deleteUser } from "firebase/auth";
import styled from "styled-components";
import { useTheme } from "../context/ThemeContext";
import { aiService } from "../lib/aiService";
import { useToast } from "../components/ui/use-toast";
import { apiKeyStorage } from "../lib/apiKeyStorage";
import { userApiKeyStorage, migrateLocalStorageToFirestore } from "../lib/userApiKeyStorage";
import ApiKeyMigration from "../components/ApiKeyMigration";
import { aiAutoLoader } from "../lib/aiAutoLoader";
import { useAI } from "../hooks/useAI";
import AIStatusIndicator from "../components/AIStatusIndicator";

const SettingsPage = () => {
  const [user, setUser] = useState(null);
  const { isDarkMode, setIsDarkMode } = useTheme();
  const [autoSave, setAutoSave] = useState(localStorage.getItem('autoSave') !== 'false');
  const [showWordCount, setShowWordCount] = useState(localStorage.getItem('showWordCount') !== 'false');

  const { toast } = useToast();
  const ai = useAI();

  // AI Settings state - load from new storage system first, then fallback
  const [customOpenAIKey, setCustomOpenAIKey] = useState('');
  const [customGeminiKey, setCustomGeminiKey] = useState('');
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [preferredProvider, setPreferredProvider] = useState(aiService.getUserPreferredProvider() || 'gemini');
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(localStorage.getItem('autoSaveApiKeys') !== 'false');
  const [themeTransition, setThemeTransition] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState({ migrated: false, count: 0 });
  const [geminiModel, setGeminiModel] = useState(aiService.getGeminiModel());
  const [openaiModel, setOpenaiModel] = useState(aiService.getOpenAIModel());

  // Available models
  const geminiModels = [
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', isPremium: false, description: 'Fast and efficient for most tasks' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', isPremium: false, description: 'More capable, slower responses' },
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)', isPremium: true, description: 'Latest experimental model' },
    { id: 'gemini-exp-1206', name: 'Gemini Experimental 1206', isPremium: true, description: 'Advanced experimental features' }
  ];

  const openaiModels = [
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', isPremium: false, description: 'Fast and cost-effective' },
    { id: 'gpt-4', name: 'GPT-4', isPremium: true, description: 'More capable, higher cost' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', isPremium: true, description: 'Latest GPT-4 with improved speed' }
  ];

  const navigate = useNavigate();

  // Debounced auto-save function
  const debounce = useCallback((func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  // Auto-save functions
  const autoSaveOpenAIKey = useCallback(
    debounce(async (key) => {
      if (isAutoSaveEnabled) {
        try {
          // Save to AI service
          aiService.setCustomOpenAIKey(key);

          // Save to user's Firestore storage
          if (key.trim()) {
            await userApiKeyStorage.saveApiKey('openai', key.trim());
            // Also save to localStorage as fallback
            apiKeyStorage.saveApiKey('openai', key.trim());
          } else {
            await userApiKeyStorage.removeApiKey('openai');
            apiKeyStorage.removeApiKey('openai');
          }


          if (key.trim()) {
            toast({
              title: "OpenAI API Key Saved",
              description: "Your OpenAI API key has been automatically saved to your account.",
            });
          }
        } catch (error) {
          console.error('Error auto-saving OpenAI key:', error);
          // Fallback to localStorage only
          if (key.trim()) {
            apiKeyStorage.saveApiKey('openai', key.trim());
          } else {
            apiKeyStorage.removeApiKey('openai');
          }
        }
      }
    }, 1500),
    [isAutoSaveEnabled, toast]
  );

  const autoSaveGeminiKey = useCallback(
    debounce(async (key) => {
      if (isAutoSaveEnabled) {
        try {
          // Save to AI service
          aiService.setCustomGeminiKey(key);

          // Save to user's Firestore storage
          if (key.trim()) {
            await userApiKeyStorage.saveApiKey('google', key.trim());
            // Also save to localStorage as fallback
            apiKeyStorage.saveApiKey('google', key.trim());
          } else {
            await userApiKeyStorage.removeApiKey('google');
            apiKeyStorage.removeApiKey('google');
          }


          if (key.trim()) {
            toast({
              title: "Gemini API Key Saved",
              description: "Your Gemini API key has been automatically saved to your account.",
            });
          }
        } catch (error) {
          console.error('Error auto-saving Gemini key:', error);
          // Fallback to localStorage only
          if (key.trim()) {
            apiKeyStorage.saveApiKey('google', key.trim());
          } else {
            apiKeyStorage.removeApiKey('google');
          }
        }
      }
    }, 1500),
    [isAutoSaveEnabled, toast]
  );

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) return navigate("/");
      setUser(currentUser);

      // Load API keys from Firestore when user logs in
      await loadUserApiKeys();

      // Check for and migrate localStorage keys
      await checkAndMigrateKeys();
    });
    return () => unsubscribe();
  }, [navigate]);

  // Load API keys from user's Firestore storage
  const loadUserApiKeys = async () => {
    try {
      const openaiKey = await userApiKeyStorage.getApiKey('openai');
      const geminiKey = await userApiKeyStorage.getApiKey('google');

      setCustomOpenAIKey(openaiKey || '');
      setCustomGeminiKey(geminiKey || '');

      // Also update the AI service with loaded keys
      if (openaiKey) aiService.setCustomOpenAIKey(openaiKey);
      if (geminiKey) aiService.setCustomGeminiKey(geminiKey);
    } catch (error) {
      console.error('Error loading user API keys:', error);
    }
  };

  // Check for localStorage keys and migrate them
  const checkAndMigrateKeys = async () => {
    try {
      const localServices = apiKeyStorage.getStoredServices();
      if (localServices.length > 0) {
        const result = await migrateLocalStorageToFirestore();
        setMigrationStatus({ migrated: true, count: result.migrated });

        if (result.migrated > 0) {
          toast({
            title: "API Keys Migrated",
            description: `Successfully migrated ${result.migrated} API key(s) to your account. They will now be saved across all your devices.`,
          });

          // Reload keys after migration
          await loadUserApiKeys();
        }
      }
    } catch (error) {
      console.error('Error during migration:', error);
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    setThemeTransition(true);

    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }

    // Reset transition state after animation
    setTimeout(() => setThemeTransition(false), 500);
  }, [isDarkMode]);

  useEffect(() => {
    autoSaveOpenAIKey(customOpenAIKey);
  }, [customOpenAIKey, autoSaveOpenAIKey]);

  useEffect(() => {
    autoSaveGeminiKey(customGeminiKey);
  }, [customGeminiKey, autoSaveGeminiKey]);

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


  const handleSaveGeminiKey = async () => {
    try {
      // Save to AI service
      aiService.setCustomGeminiKey(customGeminiKey);

      // Save to user's Firestore storage
      if (customGeminiKey.trim()) {
        await userApiKeyStorage.saveApiKey('google', customGeminiKey.trim());
        // Also save to localStorage as fallback
        apiKeyStorage.saveApiKey('google', customGeminiKey.trim());
      } else {
        await userApiKeyStorage.removeApiKey('google');
        apiKeyStorage.removeApiKey('google');
      }

      setSaveStates(prev => ({ ...prev, gemini: true }));
      setTimeout(() => setSaveStates(prev => ({ ...prev, gemini: false })), 2000);

      if (customGeminiKey.trim()) {
        // Refresh AI services after saving key
        await ai.refresh();
        toast({
          title: "Gemini API Key Saved",
          description: "Your Gemini API key has been saved securely to your account! AI features are now available.",
        });
      } else {
        toast({
          title: "Gemini API Key Removed",
          description: "Gemini API key removed from your account. AI features using Gemini are disabled.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving Gemini key:', error);
      // Fallback to localStorage only
      if (customGeminiKey.trim()) {
        apiKeyStorage.saveApiKey('google', customGeminiKey.trim());
      } else {
        apiKeyStorage.removeApiKey('google');
      }

      toast({
        title: "API Key Saved Locally",
        description: "Your Gemini API key was saved locally. For cross-device access, please check your connection.",
        variant: "destructive",
      });
    }
  };

  const handleProviderChange = (provider) => {
    setPreferredProvider(provider);
    aiService.setUserPreferredProvider(provider);
    toast({
      title: "AI Provider Updated",
      description: `Switched to ${provider === 'openai' ? 'OpenAI' : 'Google Gemini'} as your preferred AI provider.`,
    });
  };

  const handleGeminiModelChange = (modelId) => {
    setGeminiModel(modelId);
    aiService.setGeminiModel(modelId);
    const model = geminiModels.find(m => m.id === modelId);
    toast({
      title: "Gemini Model Updated",
      description: `Switched to ${model?.name}. ${model?.isPremium ? 'Note: This is a premium model.' : ''}`,
      variant: model?.isPremium ? "destructive" : "default"
    });
  };

  const handleOpenAIModelChange = (modelId) => {
    setOpenaiModel(modelId);
    aiService.setOpenAIModel(modelId);
    const model = openaiModels.find(m => m.id === modelId);
    toast({
      title: "OpenAI Model Updated",
      description: `Switched to ${model?.name}. ${model?.isPremium ? 'Note: This requires a paid OpenAI plan.' : ''}`,
      variant: model?.isPremium ? "destructive" : "default"
    });
  };

  const handleAutoSaveToggle = (enabled) => {
    setIsAutoSaveEnabled(enabled);
    localStorage.setItem('autoSaveApiKeys', enabled.toString());
    toast({
      title: enabled ? "Auto-save Enabled" : "Auto-save Disabled",
      description: enabled ? "API keys will be automatically saved as you type." : "You'll need to manually save API keys.",
    });
  };

  const handleThemeToggle = () => {
    setThemeTransition(true);
    setIsDarkMode((prev) => !prev);
    toast({
      title: `Switched to ${!isDarkMode ? 'Dark' : 'Light'} Mode`,
      description: `The interface is now in ${!isDarkMode ? 'dark' : 'light'} mode.`,
    });
  };

  const handleNetworkTest = async () => {
    try {
      if (window.networkDebugger) {
        await window.networkDebugger.healthCheck();
        window.networkDebugger.printSummary();
        alert('Network test completed! Check the browser console for detailed results.');
      } else {
        alert('Network debugger not available.');
      }
    } catch (error) {
      alert(`Network test failed: ${error.message}`);
    }
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
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">AI Settings</h2>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Configure your AI provider and add API keys.</div>
          </div>

          <div className="space-y-6 pt-4">
            {/* Provider Selection */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Preferred Provider</h3>
              <div className="grid grid-cols-2 gap-4">
                <label className={`ai-provider-card ${preferredProvider === 'openai' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="provider"
                    value="openai"
                    checked={preferredProvider === 'openai'}
                    onChange={() => handleProviderChange('openai')}
                    className="sr-only"
                  />
                  <div className="provider-content">
                    <div className="provider-icon openai"></div>
                    <div className="provider-info">
                      <span className="provider-name">OpenAI</span>
                      <span className="provider-model">{openaiModels.find(m => m.id === openaiModel)?.name || 'GPT-3.5 Turbo'}</span>
                    </div>
                  </div>
                </label>

                <label className={`ai-provider-card ${preferredProvider === 'gemini' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="provider"
                    value="gemini"
                    checked={preferredProvider === 'gemini'}
                    onChange={() => handleProviderChange('gemini')}
                    className="sr-only"
                  />
                  <div className="provider-content">
                    <div className="provider-icon gemini"></div>
                    <div className="provider-info">
                      <span className="provider-name">Google Gemini</span>
                      <span className="provider-model">{geminiModels.find(m => m.id === geminiModel)?.name || 'Gemini 1.5 Flash'}</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Model Configuration - Only show for active provider */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                {preferredProvider === 'openai' ? 'OpenAI' : 'Gemini'} Model
              </h3>

              {preferredProvider === 'openai' ? (
                <div className="model-dropdown-container">
                  <select
                    value={openaiModel}
                    onChange={(e) => handleOpenAIModelChange(e.target.value)}
                    className="model-dropdown"
                  >
                    {openaiModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} {model.isPremium ? '(Premium)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="model-dropdown-container">
                  <select
                    value={geminiModel}
                    onChange={(e) => handleGeminiModelChange(e.target.value)}
                    className="model-dropdown"
                  >
                    {geminiModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} {model.isPremium ? '(Premium)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* API Keys */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">API Keys</h3>

              {/* OpenAI API Key */}
              <div className="api-key-section">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  OpenAI API Key
                </label>
                <div className="api-key-input-group">
                  <input
                    type={showOpenAIKey ? "text" : "password"}
                    value={customOpenAIKey}
                    onChange={(e) => setCustomOpenAIKey(e.target.value)}
                    placeholder="sk-..."
                    className="api-key-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                    className="api-key-toggle"
                  >
                    {showOpenAIKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Gemini API Key */}
              <div className="api-key-section">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Gemini API Key
                </label>
                <div className="api-key-input-group">
                  <input
                    type={showGeminiKey ? "text" : "password"}
                    value={customGeminiKey}
                    onChange={(e) => setCustomGeminiKey(e.target.value)}
                    placeholder="AIza..."
                    className="api-key-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="api-key-toggle"
                  >
                    {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>


            </div>
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
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Switch between light and dark themes</div>
              </div>
              <div className="relative">
                <label className={`switch ${themeTransition ? 'transitioning' : ''}`}>
                  <input type="checkbox" checked={isDarkMode} onChange={handleThemeToggle} />
                  <span className="slider">
                    <div className="star star_1" />
                    <div className="star star_2" />
                    <div className="star star_3" />
                    <svg viewBox="0 0 16 16" className="cloud_1 cloud">
                      <path transform="matrix(.77976 0 0 .78395-299.99-418.63)" fill="#fff" d="m391.84 540.91c-.421-.329-.949-.524-1.523-.524-1.351 0-2.451 1.084-2.485 2.435-1.395.526-2.388 1.88-2.388 3.466 0 1.874 1.385 3.423 3.182 3.667v.034h12.73v-.006c1.775-.104 3.182-1.584 3.182-3.395 0-1.747-1.309-3.186-2.994-3.379.007-.106.011-.214.011-.322 0-2.707-2.271-4.901-5.072-4.901-2.073 0-3.856 1.202-4.643 2.925" />
                    </svg>
                  </span>
                </label>
                <div className="theme-feedback">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 block">
                    Current: {isDarkMode ? 'Dark' : 'Light'} Mode
                  </span>
                </div>
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
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Automatically save changes while typing</div>
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
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Display word count in editor</div>
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

  .ai-provider-card {
    border: 2px solid rgba(203, 213, 225, 0.5);
    border-radius: 12px;
    padding: 1rem;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    background: rgba(248, 250, 252, 0.5);
    pointer-events: auto;
    position: relative;

    &:hover {
      border-color: rgba(59, 130, 246, 0.5);
      background: rgba(59, 130, 246, 0.05);
    }

    &.selected {
      border-color: #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .provider-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .provider-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;

      &.openai {
        background: linear-gradient(135deg, #00a67e, #26d0ce);
      }

      &.gemini {
        background: linear-gradient(135deg, #4285f4, #9aa0fc);
      }
    }

    .provider-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .provider-name {
      font-weight: 600;
      color: #1f2937;
      font-size: 0.9rem;
    }

    .provider-model {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .dark & {
      background: rgba(15, 23, 42, 0.5);
      border-color: rgba(51, 65, 85, 0.5);

      &:hover {
        border-color: rgba(59, 130, 246, 0.5);
        background: rgba(59, 130, 246, 0.1);
      }

      &.selected {
        background: rgba(59, 130, 246, 0.15);
      }

      .provider-name {
        color: #f9fafb;
      }

      .provider-model {
        color: #9ca3af;
      }
    }
  }

  .api-key-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .api-key-input-group {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .api-key-input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid rgba(203, 213, 225, 0.5);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.8);
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.8rem;
    color: #1f2937;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .dark & {
      background: rgba(15, 23, 42, 0.8);
      border-color: rgba(51, 65, 85, 0.5);
      color: #f9fafb;
    }
  }

  .api-key-toggle, .api-key-save {
    padding: 0.75rem;
    border: 1px solid rgba(203, 213, 225, 0.5);
    border-radius: 8px;
    background: rgba(248, 250, 252, 0.8);
    color: #6b7280;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
    pointer-events: auto;
    position: relative;

    &:hover {
      background: rgba(229, 231, 235, 0.8);
      color: #374151;
    }

    .dark & {
      background: rgba(30, 41, 59, 0.8);
      border-color: rgba(51, 65, 85, 0.5);
      color: #9ca3af;

      &:hover {
        background: rgba(51, 65, 85, 0.8);
        color: #d1d5db;
      }
    }
  }

  .api-key-save {
    background: linear-gradient(135deg, #10b981, #16a34a);
    color: white;
    border-color: transparent;
    transition: background-color 0.3s ease, box-shadow 0.3s ease;
    pointer-events: auto;
    position: relative;
    z-index: 1;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #059669, #15803d);
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
    }

    &.saved {
      background: linear-gradient(135deg, #059669, #15803d);
      animation: successPulse 0.5s ease-in-out;
    }

    &:disabled {
      opacity: 0.8;
      cursor: not-allowed;
    }
  }

  @keyframes successPulse {
    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
  }

  .api-key-help {
    background: rgba(59, 130, 246, 0.05);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 8px;
    padding: 0.75rem;
    pointer-events: auto;
    position: relative;

    .dark & {
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.3);
    }

    /* Ensure links within help text are clickable */
    a {
      pointer-events: auto !important;
      z-index: 20;
      position: relative;
      color: #2563eb;

      &:hover {
        color: #1d4ed8;
        text-decoration: underline;
      }

      .dark & {
        color: #60a5fa;

        &:hover {
          color: #93c5fd;
        }
      }
    }
  }

  /* Enhanced switch styles */
  .switch.transitioning {
    filter: brightness(1.1);
    transition: filter 0.3s ease;
  }

  .theme-feedback {
    text-align: center;
    margin-top: 0.5rem;
  }

  /* Small toggle for auto-save */
  .toggle-small {
    position: relative;
    display: inline-block;
    width: 32px;
    height: 18px;
  }

  .toggle-small input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-small-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #cbd5e1;
    transition: 0.3s;
    border-radius: 18px;
  }

  .toggle-small-slider:before {
    position: absolute;
    content: "";
    height: 14px;
    width: 14px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .toggle-small input:checked + .toggle-small-slider {
    background-color: #3b82f6;
  }

  .toggle-small input:checked + .toggle-small-slider:before {
    transform: translateX(14px);
  }

  .dark .toggle-small-slider {
    background-color: #475569;
  }

  .dark .toggle-small input:checked + .toggle-small-slider {
    background-color: #60a5fa;
  }

  /* Enhanced transitions for theme switching - excluding interactive elements */
  .glass-card,
  .glass-card *:not(button):not(input):not(select):not(label):not(a):not(.api-key-toggle):not(.api-key-save):not(.toggle-slider):not(.toggle-small-slider) {
    transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
  }

  /* Prevent background elements from blocking links */
  .glass-card p,
  .api-key-help p {
    pointer-events: none;
  }

  .glass-card p a,
  .api-key-help p a {
    pointer-events: auto !important;
  }

  .glass-card {
    transition: all 0.3s ease;
  }

  /* Ensure all interactive elements are clickable */
  button,
  input,
  select,
  label,
  a,
  .ai-provider-card,
  .api-key-toggle,
  .api-key-save,
  .toggle,
  .toggle-small,
  .button-logout,
  .button-delete {
    pointer-events: auto !important;
    position: relative;
    z-index: 10;
  }

  /* Specific styling for links to ensure they're clickable */
  a {
    cursor: pointer !important;
    text-decoration: underline;
    display: inline;
    z-index: 999 !important;
    position: relative;
  }

  a:hover {
    text-decoration: underline !important;
    opacity: 0.8;
    background-color: rgba(59, 130, 246, 0.1);
    padding: 1px 2px;
    border-radius: 2px;
  }

  /* Fix for radio inputs and labels */
  .ai-provider-card input[type="radio"] {
    position: absolute;
    opacity: 0;
    pointer-events: auto;
    z-index: 20;
    width: 100%;
    height: 100%;
    margin: 0;
    cursor: pointer;
  }

  /* Prevent transform animations on critical buttons */
  .api-key-save:hover,
  .button-logout:hover,
  .button-delete:hover,
  .ai-provider-card:hover {
    transform: none !important;
  }

  /* Model dropdown styles */
  .model-dropdown-container {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .model-dropdown {
    padding: 0.75rem;
    border: 1px solid rgba(203, 213, 225, 0.5);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.8);
    color: #1f2937;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    &:hover {
      border-color: rgba(59, 130, 246, 0.5);
    }

    .dark & {
      background: rgba(15, 23, 42, 0.8);
      border-color: rgba(51, 65, 85, 0.5);
      color: #f9fafb;

      &:focus {
        border-color: #60a5fa;
        box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
      }

      &:hover {
        border-color: rgba(96, 165, 250, 0.5);
      }
    }
  }

  .model-info {
    background: rgba(59, 130, 246, 0.05);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 6px;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    .dark & {
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.3);
    }
  }

  .model-description {
    font-size: 0.8rem;
    color: #6b7280;
    line-height: 1.4;

    .dark & {
      color: #9ca3af;
    }
  }

  .premium-warning {
    font-size: 0.75rem;
    color: #d97706;
    font-weight: 500;
    background: rgba(217, 119, 6, 0.1);
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid rgba(217, 119, 6, 0.2);

    .dark & {
      color: #fbbf24;
      background: rgba(217, 119, 6, 0.15);
      border-color: rgba(217, 119, 6, 0.3);
    }
  }
`;

export default SettingsPage;
