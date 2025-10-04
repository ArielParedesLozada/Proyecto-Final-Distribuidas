import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm';
import BackgroundEffects from '../../components/auth/BackgroundEffects';
import ScrollableContainer from '../../shared/ScrollableContainer';
import { useAuth } from '../../hooks/useAuth';

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (formData: { email: string; password: string }) => {
    setIsLoading(true);
    setError('');
    
    try {
      await login(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
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
          
          {/* Mensaje de error */}
          {error && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '0.75rem',
              color: '#f87171',
              fontSize: '0.875rem',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </ScrollableContainer>
  );
};

export default LoginPage;
