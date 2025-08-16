import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Plus, Trash2, Key, Shield, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { apiKeyStorage } from '../lib/apiKeyStorage';

const ApiKeyManager = ({ isOpen, onClose }) => {
  const [apiKeys, setApiKeys] = useState([]);
  const [newKey, setNewKey] = useState({ service: '', key: '' });
  const [showKey, setShowKey] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  // Predefined services with their patterns and descriptions
  const services = {
    openai: { 
      name: 'OpenAI', 
      placeholder: 'sk-...', 
      description: 'GPT, DALL-E, and other OpenAI services',
      pattern: /^sk-[a-zA-Z0-9]{48,}$/
    },
    anthropic: { 
      name: 'Anthropic', 
      placeholder: 'sk-ant-...', 
      description: 'Claude AI and Anthropic services',
      pattern: /^sk-ant-[a-zA-Z0-9-]{95,}$/
    },
    google: { 
      name: 'Google AI', 
      placeholder: 'AIza...', 
      description: 'Google AI Platform and services',
      pattern: /^[a-zA-Z0-9-_]{39}$/
    },
    huggingface: { 
      name: 'Hugging Face', 
      placeholder: 'hf_...', 
      description: 'Hugging Face models and datasets',
      pattern: /^hf_[a-zA-Z0-9]{34}$/
    },
    custom: { 
      name: 'Custom Service', 
      placeholder: 'your-api-key', 
      description: 'Any other API service',
      pattern: /^[a-zA-Z0-9-_]{10,}$/
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadApiKeys();
    }
  }, [isOpen]);

  const loadApiKeys = () => {
    const storedServices = apiKeyStorage.getStoredServices();
    setApiKeys(storedServices);
  };

  const handleSaveApiKey = () => {
    if (!newKey.service || !newKey.key.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a service and enter an API key",
        variant: "destructive",
      });
      return;
    }

    // Validate API key format
    const service = services[newKey.service];
    if (service && service.pattern && !service.pattern.test(newKey.key.trim())) {
      toast({
        title: "Invalid API Key Format",
        description: `The API key doesn't match the expected format for ${service.name}`,
        variant: "destructive",
      });
      return;
    }

    const success = apiKeyStorage.saveApiKey(newKey.service, newKey.key.trim());
    
    if (success) {
      toast({
        title: "API Key Saved",
        description: `Successfully saved API key for ${services[newKey.service]?.name || newKey.service}`,
      });
      
      setNewKey({ service: '', key: '' });
      setIsAdding(false);
      loadApiKeys();
    } else {
      toast({
        title: "Error",
        description: "Failed to save API key. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveApiKey = (service) => {
    const success = apiKeyStorage.removeApiKey(service);
    
    if (success) {
      toast({
        title: "API Key Removed",
        description: `Removed API key for ${services[service]?.name || service}`,
      });
      loadApiKeys();
    } else {
      toast({
        title: "Error",
        description: "Failed to remove API key. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleShowKey = (service) => {
    setShowKey(prev => ({
      ...prev,
      [service]: !prev[service]
    }));
  };

  const formatKeyDisplay = (service) => {
    if (showKey[service]) {
      return apiKeyStorage.getApiKey(service);
    }
    const key = apiKeyStorage.getApiKey(service);
    if (!key) return '••••••••';
    
    const visibleChars = Math.min(4, key.length);
    return key.substring(0, visibleChars) + '•'.repeat(Math.max(8, key.length - visibleChars));
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">API Key Manager</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Securely store and manage your API keys
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <span className="text-xl text-slate-500">×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Security Notice */}
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">Security Notice</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  API keys are encrypted and stored locally in your browser. They never leave your device.
                </p>
              </div>
            </div>
          </div>

          {/* Existing API Keys */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Stored API Keys</h3>
            
            {apiKeys.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No API keys stored yet</p>
                <p className="text-sm">Add your first API key below</p>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((item) => (
                  <div
                    key={item.service}
                    className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900 dark:text-white">
                            {services[item.service]?.name || item.service}
                          </span>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">
                            {formatKeyDisplay(item.service)}
                          </code>
                          <button
                            onClick={() => toggleShowKey(item.service)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                          >
                            {showKey[item.service] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Added: {formatTimestamp(item.timestamp)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveApiKey(item.service)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove API key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New API Key */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Add New API Key</h3>
              {!isAdding && (
                <Button
                  onClick={() => setIsAdding(true)}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Key
                </Button>
              )}
            </div>

            <AnimatePresence>
              {isAdding && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                >
                  {/* Service Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Service
                    </label>
                    <select
                      value={newKey.service}
                      onChange={(e) => setNewKey(prev => ({ ...prev, service: e.target.value }))}
                      className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="">Select a service</option>
                      {Object.entries(services).map(([key, service]) => (
                        <option key={key} value={key}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                    {newKey.service && services[newKey.service] && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {services[newKey.service].description}
                      </p>
                    )}
                  </div>

                  {/* API Key Input */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={newKey.key}
                      onChange={(e) => setNewKey(prev => ({ ...prev, key: e.target.value }))}
                      placeholder={newKey.service ? services[newKey.service]?.placeholder : 'Enter your API key'}
                      className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSaveApiKey}
                      className="flex-1"
                      disabled={!newKey.service || !newKey.key.trim()}
                    >
                      Save API Key
                    </Button>
                    <Button
                      onClick={() => {
                        setIsAdding(false);
                        setNewKey({ service: '', key: '' });
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ApiKeyManager;
