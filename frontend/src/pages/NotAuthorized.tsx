import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';

const NotAuthorized: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Contenedor principal */}
        <div className="fuel-card p-8 text-center">
          {/* Icono principal */}
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <ShieldX className="w-10 h-10 text-red-500" />
            </div>
          </div>

          {/* Título y mensaje */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-3">
              Acceso Denegado
            </h1>
            <p className="text-slate-400 leading-relaxed">
              No tienes permisos para acceder a esta página. 
              Contacta con tu administrador si crees que esto es un error.
            </p>
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            <button
              onClick={handleGoBack}
              className="w-full fuel-button-secondary flex items-center justify-center gap-2 py-3"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver
            </button>
            
            <button
              onClick={handleGoHome}
              className="w-full fuel-button flex items-center justify-center gap-2 py-3"
            >
              <Home className="w-5 h-5" />
              Ir al Inicio
            </button>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 text-center">
          <p className="text-slate-500 text-sm">
            Código de error: 403 - Forbidden
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotAuthorized;
