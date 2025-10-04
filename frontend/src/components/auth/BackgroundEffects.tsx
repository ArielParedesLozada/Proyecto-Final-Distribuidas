import React from 'react';

const BackgroundEffects: React.FC = () => {
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      overflow: 'hidden', 
      pointerEvents: 'none' 
    }}>
      {/* Fondo principal con gradiente */}
      <div className="fuel-gradient" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      
      {/* Orbes flotantes */}
      <div style={{
        position: 'absolute',
        top: '25%',
        left: '25%',
        width: '24rem',
        height: '24rem',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderRadius: '50%',
        filter: 'blur(48px)',
        animation: 'float 6s ease-in-out infinite',
        opacity: 0.2
      }} />
      <div style={{
        position: 'absolute',
        top: '75%',
        right: '25%',
        width: '20rem',
        height: '20rem',
        backgroundColor: 'rgba(6, 182, 212, 0.2)',
        borderRadius: '50%',
        filter: 'blur(48px)',
        animation: 'float 6s ease-in-out infinite',
        animationDelay: '2s',
        opacity: 0.2
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '16rem',
        height: '16rem',
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderRadius: '50%',
        filter: 'blur(48px)',
        animation: 'float 6s ease-in-out infinite',
        animationDelay: '4s',
        opacity: 0.2
      }} />
      
      {/* Efectos radiales adicionales */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.1) 0%, transparent 50%, transparent 100%)'
      }} />
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(ellipse at top right, rgba(6, 182, 212, 0.1) 0%, transparent 50%, transparent 100%)'
      }} />
      
      {/* Partículas sutiles */}
      <div style={{
        position: 'absolute',
        top: '33%',
        left: '33%',
        width: '0.5rem',
        height: '0.5rem',
        backgroundColor: 'rgba(96, 165, 250, 0.3)',
        borderRadius: '50%',
        animation: 'pulse 2s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        top: '67%',
        right: '33%',
        width: '0.25rem',
        height: '0.25rem',
        backgroundColor: 'rgba(6, 182, 212, 0.4)',
        borderRadius: '50%',
        animation: 'pulse 2s ease-in-out infinite',
        animationDelay: '1s'
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '16%',
        width: '0.375rem',
        height: '0.375rem',
        backgroundColor: 'rgba(147, 197, 253, 0.3)',
        borderRadius: '50%',
        animation: 'pulse 2s ease-in-out infinite',
        animationDelay: '3s'
      }} />
    </div>
  );
};

export default BackgroundEffects;
