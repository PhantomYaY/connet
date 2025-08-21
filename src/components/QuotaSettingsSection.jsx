import React, { useState, useEffect } from 'react';
import { aiQuotaManager } from '../lib/aiQuotaManager';
import { aiService } from '../lib/aiService';

const QuotaSettingsSection = () => {
  const [quotaStatus, setQuotaStatus] = useState(null);

  useEffect(() => {
    const updateQuotaStatus = () => {
      const status = aiQuotaManager.getAllQuotaStatus();
      const availableProviders = aiService.getAvailableProviders();
      setQuotaStatus({ ...status, availableProviders });
    };

    updateQuotaStatus();
    
    // Update every 10 seconds when component is visible
    const interval = setInterval(updateQuotaStatus, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const handleResetQuota = (provider) => {
    aiQuotaManager.clearQuotaExceeded(provider);
    const status = aiQuotaManager.getAllQuotaStatus();
    const availableProviders = aiService.getAvailableProviders();
    setQuotaStatus({ ...status, availableProviders });
  };

  if (!quotaStatus) return null;

  const { gemini, openai, availableProviders, lastUpdated } = quotaStatus;

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">AI Quota Status</h3>
      
      <div className="space-y-4">
        {/* Gemini Status */}
        {availableProviders.includes('gemini') && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Google Gemini API</h4>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                gemini.quotaExceeded ? 'bg-red-100 text-red-800' : 
                gemini.percentage > 80 ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {gemini.quotaExceeded ? 'Quota Exceeded' : 
                 gemini.percentage > 80 ? 'Near Limit' : 'Available'}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Requests today:</span>
                <span>{gemini.count}/{gemini.limit || '∞'}</span>
              </div>
              
              {gemini.limit && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      gemini.quotaExceeded ? 'bg-red-500' :
                      gemini.percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, gemini.percentage || 0)}%` }}
                  ></div>
                </div>
              )}
              
              <div className="text-xs text-gray-500">
                Free tier: 50 requests per day
              </div>
              
              {gemini.quotaExceeded && (
                <div className="mt-3">
                  <button
                    onClick={() => handleResetQuota('gemini')}
                    className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                  >
                    Reset Quota Status
                  </button>
                  <div className="text-xs text-gray-600 mt-1">
                    Reset if you think this is incorrect
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* OpenAI Status */}
        {availableProviders.includes('openai') && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">OpenAI API</h4>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                openai.quotaExceeded ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {openai.quotaExceeded ? 'Quota Exceeded' : 'Available'}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Requests today:</span>
                <span>{openai.count}</span>
              </div>
              
              <div className="text-xs text-gray-500">
                Credit-based billing (no daily limit)
              </div>
              
              {openai.quotaExceeded && (
                <div className="mt-3">
                  <button
                    onClick={() => handleResetQuota('openai')}
                    className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                  >
                    Reset Quota Status
                  </button>
                  <div className="text-xs text-gray-600 mt-1">
                    Reset if you've added credits or think this is incorrect
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No Providers */}
        {availableProviders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No AI providers configured</p>
            <p className="text-xs mt-1">Add your API keys above to see quota status</p>
          </div>
        )}

        {/* Quota Management Tips */}
        {(gemini.quotaExceeded || openai.quotaExceeded) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h5 className="font-medium text-yellow-800 mb-2">Quota Management Tips</h5>
            <ul className="text-sm text-yellow-700 space-y-1">
              {gemini.quotaExceeded && (
                <>
                  <li>• Gemini: Wait until tomorrow for quota reset</li>
                  <li>• Upgrade to Gemini Pro for higher limits</li>
                </>
              )}
              {openai.quotaExceeded && (
                <>
                  <li>• OpenAI: Add credits to your account</li>
                  <li>• Check usage at platform.openai.com</li>
                </>
              )}
              <li>• Switch between providers as needed</li>
              <li>• Use AI features more selectively</li>
            </ul>
          </div>
        )}

        {/* Last Updated */}
        <div className="text-xs text-gray-500 text-center">
          Last updated: {lastUpdated} (auto-refreshes every 10 seconds)
        </div>
      </div>
    </div>
  );
};

export default QuotaSettingsSection;
