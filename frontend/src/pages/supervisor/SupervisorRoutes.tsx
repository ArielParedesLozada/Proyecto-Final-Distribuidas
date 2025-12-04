import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Route, Plus, ArrowLeft } from 'lucide-react';
import { CreateRouteForm, type CreateRouteFormData } from '../../components/admin/routes';
import { api } from '../../api/api';
import { useToast } from '../../shared/ToastNotification';
import type { RouteProto } from '../../types/trip';

const SupervisorRoutes: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateRouteFormData) => {
    setIsLoading(true);
    try {
      console.log('🔄 Creando ruta...', data);
      
      const response = await api<RouteProto>('/routes/', {
        method: 'POST',
        body: JSON.stringify({
          origin_name: data.originName,
          destination_name: data.destinationName,
          coordinate_start: {
            latitude: data.coordinateStart.latitude,
            longitude: data.coordinateStart.longitude,
          },
          coordinate_stop: {
            latitude: data.coordinateStop.latitude,
            longitude: data.coordinateStop.longitude,
          },
          distance_km: data.distanceKm,
        }),
      });

      console.log('✅ Ruta creada:', response);
      addToast('Ruta creada exitosamente', 'success');
      
      // Redirigir a la lista de rutas o dashboard
      navigate('/supervisor/dashboard');
    } catch (error: any) {
      console.error('❌ Error al crear ruta:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la ruta';
      addToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/supervisor/dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </button>
        
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-amber-600/20 border border-amber-600/30">
            <Route className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Crear Nueva Ruta</h1>
            <p className="text-slate-400">Define el origen, destino y coordenadas de la ruta</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur-sm">
        <CreateRouteForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>

      {/* Info Card */}
      <div className="mt-6 bg-amber-600/10 border border-amber-600/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Plus className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-slate-300">
            <p className="font-medium text-amber-400 mb-1">Información importante:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Las coordenadas deben estar en formato decimal (ej: -12.0464, -77.0428)</li>
              <li>La distancia debe ser en kilómetros</li>
              <li>La ruta se creará con estado "Sin Asignar" y podrá ser asignada posteriormente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorRoutes;



