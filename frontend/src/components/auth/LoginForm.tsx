import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Fuel } from 'lucide-react';

interface LoginFormProps {
  onSubmit: (formData: { email: string; password: string }) => void;
  isLoading?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="login-container">
      {/* Logo y Título */}
      <div className="login-header">
        <div className="login-logo-container">
          <Fuel 
            style={{ width: '1.75rem', height: '1.75rem', color: 'white' }}
          />
        </div>
        <h1 className="login-title">
          Fuel Manager
        </h1>
        <p className="login-subtitle">
          Sistema de Gestión de Combustible
        </p>
      </div>

      {/* Tarjeta de Login */}
      <div className="fuel-card login-card">
        <div className="login-card-header">
          <h2 className="login-card-title">
            Iniciar Sesión
          </h2>
          <p className="login-card-subtitle">
            Ingresa tus credenciales para acceder
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {/* Campo Email */}
          <div className="login-field">
            <label htmlFor="email" className="login-label">
              Correo Electrónico
            </label>
            <div className="login-input-container">
              <Mail className="login-input-icon" />
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="usuario@ejemplo.com"
                className="fuel-input login-input"
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div className="login-field">
            <label htmlFor="password" className="login-label">
              Contraseña
            </label>
            <div className="login-input-container">
              <Lock className="login-input-icon" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="fuel-input login-input"
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="login-password-toggle"
              >
                {showPassword ? (
                  <EyeOff style={{ height: '1.5rem', width: '1.5rem', color: '#94a3b8' }} />
                ) : (
                  <Eye style={{ height: '1.5rem', width: '1.5rem', color: '#94a3b8' }} />
                )}
              </button>
            </div>
          </div>

          {/* Link Olvidé mi contraseña */}
          <div className="login-forgot-link">
            <button
              type="button"
              className="login-forgot-button"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Botón de Login */}
          <button
            type="submit"
            disabled={isLoading}
            className="fuel-button login-submit-button"
          >
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ 
                  animation: 'spin 1s linear infinite', 
                  borderRadius: '50%', 
                  height: '1.25rem', 
                  width: '1.25rem', 
                  borderBottom: '2px solid white', 
                  marginRight: '0.5rem' 
                }}></div>
                Iniciando sesión...
              </div>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
