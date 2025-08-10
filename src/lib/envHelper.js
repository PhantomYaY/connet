// Environment variable helper for AI services
export const checkAIConfiguration = () => {
  // Safely access environment variables with proper error handling
  let openaiKey = null;
  let geminiKey = null;

  try {
    // Check if we're in a browser environment and handle accordingly
    if (typeof window !== 'undefined') {
      // In browser, Vite injects env vars at build time, but they may not be available
      openaiKey = import.meta.env?.VITE_OPENAI_API_KEY || null;
      geminiKey = import.meta.env?.VITE_GEMINI_API_KEY || null;
    } else if (typeof process !== 'undefined' && process.env) {
      // In Node.js environment
      openaiKey = process.env.REACT_APP_OPENAI_API_KEY || null;
      geminiKey = process.env.REACT_APP_GEMINI_API_KEY || null;
    }
  } catch (error) {
    console.warn('Could not access environment variables:', error);
    openaiKey = null;
    geminiKey = null;
  }
  
  return {
    hasOpenAI: !!openaiKey,
    hasGemini: !!geminiKey,
    hasAnyKey: !!(openaiKey || geminiKey),
    availableProviders: [
      openaiKey && 'OpenAI',
      geminiKey && 'Gemini'
    ].filter(Boolean),
    setupInstructions: `To enable AI features, add one or both API keys to your environment:

For OpenAI:
VITE_OPENAI_API_KEY=your_openai_api_key

For Gemini:
VITE_GEMINI_API_KEY=your_gemini_api_key

Add these to your .env file in the project root, then restart your development server.`
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
      message: '⚠️ AI Setup Required',
      instructions: config.setupInstructions
    };
  }
};
