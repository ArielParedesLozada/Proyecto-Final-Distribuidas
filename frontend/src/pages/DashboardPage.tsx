import React from 'react';
import { useAuth } from '../hooks/useAuth';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div 
      className="dashboard-container fuel-gradient"
      style={{
        minHeight: '100vh',
        padding: '2rem',
        boxSizing: 'border-box'
      }}
    >
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div 
          className="fuel-card dashboard-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            padding: '1.5rem'
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
              Dashboard
            </h1>
            <p style={{ color: '#94a3b8' }}>
              Bienvenido, {user?.name || user?.email}
            </p>
          </div>
          <button
            onClick={logout}
            className="fuel-button-secondary"
            style={{ padding: '0.75rem 1.5rem' }}
          >
            Cerrar Sesión
          </button>
        </div>

        {/* Métricas */}
        <div 
          className="dashboard-metrics"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}
        >
          {[
            { title: 'Total de Vehículos', value: '24', change: '+12%', color: '#10b981' },
            { title: 'Combustible Consumido', value: '1,250 L', change: '+8%', color: '#f59e0b' },
            { title: 'Viajes Completados', value: '156', change: '+23%', color: '#3b82f6' },
            { title: 'Eficiencia Promedio', value: '8.5 km/L', change: '+5%', color: '#8b5cf6' }
          ].map((metric, index) => (
            <div
              key={index}
              className="fuel-card"
              style={{
                padding: '1.5rem',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = 'rgba(30, 41, 59, 0.5)';
              }}
            >
              <h3 style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                {metric.title}
              </h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
                {metric.value}
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: metric.color,
                fontWeight: '500'
              }}>
                {metric.change}
              </div>
            </div>
          ))}
        </div>

        {/* Contenido principal */}
        <div className="fuel-card dashboard-main-content" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>
            Sistema de Gestión de Combustible
          </h2>
          <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
            Bienvenido al sistema de gestión de combustible para flotas. Aquí podrás monitorear el consumo,
            gestionar vehículos, y analizar la eficiencia de tu flota.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
