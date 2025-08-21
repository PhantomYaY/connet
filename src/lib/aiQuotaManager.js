// AI Quota Management System
class AIQuotaManager {
  constructor() {
    this.storageKey = 'ai_quota_tracking';
    this.resetUsageIfNewDay();
  }

  // Get current date as YYYY-MM-DD
  getCurrentDate() {
    return new Date().toISOString().split('T')[0];
  }

  // Reset usage tracking if it's a new day
  resetUsageIfNewDay() {
    const today = this.getCurrentDate();
    const stored = this.getStoredData();
    
    if (stored.date !== today) {
      // New day, reset all counters
      this.setStoredData({
        date: today,
        gemini: { count: 0, quotaExceeded: false, lastReset: Date.now() },
        openai: { count: 0, quotaExceeded: false, lastReset: Date.now() }
      });
    }
  }

  // Get stored quota data
  getStoredData() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {
        date: this.getCurrentDate(),
        gemini: { count: 0, quotaExceeded: false, lastReset: Date.now() },
        openai: { count: 0, quotaExceeded: false, lastReset: Date.now() }
      };
    } catch (error) {
      console.warn('Error reading quota data:', error);
      return {
        date: this.getCurrentDate(),
        gemini: { count: 0, quotaExceeded: false, lastReset: Date.now() },
        openai: { count: 0, quotaExceeded: false, lastReset: Date.now() }
      };
    }
  }

  // Store quota data
  setStoredData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Error storing quota data:', error);
    }
  }

  // Record API request attempt
  recordRequest(provider) {
    const data = this.getStoredData();
    if (data[provider]) {
      data[provider].count += 1;
      this.setStoredData(data);
    }
  }

  // Record quota exceeded for a provider
  recordQuotaExceeded(provider, retryAfter = null) {
    const data = this.getStoredData();
    if (data[provider]) {
      data[provider].quotaExceeded = true;
      data[provider].retryAfter = retryAfter ? Date.now() + (retryAfter * 1000) : null;
      this.setStoredData(data);
    }
  }

  // Check if provider is likely to be over quota
  isLikelyOverQuota(provider) {
    const data = this.getStoredData();
    const providerData = data[provider];
    
    if (!providerData) return false;

    // If we've recorded a quota exceeded error today
    if (providerData.quotaExceeded) {
      // Check if retry-after time has passed (if available)
      if (providerData.retryAfter && Date.now() < providerData.retryAfter) {
        return true;
      }
      // For Gemini, if quota exceeded and less than 24 hours, still likely over quota
      if (provider === 'gemini' && Date.now() - providerData.lastReset < 24 * 60 * 60 * 1000) {
        return true;
      }
    }

    // Predictive checking based on usage patterns
    if (provider === 'gemini' && providerData.count >= 45) {
      // Getting close to 50 limit
      return true;
    }

    return false;
  }

  // Get quota status for a provider
  getQuotaStatus(provider) {
    const data = this.getStoredData();
    const providerData = data[provider] || { count: 0, quotaExceeded: false };
    
    const limits = {
      gemini: 50, // Free tier daily limit
      openai: null // Credit-based, no fixed daily limit
    };

    return {
      count: providerData.count,
      limit: limits[provider],
      quotaExceeded: providerData.quotaExceeded,
      retryAfter: providerData.retryAfter,
      canRetry: providerData.retryAfter ? Date.now() >= providerData.retryAfter : true,
      percentage: limits[provider] ? Math.round((providerData.count / limits[provider]) * 100) : null
    };
  }

  // Get recommendation for which provider to use
  getRecommendedProvider(hasOpenAI, hasGemini) {
    if (!hasOpenAI && !hasGemini) return null;

    const geminiStatus = this.getQuotaStatus('gemini');
    const openaiStatus = this.getQuotaStatus('openai');

    // If only one provider available, use it (unless definitely over quota)
    if (!hasOpenAI && hasGemini) {
      return geminiStatus.quotaExceeded && !geminiStatus.canRetry ? null : 'gemini';
    }
    if (!hasGemini && hasOpenAI) {
      return openaiStatus.quotaExceeded && !openaiStatus.canRetry ? null : 'openai';
    }

    // Both available - use smart selection
    if (geminiStatus.quotaExceeded && !geminiStatus.canRetry) {
      return 'openai';
    }
    if (openaiStatus.quotaExceeded && !openaiStatus.canRetry) {
      return 'gemini';
    }

    // If Gemini is getting close to limit, prefer OpenAI
    if (geminiStatus.percentage && geminiStatus.percentage > 80) {
      return 'openai';
    }

    // Default preference (Gemini is free)
    return 'gemini';
  }

  // Get user-friendly quota message
  getQuotaMessage(provider) {
    const status = this.getQuotaStatus(provider);
    
    if (provider === 'gemini') {
      if (status.quotaExceeded) {
        return `🚫 Gemini daily quota exceeded (${status.count}/${status.limit}). Resets tomorrow.`;
      }
      if (status.percentage > 80) {
        return `⚠️ Gemini quota running low (${status.count}/${status.limit} used)`;
      }
      return `✅ Gemini quota: ${status.count}/${status.limit} requests used today`;
    }
    
    if (provider === 'openai') {
      if (status.quotaExceeded) {
        return `🚫 OpenAI quota/credits exhausted. Check your billing.`;
      }
      return `✅ OpenAI API available (${status.count} requests today)`;
    }

    return '';
  }

  // Clear quota exceeded status (for manual reset)
  clearQuotaExceeded(provider) {
    const data = this.getStoredData();
    if (data[provider]) {
      data[provider].quotaExceeded = false;
      data[provider].retryAfter = null;
      this.setStoredData(data);
    }
  }

  // Get summary of all providers
  getAllQuotaStatus() {
    return {
      gemini: this.getQuotaStatus('gemini'),
      openai: this.getQuotaStatus('openai'),
      lastUpdated: this.getStoredData().date
    };
  }
}

// Create singleton instance
export const aiQuotaManager = new AIQuotaManager();
export default aiQuotaManager;
