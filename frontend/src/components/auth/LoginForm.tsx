import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

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
    <div style={{ width: '100%', maxWidth: '36rem', margin: '0 auto', padding: '0 1rem' }}>
      {/* Logo y Título */}
      <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '4rem',
          height: '4rem',
          background: 'linear-gradient(135deg, #60a5fa 0%, #06b6d4 100%)',
          borderRadius: '1rem',
          boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)',
          marginBottom: '1rem'
        }}>
          <svg 
            style={{ width: '2rem', height: '2rem', color: 'white' }}
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
          Fuel Manager
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.125rem' }}>
          Sistema de Gestión de Combustible
        </p>
      </div>

      {/* Tarjeta de Login */}
      <div className="fuel-card" style={{ padding: '3.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>
            Iniciar Sesión
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.125rem' }}>
            Ingresa tus credenciales para acceder
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
          {/* Campo Email */}
          <div>
            <label htmlFor="email" style={{ display: 'block', fontSize: '1.125rem', fontWeight: '500', color: 'white', marginBottom: '0.75rem', textAlign: 'left' }}>
              Correo Electrónico
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '0.75rem', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <Mail style={{ height: '1.25rem', width: '1.25rem', color: '#94a3b8' }} />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="usuario@ejemplo.com"
                className="fuel-input"
                style={{ paddingLeft: '2.5rem', width: '100%' }}
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div>
            <label htmlFor="password" style={{ display: 'block', fontSize: '1.125rem', fontWeight: '500', color: 'white', marginBottom: '0.75rem', textAlign: 'left' }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '0.75rem', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <Lock style={{ height: '1.25rem', width: '1.25rem', color: '#94a3b8' }} />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="fuel-input"
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', top: '50%', right: '0.75rem', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {showPassword ? (
                  <EyeOff style={{ height: '1.25rem', width: '1.25rem', color: '#94a3b8' }} />
                ) : (
                  <Eye style={{ height: '1.25rem', width: '1.25rem', color: '#94a3b8' }} />
                )}
              </button>
            </div>
          </div>

          {/* Link Olvidé mi contraseña */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              style={{ 
                color: '#60a5fa', 
                fontSize: '1rem', 
                fontWeight: '500', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                transition: 'color 0.3s ease'
              }}
              onMouseOver={(e) => (e.target as HTMLButtonElement).style.color = '#93c5fd'}
              onMouseOut={(e) => (e.target as HTMLButtonElement).style.color = '#60a5fa'}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Botón de Login */}
          <button
            type="submit"
            disabled={isLoading}
            className="fuel-button"
            style={{ 
              width: '100%', 
              opacity: isLoading ? 0.5 : 1, 
              cursor: isLoading ? 'not-allowed' : 'pointer' 
            }}
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
