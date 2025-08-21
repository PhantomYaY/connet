import { useState, useCallback } from 'react';

export const useOptimisticUpdate = (initialState, updateFn) => {
  const [state, setState] = useState(initialState);
  const [pendingUpdates, setPendingUpdates] = useState(new Set());

  const optimisticUpdate = useCallback(async (id, optimisticValue, actualUpdateFn) => {
    // Add to pending updates
    setPendingUpdates(prev => new Set(prev).add(id));

    // Apply optimistic update
    setState(prev => updateFn(prev, id, optimisticValue));

    try {
      // Perform actual update
      const result = await actualUpdateFn();
      
      // Update with real result if different from optimistic
      if (result !== optimisticValue) {
        setState(prev => updateFn(prev, id, result));
      }
    } catch (error) {
      // Revert optimistic update on error
      setState(prev => updateFn(prev, id, !optimisticValue));
      throw error;
    } finally {
      // Remove from pending updates
      setPendingUpdates(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, [updateFn]);

  return { state, setState, optimisticUpdate, pendingUpdates };
};

export default useOptimisticUpdate;
