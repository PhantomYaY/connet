import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { migrateLocalStorageToFirestore } from '../lib/userApiKeyStorage';
import { apiKeyStorage } from '../lib/apiKeyStorage';
import { useToast } from './ui/use-toast';
import { Upload, Check, AlertCircle } from 'lucide-react';

const ApiKeyMigration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [migrationStatus, setMigrationStatus] = useState({ 
    needed: false, 
    inProgress: false, 
    completed: false, 
    count: 0 
  });

  useEffect(() => {
    if (user) {
      checkMigrationNeeded();
    }
  }, [user]);

  const checkMigrationNeeded = () => {
    try {
      const localServices = apiKeyStorage.getStoredServices();
      setMigrationStatus(prev => ({
        ...prev,
        needed: localServices.length > 0,
        count: localServices.length
      }));
    } catch (error) {
      console.error('Error checking migration status:', error);
    }
  };

  const handleMigration = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to migrate your API keys.",
        variant: "destructive"
      });
      return;
    }

    setMigrationStatus(prev => ({ ...prev, inProgress: true }));

    try {
      const result = await migrateLocalStorageToFirestore();
      
      setMigrationStatus({
        needed: false,
        inProgress: false,
        completed: true,
        count: result.migrated
      });

      if (result.migrated > 0) {
        toast({
          title: "Migration Successful",
          description: `Successfully migrated ${result.migrated} API key(s) to your account. They will now be available across all your devices.`,
        });
      } else {
        toast({
          title: "No Keys to Migrate",
          description: "No API keys found in local storage to migrate.",
        });
      }

      if (result.errors.length > 0) {
        console.error('Migration errors:', result.errors);
        toast({
          title: "Migration Completed with Warnings",
          description: `Some keys couldn't be migrated. Check console for details.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Migration failed:', error);
      setMigrationStatus(prev => ({ ...prev, inProgress: false }));
      
      toast({
        title: "Migration Failed",
        description: `Failed to migrate API keys: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  if (!user || (!migrationStatus.needed && !migrationStatus.completed)) {
    return null;
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        {migrationStatus.completed ? (
          <Check className="text-green-600 dark:text-green-400 mt-0.5" size={20} />
        ) : (
          <AlertCircle className="text-blue-600 dark:text-blue-400 mt-0.5" size={20} />
        )}
        
        <div className="flex-1">
          {migrationStatus.completed ? (
            <div>
              <h4 className="font-medium text-green-800 dark:text-green-200">
                API Keys Migrated Successfully
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {migrationStatus.count > 0 
                  ? `${migrationStatus.count} API key(s) have been migrated to your account and will now be available across all your devices.`
                  : 'Your API keys are now properly synced with your account.'
                }
              </p>
            </div>
          ) : (
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-200">
                API Keys Migration Available
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                We found {migrationStatus.count} API key(s) stored locally on this device. 
                Migrate them to your account to access them from any device.
              </p>
              
              <button
                onClick={handleMigration}
                disabled={migrationStatus.inProgress}
                className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Upload size={16} />
                {migrationStatus.inProgress ? 'Migrating...' : 'Migrate API Keys'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiKeyMigration;
