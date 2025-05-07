import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

/**
 * A wrapper component for protected routes
 * Redirects to login page if user is not authenticated
 */
const ProtectedRoute = () => {
  const { isAuthenticated, initializing } = useApp();
  
  // Show nothing while checking authentication
  if (initializing) {
    return null; // Or a loading spinner/screen
  }
  
  // If authenticated, render the child routes
  // Otherwise, redirect to login
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;