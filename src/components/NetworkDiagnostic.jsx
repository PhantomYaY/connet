import React, { useState, useEffect } from 'react';
import { auth, firestore } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

const NetworkDiagnostic = ({ onDiagnosticComplete }) => {
  const [diagnostics, setDiagnostics] = useState({
    firebaseAuth: 'checking',
    firestoreConnection: 'checking',
    internetConnection: 'checking',
    corsIssues: 'checking'
  });

  const [errors, setErrors] = useState([]);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const updateDiagnostic = (key, status, error = null) => {
    setDiagnostics(prev => ({ ...prev, [key]: status }));
    if (error) {
      setErrors(prev => [...prev, { key, error: error.message || error }]);
    }
  };

  const runDiagnostics = async () => {
    // Test 1: Internet connectivity
    try {
      const response = await fetch('https://httpbin.org/status/200', { 
        method: 'GET',
        mode: 'cors' 
      });
      if (response.ok) {
        updateDiagnostic('internetConnection', 'success');
      } else {
        updateDiagnostic('internetConnection', 'failed', new Error('HTTP status not OK'));
      }
    } catch (error) {
      updateDiagnostic('internetConnection', 'failed', error);
    }

    // Test 2: Firebase Auth
    try {
      if (auth.currentUser) {
        updateDiagnostic('firebaseAuth', 'success');
      } else {
        updateDiagnostic('firebaseAuth', 'no-user');
      }
    } catch (error) {
      updateDiagnostic('firebaseAuth', 'failed', error);
    }

    // Test 3: Firestore connection
    try {
      if (auth.currentUser) {
        // Try to read from a collection that should exist
        const testQuery = collection(firestore, 'users', auth.currentUser.uid, 'notes');
        await getDocs(testQuery);
        updateDiagnostic('firestoreConnection', 'success');
      } else {
        updateDiagnostic('firestoreConnection', 'no-auth');
      }
    } catch (error) {
      updateDiagnostic('firestoreConnection', 'failed', error);
    }

    // Test 4: CORS issues
    try {
      const response = await fetch('https://firestore.googleapis.com/', { 
        method: 'GET',
        mode: 'cors' 
      });
      updateDiagnostic('corsIssues', 'success');
    } catch (error) {
      if (error.message.includes('CORS') || error.message.includes('fetch')) {
        updateDiagnostic('corsIssues', 'failed', error);
      } else {
        updateDiagnostic('corsIssues', 'success');
      }
    }

    // Complete diagnostic
    setTimeout(() => {
      if (onDiagnosticComplete) {
        onDiagnosticComplete({ diagnostics, errors });
      }
    }, 1000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'checking': return 'text-yellow-600';
      case 'no-user': 
      case 'no-auth': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'success': return '✓ Success';
      case 'failed': return '✗ Failed';
      case 'checking': return '⋯ Checking';
      case 'no-user': return '⚠ No user';
      case 'no-auth': return '⚠ No auth';
      default: return '? Unknown';
    }
  };

  return (
    <div className="fixed bottom-4 left-4 bg-white dark:bg-slate-800 border rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <h3 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">Network Diagnostics</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Internet:</span>
          <span className={getStatusColor(diagnostics.internetConnection)}>
            {getStatusText(diagnostics.internetConnection)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Firebase Auth:</span>
          <span className={getStatusColor(diagnostics.firebaseAuth)}>
            {getStatusText(diagnostics.firebaseAuth)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Firestore:</span>
          <span className={getStatusColor(diagnostics.firestoreConnection)}>
            {getStatusText(diagnostics.firestoreConnection)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>CORS:</span>
          <span className={getStatusColor(diagnostics.corsIssues)}>
            {getStatusText(diagnostics.corsIssues)}
          </span>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <h4 className="font-medium text-red-600 text-xs mb-1">Errors:</h4>
          {errors.map((error, index) => (
            <div key={index} className="text-xs text-red-600 mb-1">
              <strong>{error.key}:</strong> {error.error}
            </div>
          ))}
        </div>
      )}
      
      <button 
        onClick={runDiagnostics}
        className="mt-3 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
      >
        Re-run
      </button>
    </div>
  );
};

export default NetworkDiagnostic;
