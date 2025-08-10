import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OptimizedModernLoader from './OptimizedModernLoader';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <OptimizedModernLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location, toast: 'Please sign in to access this page' }} replace />;
  }

  return children;
};

export default ProtectedRoute;
