import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Componente para proteger rutas que requieren autenticación
// Redirige a /login si el usuario no está logueado
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #020617 0%, rgba(30, 58, 138, 0.2) 50%, #020617 100%)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div className="fuel-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ 
              animation: 'spin 1s linear infinite', 
              borderRadius: '50%', 
              height: '2rem', 
              width: '2rem', 
              borderBottom: '2px solid #3b82f6', 
              marginRight: '0.75rem' 
            }}></div>
            <span style={{ color: 'white' }}>Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
