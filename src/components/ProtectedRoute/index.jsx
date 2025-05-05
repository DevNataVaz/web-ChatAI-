import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useApp();
  
  // Se não houver usuário logado, redireciona para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Se houver usuário, renderiza os filhos
  return children;
};

export default ProtectedRoute;