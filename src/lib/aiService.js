// AI Service for OpenAI and Gemini integration
import { apiKeyStorage } from './apiKeyStorage';
import { aiQuotaManager } from './aiQuotaManager';
import { aiRequestThrottle } from './aiRequestThrottle';

class AIService {
  constructor() {
    // Users must provide their own API keys - no environment variable fallback
    console.log('🔑 AI Service: Requiring user-provided API keys only');

    // Load user preferences and custom keys
    this.loadUserSettings();

    // Set default provider based on available keys
    const hasGemini = this.getGeminiKey();
    const hasOpenAI = this.getOpenAIKey();
    this.provider = this.getUserPreferredProvider() || (hasGemini ? 'gemini' : hasOpenAI ? 'openai' : null);
  }

  // Get current API keys (user-provided only) - async version
  async getOpenAIKey() {
    // First try the new API key storage, then fallback to old storage
    return apiKeyStorage.getApiKey('openai') || localStorage.getItem('custom_openai_key') || null;
  }

  async getGeminiKey() {
    // First try the new API key storage, then fallback to old storage
    return apiKeyStorage.getApiKey('google') || localStorage.getItem('custom_gemini_key') || null;
  }

  // Synchronous versions for immediate access
  getOpenAIKeySync() {
    return apiKeyStorage.getApiKey('openai') || localStorage.getItem('custom_openai_key') || null;
  }

  getGeminiKeySync() {
    return apiKeyStorage.getApiKey('google') || localStorage.getItem('custom_gemini_key') || null;
  }

  // User preferences
  getUserPreferredProvider() {
    return localStorage.getItem('preferred_ai_provider');
  }

  setUserPreferredProvider(provider) {
    localStorage.setItem('preferred_ai_provider', provider);
    this.provider = provider;
  }

  // Gemini model management
  getGeminiModel() {
    return localStorage.getItem('gemini_model') || 'gemini-1.5-flash';
  }

  setGeminiModel(model) {
    localStorage.setItem('gemini_model', model);
  }

  // OpenAI model management
  getOpenAIModel() {
    return localStorage.getItem('openai_model') || 'gpt-3.5-turbo';
  }

  setOpenAIModel(model) {
    localStorage.setItem('openai_model', model);
  }

  // Custom API key management
  setCustomOpenAIKey(key) {
    if (key && key.trim()) {
      localStorage.setItem('custom_openai_key', key.trim());
    } else {
      localStorage.removeItem('custom_openai_key');
    }
  }

  setCustomGeminiKey(key) {
    if (key && key.trim()) {
      localStorage.setItem('custom_gemini_key', key.trim());
    } else {
      localStorage.removeItem('custom_gemini_key');
    }
  }

  getCustomOpenAIKey() {
    return localStorage.getItem('custom_openai_key') || '';
  }

  getCustomGeminiKey() {
    return localStorage.getItem('custom_gemini_key') || '';
  }

  loadUserSettings() {
    // Load any other user settings here
  }

  // Check available providers
  getAvailableProviders() {
    const providers = [];
    if (this.getOpenAIKey()) providers.push('openai');
    if (this.getGeminiKey()) providers.push('gemini');
    return providers;
  }

  setProvider(provider) {
    this.provider = provider;
  }

  async generateFlashcards(noteContent) {
    const prompt = `Create comprehensive flashcards from the following note content. Generate between 5-12 flashcards that cover the key concepts, facts, and important details.

Format your response as a JSON array where each flashcard has:
- "question": A clear, specific question
- "answer": A complete, informative answer

Guidelines:
- Make questions specific and test understanding
- Include a mix of factual recall and conceptual questions
- Keep answers concise but complete
- Focus on the most important information

Note content:
${noteContent}

Return ONLY the JSON array with no additional text or formatting:`;

    return this.callAI(prompt);
  }

  async summarizeNotes(notesContent) {
    const prompt = `Summarize the following notes into key points. Keep it concise but comprehensive:

${notesContent}`;

    return this.callAI(prompt);
  }

  async optimizeNoteOrganization(notes) {
    const notesTitles = notes.map(note => note.title).join('\n');
    const prompt = `Analyze these note titles and suggest folder organization categories. Return a JSON object with suggested folder names as keys and arrays of note titles as values:

Note titles:
${notesTitles}

Return only the JSON object, no other text.`;

    return this.callAI(prompt);
  }

  async discoverRelatedTopics(noteContent) {
    const prompt = `Based on this note content, suggest 5 related topics the user might want to study or explore:

${noteContent}

Return as a simple list of topics, one per line.`;

    return this.callAI(prompt);
  }

  async improveWriting(text) {
    const prompt = `Improve the following text for clarity, grammar, and style while maintaining the original meaning:

${text}`;

    return this.callAI(prompt);
  }

  async explainConcept(concept) {
    const prompt = `Explain the concept "${concept}" in simple terms with examples if applicable.`;

    return this.callAI(prompt);
  }

  async calculateReadingTime(content) {
    // Early exit if no API keys are available to avoid unnecessary processing
    const hasOpenAI = this.getOpenAIKeySync();
    const hasGemini = this.getGeminiKeySync();
    if (!hasOpenAI && !hasGemini) {
      return null;
    }

    const cleanContent = content.replace(/<[^>]*>/g, '').trim();
    const wordCount = cleanContent.split(/\s+/).filter(word => word.length > 0).length;

    const prompt = `Based on the following content characteristics, estimate the accurate reading time:

Content word count: ${wordCount}
Content type analysis needed: Determine if this is technical documentation, casual writing, academic text, code documentation, or other type.

Content preview (first 300 characters):
${cleanContent.substring(0, 300)}

Please analyze the content complexity and return a JSON object with:
{
  "estimatedMinutes": <number>,
  "contentType": "<type of content>",
  "complexity": "<low|medium|high>",
  "adjustmentFactor": "<explanation of why reading time might vary>"
}

Base reading speeds:
- Casual content: 250-300 words/minute
- Technical content: 150-200 words/minute
- Academic content: 200-250 words/minute
- Code documentation: 100-150 words/minute

Return only the JSON object, no additional text.`;

    try {
      const result = await this.callAI(prompt);
      return JSON.parse(result);
    } catch (error) {
      // Handle specific error types more gracefully
      if (error.message.includes('No AI API keys configured')) {
        console.log('AI reading time calculation skipped: No API keys configured');
      } else {
        console.warn('AI reading time calculation failed, using fallback:', error.message || error);
      }

      // Return null to indicate AI calculation failed
      // The UI will fall back to basic word count calculation
      return null;
    }
  }

  async callAI(prompt) {
    try {
      // Get API keys asynchronously to ensure we have the latest from user storage
      const [openaiKey, geminiKey] = await Promise.all([
        this.getOpenAIKey(),
        this.getGeminiKey()
      ]);

      // Check if we have valid API keys
      if (!openaiKey && !geminiKey) {
        throw new Error('No AI API keys configured. Please add your OpenAI or Gemini API key in Settings to use AI features.');
      }

      // Get recommended provider based on quota status
      const recommendedProvider = aiQuotaManager.getRecommendedProvider(!!openaiKey, !!geminiKey);

      // Debug: Check AI service status including quota info
      const quotaStatus = aiQuotaManager.getAllQuotaStatus();
      console.log('🔑 AI Service Status:', {
        hasOpenAI: !!openaiKey,
        hasGemini: !!geminiKey,
        selectedProvider: this.provider,
        recommendedProvider,
        quotaStatus
      });

      // If no provider is recommended due to quotas, throw descriptive error
      if (!recommendedProvider) {
        const geminiStatus = aiQuotaManager.getQuotaStatus('gemini');
        const openaiStatus = aiQuotaManager.getQuotaStatus('openai');

        if (geminiStatus.quotaExceeded && openaiStatus.quotaExceeded) {
          throw new Error('🚫 All AI services have exceeded their quotas. Please wait or check your billing.');
        } else if (geminiStatus.quotaExceeded && !openaiKey) {
          throw new Error('🚫 Gemini daily quota exceeded. Please add an OpenAI API key or wait until tomorrow.');
        } else if (openaiStatus.quotaExceeded && !geminiKey) {
          throw new Error('🚫 OpenAI quota exceeded. Please add a Gemini API key or check your OpenAI billing.');
        }
      }

      // Use recommended provider if different from current
      const effectiveProvider = recommendedProvider || this.provider;

      // Try the effective provider first
      if (effectiveProvider === 'openai' && openaiKey) {
        try {
          return await this.callOpenAI(prompt);
        } catch (error) {
          // If quota exceeded and Gemini is available, try fallback
          if (error.message.includes('quota') || error.message.includes('exceeded')) {
            aiQuotaManager.recordQuotaExceeded('openai');
            if (geminiKey && !aiQuotaManager.isLikelyOverQuota('gemini')) {
              console.log('🔄 OpenAI quota exceeded, trying Gemini fallback...');
              return await this.callGemini(prompt);
            }
          }
          throw error;
        }
      } else if (effectiveProvider === 'gemini' && geminiKey) {
        try {
          return await this.callGemini(prompt);
        } catch (error) {
          // If quota exceeded and OpenAI is available, try fallback
          if (error.message.includes('quota') || error.message.includes('exceeded')) {
            aiQuotaManager.recordQuotaExceeded('gemini');
            if (openaiKey && !aiQuotaManager.isLikelyOverQuota('openai')) {
              console.log('🔄 Gemini quota exceeded, trying OpenAI fallback...');
              return await this.callOpenAI(prompt);
            }
          }
          throw error;
        }
      } else if (openaiKey && !aiQuotaManager.isLikelyOverQuota('openai')) {
        // Fallback to OpenAI if available and not over quota
        this.provider = 'openai';
        return await this.callOpenAI(prompt);
      } else if (geminiKey && !aiQuotaManager.isLikelyOverQuota('gemini')) {
        // Fallback to Gemini if available and not over quota
        this.provider = 'gemini';
        return await this.callGemini(prompt);
      } else {
        const availableProviders = [];
        if (openaiKey) availableProviders.push('OpenAI');
        if (geminiKey) availableProviders.push('Gemini');

        if (availableProviders.length === 0) {
          throw new Error('No AI API keys configured. Please add your OpenAI or Gemini API key in Settings to use AI features.');
        } else {
          throw new Error(`All available AI services (${availableProviders.join(', ')}) appear to have quota issues. Please wait or check your billing.`);
        }
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }

  async callOpenAI(prompt) {
    try {
      console.log('🤖 Calling OpenAI API...');
      const apiKey = await this.getOpenAIKey();

      if (!apiKey) {
        throw new Error('OpenAI API key is not configured');
      }

      // Record the request attempt
      aiQuotaManager.recordRequest('openai');

      const model = this.getOpenAIModel();

      // Use throttled request to manage rate limits
      const response = await aiRequestThrottle.throttledRequest('openai', async () => {
        return fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 1000,
            temperature: 0.7,
          }),
        });
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle specific error cases with user-friendly messages
        if (response.status === 401) {
          throw new Error('🔑 Invalid OpenAI API key. Please check your API key in settings.');
        }

        if (response.status === 429) {
          if (errorData.error?.message?.includes('quota') || errorData.error?.message?.includes('insufficient')) {
            aiQuotaManager.recordQuotaExceeded('openai');
            throw new Error('💳 OpenAI quota exceeded or insufficient credits. Please check your OpenAI billing or switch to Gemini in settings.');
          }
          const retryAfter = response.headers.get('retry-after');
          if (retryAfter) {
            aiQuotaManager.recordQuotaExceeded('openai', parseInt(retryAfter));
          }
          throw new Error('⏰ OpenAI rate limit reached. Please wait a moment and try again.');
        }

        if (response.status === 400) {
          throw new Error('📝 Invalid request format. Please try a different prompt.');
        }

        // Generic error with status code but no sensitive data
        throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('❌ OpenAI API Error:', error);

      if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('NetworkError'))) {
        throw new Error('Network error: Could not connect to OpenAI API. Please check your internet connection and API key.');
      }

      if (error.message.includes('401')) {
        throw new Error('🔑 Invalid OpenAI API key. Please check your API key in settings.');
      }

      if (error.message.includes('429')) {
        if (error.message.includes('quota') || error.message.includes('insufficient')) {
          throw new Error('💳 OpenAI quota exceeded or insufficient credits. Please check your OpenAI billing or switch to Gemini in settings.');
        }
        throw new Error('⏰ OpenAI rate limit reached. Please wait a moment and try again.');
      }

      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  async callGemini(prompt) {
    try {
      console.log('🤖 Calling Gemini API...');
      const apiKey = await this.getGeminiKey();

      if (!apiKey) {
        throw new Error('Gemini API key is not configured');
      }

      // Check if likely over quota before making request
      if (aiQuotaManager.isLikelyOverQuota('gemini')) {
        const quotaStatus = aiQuotaManager.getQuotaStatus('gemini');
        if (!quotaStatus.canRetry) {
          throw new Error('🚫 Gemini daily quota exceeded (50 requests). Try again tomorrow, upgrade to a paid plan, or switch to OpenAI.');
        }
      }

      // Record the request attempt
      aiQuotaManager.recordRequest('gemini');

      const model = this.getGeminiModel();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      // Use throttled request to manage rate limits
      const response = await aiRequestThrottle.throttledRequest('gemini', async () => {
        return fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          }),
        });
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle specific error cases with user-friendly messages
        if (response.status === 429) {
          const isQuotaExceeded = errorData.error?.message?.includes('quota') || errorData.error?.message?.includes('exceeded');
          if (isQuotaExceeded) {
            // Parse retry delay from error details if available
            const retryInfo = errorData.error?.details?.find(d => d['@type']?.includes('RetryInfo'));
            const retryDelay = retryInfo?.retryDelay ? parseInt(retryInfo.retryDelay.replace('s', '')) : 24 * 60 * 60; // Default to 24 hours

            aiQuotaManager.recordQuotaExceeded('gemini', retryDelay);
            throw new Error('🚫 Daily quota exceeded for Gemini free tier (50 requests/day). Try again tomorrow, upgrade to a paid plan, or switch to OpenAI in settings.');
          }
          aiQuotaManager.recordQuotaExceeded('gemini', 60); // Short retry for rate limits
          throw new Error('⏰ Too many requests. Please wait a moment and try again.');
        }

        if (response.status === 403) {
          throw new Error('🔑 Invalid API key or insufficient permissions. Please check your Gemini API key in settings.');
        }

        if (response.status === 400) {
          throw new Error('📝 Invalid request format. Please try a different prompt.');
        }

        // Generic error with status code but no sensitive data
        throw new Error(`Gemini API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
    } catch (error) {
      // Log error without exposing API key
      console.error('❌ Gemini API Error:', error.message);

      if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('NetworkError'))) {
        throw new Error('Network error: Could not connect to Gemini API. Please check your internet connection and API key.');
      }

      // Handle specific HTTP error codes
      if (error.message.includes('400')) {
        throw new Error('📝 Invalid request format. Please try a different prompt.');
      }

      if (error.message.includes('403')) {
        throw new Error('🔑 Invalid API key or insufficient permissions. Please check your Gemini API key in settings.');
      }

      if (error.message.includes('429')) {
        if (error.message.includes('quota') || error.message.includes('exceeded')) {
          throw new Error('🚫 Daily quota exceeded for Gemini free tier (50 requests/day). Try again tomorrow, upgrade to a paid plan, or switch to OpenAI in settings.');
        }
        throw new Error('⏰ Rate limit reached. Please wait a moment and try again.');
      }

      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  // Helper method to provide quota management suggestions
  getQuotaManagementTips() {
    return {
      gemini: {
        freeQuota: '50 requests per day',
        suggestions: [
          '⏰ Wait until tomorrow for quota reset',
          '💳 Upgrade to Gemini Pro for higher limits',
          '🔄 Switch to OpenAI if you have credits',
          '📊 Use AI features more selectively'
        ],
        upgradeUrl: 'https://ai.google.dev/gemini-api/docs/rate-limits'
      },
      openai: {
        quotaBased: 'Credit-based billing',
        suggestions: [
          '💳 Add credits to your OpenAI account',
          '📊 Check your usage at platform.openai.com',
          '🔄 Switch to Gemini free tier',
          '⚙️ Use a lower-cost model like GPT-3.5'
        ],
        upgradeUrl: 'https://platform.openai.com/usage'
      }
    };
  }

  // Check if user has alternative services available
  async hasAlternativeService(currentProvider) {
    const openaiKey = await this.getOpenAIKey();
    const geminiKey = await this.getGeminiKey();

    if (currentProvider === 'openai') {
      return !!geminiKey;
    } else if (currentProvider === 'gemini') {
      return !!openaiKey;
    }
    return false;
  }
}

// Create and export the service instance safely
let aiService;
try {
  aiService = new AIService();
} catch (error) {
  console.error('Failed to initialize AI Service:', error);
  // Create a fallback service that returns error messages
  aiService = {
    generateFlashcards: () => Promise.reject(new Error('AI Service not available')),
    summarizeNotes: () => Promise.reject(new Error('AI Service not available')),
    optimizeNoteOrganization: () => Promise.reject(new Error('AI Service not available')),
    discoverRelatedTopics: () => Promise.reject(new Error('AI Service not available')),
    improveWriting: () => Promise.reject(new Error('AI Service not available')),
    explainConcept: () => Promise.reject(new Error('AI Service not available')),
    callAI: () => Promise.reject(new Error('AI Service not available')),
    setProvider: () => {},
    getQuotaManagementTips: () => ({}),
    hasAlternativeService: () => Promise.resolve(false),
  };
}

export { aiService };
