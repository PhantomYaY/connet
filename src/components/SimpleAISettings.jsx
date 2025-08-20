import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Check, Save } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { aiService } from "../lib/aiService";
import { apiKeyStorage } from "../lib/apiKeyStorage";
import { userApiKeyStorage } from "../lib/userApiKeyStorage";
import { useAI } from "../hooks/useAI";

const SimpleAISettings = () => {
  const [customOpenAIKey, setCustomOpenAIKey] = useState('');
  const [customGeminiKey, setCustomGeminiKey] = useState('');
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [saveStates, setSaveStates] = useState({ openai: false, gemini: false });
  const [aiStatus, setAiStatus] = useState({ connected: false, service: null });
  
  const { toast } = useToast();
  const ai = useAI();

  // Load existing keys on mount
  useEffect(() => {
    const loadKeys = async () => {
      try {
        // Try to load from user storage first, then fallback to local storage
        const openaiKey = await userApiKeyStorage.getApiKey('openai') || apiKeyStorage.getApiKey('openai') || '';
        const geminiKey = await userApiKeyStorage.getApiKey('gemini') || apiKeyStorage.getApiKey('gemini') || '';
        
        setCustomOpenAIKey(openaiKey);
        setCustomGeminiKey(geminiKey);
        
        // Check AI status
        if (openaiKey || geminiKey) {
          setAiStatus({ connected: true, service: geminiKey ? 'Gemini' : 'OpenAI' });
        }
      } catch (error) {
        console.error('Error loading API keys:', error);
      }
    };
    
    loadKeys();
  }, []);

  // Auto-save keys as user types
  useEffect(() => {
    const saveKey = async (service, key) => {
      if (key.length > 10) { // Basic validation
        try {
          await userApiKeyStorage.saveApiKey(service, key);
          apiKeyStorage.saveApiKey(service, key);
          
          // Update AI service
          if (service === 'openai') {
            aiService.setCustomOpenAIKey(key);
          } else {
            aiService.setCustomGeminiKey(key);
          }
          
          // Auto-select the provider based on which key was added
          if (service === 'gemini') {
            aiService.setUserPreferredProvider('gemini');
          } else {
            aiService.setUserPreferredProvider('openai');
          }
          
          setAiStatus({ connected: true, service: service === 'gemini' ? 'Gemini' : 'OpenAI' });
          
          toast({
            title: "AI Connected!",
            description: `${service === 'gemini' ? 'Gemini' : 'OpenAI'} is now ready to help you.`,
          });
        } catch (error) {
          console.error('Error saving API key:', error);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      if (customGeminiKey) saveKey('gemini', customGeminiKey);
      if (customOpenAIKey) saveKey('openai', customOpenAIKey);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [customGeminiKey, customOpenAIKey, toast]);

  const clearKey = async (service) => {
    try {
      await userApiKeyStorage.removeApiKey(service);
      apiKeyStorage.removeApiKey(service);
      
      if (service === 'openai') {
        setCustomOpenAIKey('');
        aiService.setCustomOpenAIKey('');
      } else {
        setCustomGeminiKey('');
        aiService.setCustomGeminiKey('');
      }
      
      // Check if any keys remain
      const remainingOpenAI = service === 'openai' ? '' : customOpenAIKey;
      const remainingGemini = service === 'gemini' ? '' : customGeminiKey;
      
      if (!remainingOpenAI && !remainingGemini) {
        setAiStatus({ connected: false, service: null });
      }
      
      toast({
        title: "API Key Removed",
        description: `${service === 'gemini' ? 'Gemini' : 'OpenAI'} API key has been removed.`,
      });
    } catch (error) {
      console.error('Error removing API key:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {aiStatus.connected ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
              ✅
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">AI is Ready!</h3>
              <div className="text-sm text-green-600 dark:text-green-400">
                Connected to {aiStatus.service} • AI features are now active
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
              🤖
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Enable AI Features</h3>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">Add an API key to unlock smart features</div>
            </div>
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300 mb-4">
            ✨ Once set up, AI will automatically help you create flashcards, summarize notes, and improve your writing.
          </div>
        </div>
      )}

      {/* Simple API Key Setup */}
      <div className="space-y-4">
        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Choose your AI service:</div>
        
        {/* Gemini Option (Recommended) */}
        <div className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Google Gemini</span>
              <span className="text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                Recommended • Free
              </span>
            </div>
            {customGeminiKey && (
              <button
                onClick={() => clearKey('gemini')}
                className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                Clear
              </button>
            )}
          </div>
          <div className="space-y-2">
            <div className="relative">
              <input
                type={showGeminiKey ? "text" : "password"}
                value={customGeminiKey}
                onChange={(e) => setCustomGeminiKey(e.target.value)}
                placeholder="Paste your Gemini API key here..."
                className="w-full px-3 py-2 border border-green-300 dark:border-green-700 rounded-lg bg-white dark:bg-zinc-800 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              ✅ Free tier available • Fast responses • Great for students
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Get your free key from{' '}
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Google AI Studio
              </a>
            </div>
          </div>
        </div>

        {/* OpenAI Option */}
        <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">OpenAI</span>
              <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">
                Paid
              </span>
            </div>
            {customOpenAIKey && (
              <button
                onClick={() => clearKey('openai')}
                className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                Clear
              </button>
            )}
          </div>
          <div className="space-y-2">
            <div className="relative">
              <input
                type={showOpenAIKey ? "text" : "password"}
                value={customOpenAIKey}
                onChange={(e) => setCustomOpenAIKey(e.target.value)}
                placeholder="Paste your OpenAI API key here..."
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showOpenAIKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400">
              💳 Requires payment • Advanced features • ChatGPT technology
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Get your API key from{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                OpenAI Platform
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="font-medium mb-1">🔒 Privacy & Security</div>
        <div>Your API keys are encrypted and stored securely. They're only used to connect to AI services and are never shared.</div>
      </div>
    </div>
  );
};

export default SimpleAISettings;
