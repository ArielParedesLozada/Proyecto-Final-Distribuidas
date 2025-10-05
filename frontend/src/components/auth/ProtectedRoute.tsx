import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// Tipos de roles válidos (mismo que en useAuth)
type UserRole = "ADMIN" | "SUPERVISOR" | "CONDUCTOR";

interface ProtectedRouteProps {
  roles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roles }) => {
  const { isAuthenticated, hasRole, isLoading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // Si se especificaron roles y el usuario no tiene ninguno de ellos
  if (roles && roles.length > 0 && !hasRole(...roles)) {
    return <Navigate to="/not-authorized" replace />;
  }

  // Si pasa todas las validaciones, renderizar el contenido
  return <Outlet />;
};

export default ProtectedRoute;