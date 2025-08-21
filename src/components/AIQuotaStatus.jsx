import React, { useState, useEffect } from 'react';
import { aiQuotaManager } from '../lib/aiQuotaManager';
import { aiService } from '../lib/aiService';

const AIQuotaStatus = ({ className = '' }) => {
  const [quotaStatus, setQuotaStatus] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateQuotaStatus = () => {
      const status = aiQuotaManager.getAllQuotaStatus();
      const availableProviders = aiService.getAvailableProviders();
      setQuotaStatus({ ...status, availableProviders });
    };

    updateQuotaStatus();
    
    // Update every 30 seconds
    const interval = setInterval(updateQuotaStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (!quotaStatus) return null;

  const { gemini, openai, availableProviders } = quotaStatus;
  const hasIssues = gemini.quotaExceeded || openai.quotaExceeded;

  const getStatusIcon = (providerStatus) => {
    if (providerStatus.quotaExceeded) return '🚫';
    if (providerStatus.percentage && providerStatus.percentage > 80) return '⚠️';
    return '✅';
  };

  const getStatusColor = (providerStatus) => {
    if (providerStatus.quotaExceeded) return 'text-red-600';
    if (providerStatus.percentage && providerStatus.percentage > 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
      <div 
        className="p-3 cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">AI Quota Status</span>
          {hasIssues && <span className="text-red-500 text-xs">⚠️ Issues</span>}
        </div>
        <span className="text-gray-400 text-sm">
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 border-t">
          <div className="space-y-2 mt-2">
            {availableProviders.includes('gemini') && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${getStatusColor(gemini)}`}>
                    {getStatusIcon(gemini)} Gemini
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {gemini.quotaExceeded ? (
                    'Quota exceeded'
                  ) : (
                    `${gemini.count}/${gemini.limit || '∞'} requests`
                  )}
                </div>
              </div>
            )}
            
            {availableProviders.includes('openai') && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${getStatusColor(openai)}`}>
                    {getStatusIcon(openai)} OpenAI
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {openai.quotaExceeded ? (
                    'Quota exceeded'
                  ) : (
                    `${openai.count} requests today`
                  )}
                </div>
              </div>
            )}

            {availableProviders.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-2">
                No AI providers configured
              </div>
            )}

            {hasIssues && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <p className="font-medium text-yellow-800">Quota Management Tips:</p>
                <ul className="mt-1 space-y-1 text-yellow-700">
                  {gemini.quotaExceeded && (
                    <li>• Gemini: Wait until tomorrow or upgrade to paid plan</li>
                  )}
                  {openai.quotaExceeded && (
                    <li>• OpenAI: Check billing or add credits</li>
                  )}
                  <li>• Switch between providers in Settings</li>
                  <li>• Use AI features more selectively</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIQuotaStatus;
