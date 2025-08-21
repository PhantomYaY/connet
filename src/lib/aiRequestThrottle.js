// AI Request Throttling and Queue Management
class AIRequestThrottle {
  constructor() {
    this.requestQueue = new Map(); // provider -> queue of requests
    this.requestTimestamps = new Map(); // provider -> array of timestamps
    this.activeRequests = new Map(); // provider -> count of active requests
    
    // Rate limits (requests per minute)
    this.rateLimits = {
      gemini: 60, // Conservative estimate for free tier
      openai: 60  // Conservative estimate
    };
    
    // Max concurrent requests
    this.maxConcurrent = {
      gemini: 2,
      openai: 3
    };

    // Cleanup old timestamps every minute
    setInterval(() => this.cleanupOldTimestamps(), 60000);
  }

  // Clean up timestamps older than 1 minute
  cleanupOldTimestamps() {
    const oneMinuteAgo = Date.now() - 60000;
    
    for (const [provider, timestamps] of this.requestTimestamps.entries()) {
      const filtered = timestamps.filter(ts => ts > oneMinuteAgo);
      this.requestTimestamps.set(provider, filtered);
    }
  }

  // Check if request should be throttled
  shouldThrottle(provider) {
    const timestamps = this.requestTimestamps.get(provider) || [];
    const activeCount = this.activeRequests.get(provider) || 0;
    const oneMinuteAgo = Date.now() - 60000;
    
    // Count requests in the last minute
    const recentRequests = timestamps.filter(ts => ts > oneMinuteAgo).length;
    
    // Check rate limit
    if (recentRequests >= this.rateLimits[provider]) {
      return { shouldThrottle: true, reason: 'rate_limit', waitTime: 60000 };
    }
    
    // Check concurrent limit
    if (activeCount >= this.maxConcurrent[provider]) {
      return { shouldThrottle: true, reason: 'concurrent_limit', waitTime: 5000 };
    }
    
    return { shouldThrottle: false };
  }

  // Record request start
  recordRequestStart(provider) {
    // Record timestamp
    const timestamps = this.requestTimestamps.get(provider) || [];
    timestamps.push(Date.now());
    this.requestTimestamps.set(provider, timestamps);
    
    // Increment active count
    const activeCount = this.activeRequests.get(provider) || 0;
    this.activeRequests.set(provider, activeCount + 1);
  }

  // Record request end
  recordRequestEnd(provider) {
    const activeCount = this.activeRequests.get(provider) || 0;
    this.activeRequests.set(provider, Math.max(0, activeCount - 1));
  }

  // Calculate appropriate delay based on recent request pattern
  getThrottleDelay(provider) {
    const timestamps = this.requestTimestamps.get(provider) || [];
    const oneMinuteAgo = Date.now() - 60000;
    const recentRequests = timestamps.filter(ts => ts > oneMinuteAgo);
    
    if (recentRequests.length === 0) return 0;
    
    // If we're hitting rate limits, calculate delay until oldest request expires
    if (recentRequests.length >= this.rateLimits[provider] * 0.8) {
      const oldestRecent = Math.min(...recentRequests);
      const timeUntilExpiry = (oldestRecent + 60000) - Date.now();
      return Math.max(1000, timeUntilExpiry + 1000); // Add 1s buffer
    }
    
    // Adaptive delay based on request frequency
    const avgInterval = recentRequests.length > 1 
      ? (Date.now() - recentRequests[0]) / recentRequests.length 
      : 60000;
    
    const targetInterval = 60000 / this.rateLimits[provider];
    
    if (avgInterval < targetInterval) {
      return Math.min(5000, targetInterval - avgInterval + 500); // Max 5s delay
    }
    
    return 0;
  }

  // Throttled request wrapper
  async throttledRequest(provider, requestFn) {
    const throttleCheck = this.shouldThrottle(provider);
    
    if (throttleCheck.shouldThrottle) {
      console.log(`🕐 Throttling ${provider} request:`, throttleCheck.reason);
      await new Promise(resolve => setTimeout(resolve, throttleCheck.waitTime));
    }
    
    // Additional adaptive delay
    const adaptiveDelay = this.getThrottleDelay(provider);
    if (adaptiveDelay > 0) {
      console.log(`🕐 Adaptive delay for ${provider}:`, adaptiveDelay + 'ms');
      await new Promise(resolve => setTimeout(resolve, adaptiveDelay));
    }
    
    this.recordRequestStart(provider);
    
    try {
      const result = await requestFn();
      return result;
    } finally {
      this.recordRequestEnd(provider);
    }
  }

  // Get current throttle status
  getThrottleStatus(provider) {
    const timestamps = this.requestTimestamps.get(provider) || [];
    const activeCount = this.activeRequests.get(provider) || 0;
    const oneMinuteAgo = Date.now() - 60000;
    const recentRequests = timestamps.filter(ts => ts > oneMinuteAgo).length;
    
    return {
      recentRequests,
      rateLimit: this.rateLimits[provider],
      activeRequests: activeCount,
      maxConcurrent: this.maxConcurrent[provider],
      shouldThrottle: this.shouldThrottle(provider).shouldThrottle,
      utilizationPercent: Math.round((recentRequests / this.rateLimits[provider]) * 100)
    };
  }

  // Queue management for when throttling is needed
  async queueRequest(provider, requestFn, priority = 'normal') {
    return new Promise((resolve, reject) => {
      const queueItem = {
        requestFn,
        resolve,
        reject,
        priority,
        timestamp: Date.now()
      };
      
      if (!this.requestQueue.has(provider)) {
        this.requestQueue.set(provider, []);
      }
      
      const queue = this.requestQueue.get(provider);
      
      // Add to queue based on priority
      if (priority === 'high') {
        queue.unshift(queueItem);
      } else {
        queue.push(queueItem);
      }
      
      // Process queue
      this.processQueue(provider);
    });
  }

  // Process queued requests
  async processQueue(provider) {
    const queue = this.requestQueue.get(provider);
    if (!queue || queue.length === 0) return;
    
    const throttleCheck = this.shouldThrottle(provider);
    if (throttleCheck.shouldThrottle) {
      // Try again after delay
      setTimeout(() => this.processQueue(provider), throttleCheck.waitTime);
      return;
    }
    
    const queueItem = queue.shift();
    if (!queueItem) return;
    
    try {
      const result = await this.throttledRequest(provider, queueItem.requestFn);
      queueItem.resolve(result);
    } catch (error) {
      queueItem.reject(error);
    }
    
    // Process next item if queue not empty
    if (queue.length > 0) {
      setTimeout(() => this.processQueue(provider), 1000);
    }
  }

  // Get queue status
  getQueueStatus(provider) {
    const queue = this.requestQueue.get(provider) || [];
    return {
      queueLength: queue.length,
      estimatedWaitTime: queue.length * 2000, // Rough estimate
      oldestRequest: queue.length > 0 ? Date.now() - queue[queue.length - 1].timestamp : 0
    };
  }
}

// Create singleton instance
export const aiRequestThrottle = new AIRequestThrottle();
export default aiRequestThrottle;
