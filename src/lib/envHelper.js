// User API key helper for AI services
export const checkAIConfiguration = () => {
  // Check user-provided API keys from localStorage
  const openaiKey = localStorage.getItem('custom_openai_key');
  const geminiKey = localStorage.getItem('custom_gemini_key');

  return {
    hasOpenAI: !!(openaiKey && openaiKey.trim()),
    hasGemini: !!(geminiKey && geminiKey.trim()),
    hasAnyKey: !!((openaiKey && openaiKey.trim()) || (geminiKey && geminiKey.trim())),
    availableProviders: [
      (openaiKey && openaiKey.trim()) && 'OpenAI',
      (geminiKey && geminiKey.trim()) && 'Gemini'
    ].filter(Boolean),
    setupInstructions: `🔑 To enable AI features, add your API keys in Settings:

1. Go to Settings → AI Settings
2. Add your OpenAI API key (from https://platform.openai.com/api-keys)
   OR
3. Add your Gemini API key (from https://makersuite.google.com/app/apikey)
4. Save the key and start chatting!

No environment variables needed - just add your personal API keys in the app.`
  };
};

export const getAIStatus = () => {
  const config = checkAIConfiguration();

  if (config.hasAnyKey) {
    return {
      status: 'ready',
      message: `✅ AI Ready (${config.availableProviders.join(', ')})`,
      providers: config.availableProviders
    };
  } else {
    return {
      status: 'setup_required',
      message: '🔑 Add API Keys to Enable AI',
      instructions: config.setupInstructions
    };
  }
};
