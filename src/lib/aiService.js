// AI Service for OpenAI and Gemini integration
class AIService {
  constructor() {
    // Safely access environment variables with proper error handling
    this.envOpenaiKey = null;
    this.envGeminiKey = null;

    try {
      // Check if we're in a browser environment and handle accordingly
      if (typeof window !== 'undefined') {
        // In browser with Vite, use import.meta.env
        this.envOpenaiKey = import.meta.env?.VITE_OPENAI_API_KEY || null;
        this.envGeminiKey = import.meta.env?.VITE_GEMINI_API_KEY || null;
      } else if (typeof process !== 'undefined' && process.env) {
        // In Node.js environment (fallback)
        this.envOpenaiKey = process.env.REACT_APP_OPENAI_API_KEY || null;
        this.envGeminiKey = process.env.REACT_APP_GEMINI_API_KEY || null;
      }
    } catch (error) {
      console.warn('Could not access environment variables:', error);
      this.envOpenaiKey = null;
      this.envGeminiKey = null;
    }

    // Load user preferences and custom keys
    this.loadUserSettings();

    // Set default provider based on available keys
    const hasGemini = this.getGeminiKey();
    const hasOpenAI = this.getOpenAIKey();
    this.provider = this.getUserPreferredProvider() || (hasGemini ? 'gemini' : 'openai');
  }

  // Get current API keys (custom or environment)
  getOpenAIKey() {
    const customKey = localStorage.getItem('custom_openai_key');
    return customKey || this.envOpenaiKey;
  }

  getGeminiKey() {
    const customKey = localStorage.getItem('custom_gemini_key');
    return customKey || this.envGeminiKey;
  }

  // User preferences
  getUserPreferredProvider() {
    return localStorage.getItem('preferred_ai_provider');
  }

  setUserPreferredProvider(provider) {
    localStorage.setItem('preferred_ai_provider', provider);
    this.provider = provider;
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
      // Fallback to simple calculation if AI fails
      console.warn('AI reading time calculation failed, using fallback:', error);
      return {
        estimatedMinutes: Math.max(1, Math.ceil(wordCount / 250)),
        contentType: 'general',
        complexity: 'medium',
        adjustmentFactor: 'Standard reading speed applied'
      };
    }
  }

  async callAI(prompt) {
    try {
      const openaiKey = this.getOpenAIKey();
      const geminiKey = this.getGeminiKey();

      // Debug: Check API key status
      console.log('API Key Status:', {
        hasOpenAI: !!openaiKey,
        hasGemini: !!geminiKey,
        provider: this.provider,
        availableProviders: this.getAvailableProviders()
      });

      // Check if we have valid API keys
      if (!openaiKey && !geminiKey) {
        throw new Error('No AI API keys configured. Please add your API keys in the settings or use environment variables.');
      }

      if (this.provider === 'openai' && openaiKey) {
        return await this.callOpenAI(prompt);
      } else if (this.provider === 'gemini' && geminiKey) {
        return await this.callGemini(prompt);
      } else if (openaiKey) {
        // Fallback to OpenAI if available
        this.provider = 'openai';
        return await this.callOpenAI(prompt);
      } else if (geminiKey) {
        // Fallback to Gemini if available
        this.provider = 'gemini';
        return await this.callGemini(prompt);
      } else {
        throw new Error(`No API key configured for ${this.provider}. Please add your API key in the settings.`);
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }

  async callOpenAI(prompt) {
    try {
      console.log('🤖 Calling OpenAI API...');
      const apiKey = this.getOpenAIKey();

      if (!apiKey) {
        throw new Error('OpenAI API key is not configured');
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
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
        throw new Error('Invalid OpenAI API key. Please check your API key in settings.');
      }

      if (error.message.includes('429')) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      }

      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  async callGemini(prompt) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.getGeminiKey()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Could not connect to Gemini API. Please check your internet connection.');
      }
      throw error;
    }
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
  };
}

export { aiService };
