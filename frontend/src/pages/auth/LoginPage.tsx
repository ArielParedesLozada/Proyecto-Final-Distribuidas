import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm';
import BackgroundEffects from '../../components/auth/BackgroundEffects';
import ScrollableContainer from '../../shared/ScrollableContainer';
import { useAuth } from '../../hooks/useAuth';

// Mapa de redirección por rol
const homeByRole = {
  ADMIN: '/admin/dashboard',
  SUPERVISOR: '/supervisor/dashboard',
  CONDUCTOR: '/drivers/dashboard'
} as const;

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (formData: { email: string; password: string }) => {
    setIsLoading(true);
    setError('');
    
    try {
      const authUser = await login(formData.email, formData.password);
      
      // Obtener el rol primario del usuario autenticado
      const userRole = authUser.roles[0]; // Primer rol del array
      
      // Redirigir según el rol primario del usuario
      if (userRole && userRole in homeByRole) {
        const redirectPath = homeByRole[userRole];
        navigate(redirectPath, { replace: true });
      } else {
        // Si no tiene rol válido, redirigir a dashboard genérico
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollableContainer>
      <div className="login-page-container">
        {/* Efectos de fondo */}
        <BackgroundEffects />
        
        {/* Contenido principal */}
        <div className="login-content">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
        </div>
      </div>
    </ScrollableContainer>
  );
};

export default LoginPage;
