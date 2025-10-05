import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm';
import BackgroundEffects from '../../components/auth/BackgroundEffects';
import ScrollableContainer from '../../shared/ScrollableContainer';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../shared/ToastNotification';
import { translateErrorMessage } from '../../utils/errorTranslations';

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleLogin = async (formData: { email: string; password: string }) => {
    setIsLoading(true);
    
    try {
      await login(formData);
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
      const translatedMessage = translateErrorMessage(errorMessage);
      addToast(translatedMessage, 'error');
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
          <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
        </div>
      </div>
    </ScrollableContainer>
  );
};

export default LoginPage;
