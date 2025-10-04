import React from 'react';
import { useAuth } from '../hooks/useAuth';

// Página principal del dashboard - Solo accesible después del login
// Muestra métricas y información del sistema
const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #020617 0%, rgba(30, 58, 138, 0.2) 50%, #020617 100%)' 
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '2rem 1rem' 
      }}>
        <div className="fuel-card" style={{ padding: '2rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '2rem' 
          }}>
            <div>
              <h1 style={{ 
                fontSize: '1.875rem', 
                fontWeight: 'bold', 
                color: 'white', 
                marginBottom: '0.5rem' 
              }}>
                Dashboard
              </h1>
              <p style={{ color: '#94a3b8' }}>
                Bienvenido, {user?.email}
              </p>
            </div>
            <button
              onClick={logout}
              className="fuel-button-secondary"
            >
              Cerrar Sesión
            </button>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1.5rem' 
          }}>
            <div className="fuel-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ 
                color: '#94a3b8', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                marginBottom: '0.5rem' 
              }}>
                Total Vehículos
              </h3>
              <p style={{ 
                fontSize: '1.875rem', 
                fontWeight: 'bold', 
                color: 'white' 
              }}>
                24
              </p>
            </div>
            
            <div className="fuel-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ 
                color: '#94a3b8', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                marginBottom: '0.5rem' 
              }}>
                Combustible Consumido
              </h3>
              <p style={{ 
                fontSize: '1.875rem', 
                fontWeight: 'bold', 
                color: 'white' 
              }}>
                1,250 L
              </p>
            </div>
            
            <div className="fuel-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ 
                color: '#94a3b8', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                marginBottom: '0.5rem' 
              }}>
                Costo Total
              </h3>
              <p style={{ 
                fontSize: '1.875rem', 
                fontWeight: 'bold', 
                color: 'white' 
              }}>
                $5,200
              </p>
            </div>
            
            <div className="fuel-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ 
                color: '#94a3b8', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                marginBottom: '0.5rem' 
              }}>
                Eficiencia Promedio
              </h3>
              <p style={{ 
                fontSize: '1.875rem', 
                fontWeight: 'bold', 
                color: 'white' 
              }}>
                8.5 km/L
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
