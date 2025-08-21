import { useState, useCallback } from 'react';
import { useToast } from '../components/ui/use-toast';

export const useErrorHandler = () => {
  const [retryAttempts, setRetryAttempts] = useState({});
  const { toast } = useToast();

  const handleError = useCallback(async (error, operation, maxRetries = 3) => {
    const operationKey = operation.name || 'unknown';
    const attempts = retryAttempts[operationKey] || 0;

    console.error(`Error in ${operationKey}:`, error);

    // Show user-friendly error messages
    let errorMessage = 'Something went wrong. Please try again.';
    let shouldRetry = attempts < maxRetries;

    if (error.message?.includes('Network')) {
      errorMessage = 'Network error. Please check your connection.';
      shouldRetry = true;
    } else if (error.message?.includes('quota') || error.message?.includes('exceeded')) {
      errorMessage = 'Service temporarily unavailable. Please try again later.';
      shouldRetry = false;
    } else if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
      errorMessage = 'You don\'t have permission to perform this action.';
      shouldRetry = false;
    } else if (error.message?.includes('not found')) {
      errorMessage = 'The requested content was not found.';
      shouldRetry = false;
    }

    if (shouldRetry && attempts < maxRetries) {
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempts), 10000);
      
      setRetryAttempts(prev => ({
        ...prev,
        [operationKey]: attempts + 1
      }));

      if (toast) {
        toast({
          title: "Retrying...",
          description: `Attempt ${attempts + 2} of ${maxRetries + 1}`,
          variant: "default"
        });
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        const result = await operation();
        // Reset retry count on success
        setRetryAttempts(prev => {
          const newAttempts = { ...prev };
          delete newAttempts[operationKey];
          return newAttempts;
        });
        return result;
      } catch (retryError) {
        return handleError(retryError, operation, maxRetries);
      }
    } else {
      // Max retries reached or shouldn't retry
      setRetryAttempts(prev => {
        const newAttempts = { ...prev };
        delete newAttempts[operationKey];
        return newAttempts;
      });

      if (toast) {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
          action: shouldRetry ? undefined : {
            label: "Refresh",
            onClick: () => window.location.reload()
          }
        });
      }

      throw error;
    }
  }, [retryAttempts, toast]);

  const withErrorHandling = useCallback((operation, maxRetries = 3) => {
    return async (...args) => {
      try {
        return await operation(...args);
      } catch (error) {
        return handleError(error, operation, maxRetries);
      }
    };
  }, [handleError]);

  return { handleError, withErrorHandling };
};

export default useErrorHandler;
