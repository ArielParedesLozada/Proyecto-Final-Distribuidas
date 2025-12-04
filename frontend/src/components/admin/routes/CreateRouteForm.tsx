import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Route, X } from 'lucide-react';
import MapSelector from './MapSelector';

export interface CreateRouteFormData {
  originName: string;
  destinationName: string;
  coordinateStart: {
    latitude: number;
    longitude: number;
  };
  coordinateStop: {
    latitude: number;
    longitude: number;
  };
  distanceKm: number;
}

interface CreateRouteFormProps {
  onSubmit: (data: CreateRouteFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const CreateRouteForm: React.FC<CreateRouteFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateRouteFormData>({
    originName: '',
    destinationName: '',
    coordinateStart: {
      latitude: 0,
      longitude: 0,
    },
    coordinateStop: {
      latitude: 0,
      longitude: 0,
    },
    distanceKm: 0,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateRouteFormData, string>>>({});
  const [selectionMode, setSelectionMode] = useState<'origin' | 'destination' | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Función para geocodificación inversa (obtener nombre del lugar desde coordenadas)
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'RouteManagementApp/1.0',
          },
        }
      );
      const data = await response.json();
      
      if (data.display_name) {
        // Extraer una descripción más corta y útil
        const parts = data.display_name.split(',');
        if (parts.length > 0) {
          // Tomar los primeros 2-3 elementos para un nombre más corto
          return parts.slice(0, Math.min(3, parts.length)).join(', ').trim();
        }
        return data.display_name;
      }
      return `Ubicación (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
    } catch (error) {
      console.error('Error en geocodificación inversa:', error);
      return `Ubicación (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
    }
  };

  // Calcular distancia en línea recta (Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Manejar selección de origen desde el mapa
  const handleOriginSelect = async (lat: number, lng: number) => {
    // Actualizar coordenadas primero
    setFormData((prev) => ({
      ...prev,
      coordinateStart: { latitude: lat, longitude: lng },
    }));
    setSelectionMode(null);
    
    // Obtener nombre del lugar automáticamente (siempre, no solo si está vacío)
    setIsGeocoding(true);
    try {
      const name = await reverseGeocode(lat, lng);
      setFormData((prev) => ({
        ...prev,
        originName: name,
      }));
    } catch (error) {
      console.error('Error obteniendo nombre del lugar:', error);
    } finally {
      setIsGeocoding(false);
    }
    
    // Calcular distancia si ya hay destino
    setFormData((prev) => {
      if (prev.coordinateStop.latitude !== 0 && prev.coordinateStop.longitude !== 0) {
        const distance = calculateDistance(lat, lng, prev.coordinateStop.latitude, prev.coordinateStop.longitude);
        // Redondear hacia arriba a 2 decimales para asegurar que siempre sea >= distancia real
        const roundedDistance = Math.ceil(distance * 100) / 100;
        return {
          ...prev,
          distanceKm: roundedDistance,
        };
      }
      return prev;
    });
  };

  // Manejar selección de destino desde el mapa
  const handleDestinationSelect = async (lat: number, lng: number) => {
    // Actualizar coordenadas primero
    setFormData((prev) => ({
      ...prev,
      coordinateStop: { latitude: lat, longitude: lng },
    }));
    setSelectionMode(null);
    
    // Obtener nombre del lugar automáticamente (siempre, no solo si está vacío)
    setIsGeocoding(true);
    try {
      const name = await reverseGeocode(lat, lng);
      setFormData((prev) => ({
        ...prev,
        destinationName: name,
      }));
    } catch (error) {
      console.error('Error obteniendo nombre del lugar:', error);
    } finally {
      setIsGeocoding(false);
    }
    
    // Calcular distancia si ya hay origen
    setFormData((prev) => {
      if (prev.coordinateStart.latitude !== 0 && prev.coordinateStart.longitude !== 0) {
        const distance = calculateDistance(prev.coordinateStart.latitude, prev.coordinateStart.longitude, lat, lng);
        // Redondear hacia arriba a 2 decimales para asegurar que siempre sea >= distancia real
        const roundedDistance = Math.ceil(distance * 100) / 100;
        return {
          ...prev,
          distanceKm: roundedDistance,
        };
      }
      return prev;
    });
  };

  // Sincronizar distancia cuando se editan coordenadas manualmente (aunque estén bloqueadas)
  useEffect(() => {
    if (formData.coordinateStart.latitude !== 0 && formData.coordinateStart.longitude !== 0 &&
        formData.coordinateStop.latitude !== 0 && formData.coordinateStop.longitude !== 0) {
      const calculatedDistance = calculateDistance(
        formData.coordinateStart.latitude,
        formData.coordinateStart.longitude,
        formData.coordinateStop.latitude,
        formData.coordinateStop.longitude
      );
      // Redondear hacia arriba a 2 decimales para asegurar que siempre sea >= distancia real
      const roundedDistance = Math.ceil(calculatedDistance * 100) / 100;
      // Solo actualizar si la distancia es 0 o si la diferencia es significativa
      if (formData.distanceKm === 0 || Math.abs(roundedDistance - formData.distanceKm) > 0.01) {
        setFormData((prev) => ({
          ...prev,
          distanceKm: roundedDistance,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.coordinateStart.latitude, formData.coordinateStart.longitude, formData.coordinateStop.latitude, formData.coordinateStop.longitude]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CreateRouteFormData, string>> = {};

    if (!formData.originName.trim()) {
      newErrors.originName = 'El nombre de origen es requerido';
    }

    if (!formData.destinationName.trim()) {
      newErrors.destinationName = 'El nombre de destino es requerido';
    }

    if (formData.coordinateStart.latitude === 0 && formData.coordinateStart.longitude === 0) {
      newErrors.coordinateStart = 'Las coordenadas de inicio son requeridas';
    } else {
      if (formData.coordinateStart.latitude < -90 || formData.coordinateStart.latitude > 90) {
        newErrors.coordinateStart = 'La latitud debe estar entre -90 y 90';
      }
      if (formData.coordinateStart.longitude < -180 || formData.coordinateStart.longitude > 180) {
        newErrors.coordinateStart = 'La longitud debe estar entre -180 y 180';
      }
    }

    if (formData.coordinateStop.latitude === 0 && formData.coordinateStop.longitude === 0) {
      newErrors.coordinateStop = 'Las coordenadas de destino son requeridas';
    } else {
      if (formData.coordinateStop.latitude < -90 || formData.coordinateStop.latitude > 90) {
        newErrors.coordinateStop = 'La latitud debe estar entre -90 y 90';
      }
      if (formData.coordinateStop.longitude < -180 || formData.coordinateStop.longitude > 180) {
        newErrors.coordinateStop = 'La longitud debe estar entre -180 y 180';
      }
    }

    if (formData.distanceKm <= 0) {
      newErrors.distanceKm = 'La distancia debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      await onSubmit(formData);
    }
  };

  const handleChange = (field: keyof CreateRouteFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mapa Interactivo */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          <MapPin className="w-4 h-4 inline mr-2" />
          Seleccionar Origen y Destino en el Mapa
        </label>
        <MapSelector
          origin={
            formData.coordinateStart.latitude !== 0 && formData.coordinateStart.longitude !== 0
              ? { lat: formData.coordinateStart.latitude, lng: formData.coordinateStart.longitude }
              : null
          }
          destination={
            formData.coordinateStop.latitude !== 0 && formData.coordinateStop.longitude !== 0
              ? { lat: formData.coordinateStop.latitude, lng: formData.coordinateStop.longitude }
              : null
          }
          onOriginSelect={handleOriginSelect}
          onDestinationSelect={handleDestinationSelect}
          selectionMode={selectionMode}
          onSelectionModeChange={setSelectionMode}
        />
        {isGeocoding && (
          <p className="mt-2 text-sm text-blue-400">Obteniendo nombre del lugar...</p>
        )}
      </div>

      {/* Campos de formulario (editable manualmente) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna Izquierda: Origen */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Origen</h3>
          
          {/* Nombre de Origen */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Nombre de Origen (se llena automáticamente)
            </label>
            <input
              type="text"
              value={formData.originName}
              readOnly
              className="w-full px-4 py-2 bg-slate-800/30 border border-slate-600 rounded-lg text-white placeholder-slate-500 cursor-not-allowed opacity-75"
              placeholder="Se llena automáticamente al seleccionar en el mapa"
              disabled={isLoading}
            />
            {errors.originName && (
              <p className="mt-1 text-sm text-red-400">{errors.originName}</p>
            )}
          </div>

          {/* Coordenadas de Inicio */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Navigation className="w-4 h-4 inline mr-2" />
              Coordenadas de Inicio (se llenan automáticamente)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="number"
                  step="any"
                  value={formData.coordinateStart.latitude || ''}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-800/30 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm cursor-not-allowed opacity-75"
                  placeholder="Latitud"
                />
              </div>
              <div>
                <input
                  type="number"
                  step="any"
                  value={formData.coordinateStart.longitude || ''}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-800/30 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm cursor-not-allowed opacity-75"
                  placeholder="Longitud"
                />
              </div>
            </div>
            {errors.coordinateStart && (
              <p className="mt-1 text-sm text-red-400">{errors.coordinateStart}</p>
            )}
          </div>
        </div>

        {/* Columna Derecha: Destino */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Destino</h3>
          
          {/* Nombre de Destino */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Nombre de Destino (se llena automáticamente)
            </label>
            <input
              type="text"
              value={formData.destinationName}
              readOnly
              className="w-full px-4 py-2 bg-slate-800/30 border border-slate-600 rounded-lg text-white placeholder-slate-500 cursor-not-allowed opacity-75"
              placeholder="Se llena automáticamente al seleccionar en el mapa"
              disabled={isLoading}
            />
            {errors.destinationName && (
              <p className="mt-1 text-sm text-red-400">{errors.destinationName}</p>
            )}
          </div>

          {/* Coordenadas de Destino */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Navigation className="w-4 h-4 inline mr-2" />
              Coordenadas de Destino (se llenan automáticamente)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="number"
                  step="any"
                  value={formData.coordinateStop.latitude || ''}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-800/30 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm cursor-not-allowed opacity-75"
                  placeholder="Latitud"
                />
              </div>
              <div>
                <input
                  type="number"
                  step="any"
                  value={formData.coordinateStop.longitude || ''}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-800/30 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm cursor-not-allowed opacity-75"
                  placeholder="Longitud"
                />
              </div>
            </div>
            {errors.coordinateStop && (
              <p className="mt-1 text-sm text-red-400">{errors.coordinateStop}</p>
            )}
          </div>
        </div>
      </div>

      {/* Distancia */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          <Route className="w-4 h-4 inline mr-2" />
          Distancia (km) - Se calcula automáticamente
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.distanceKm ? formData.distanceKm.toFixed(2) : ''}
          readOnly
          className="w-full px-4 py-2 bg-slate-800/30 border border-slate-600 rounded-lg text-white placeholder-slate-500 cursor-not-allowed opacity-75"
          placeholder="Se calcula automáticamente"
          disabled={isLoading}
        />
        {errors.distanceKm && (
          <p className="mt-1 text-sm text-red-400">{errors.distanceKm}</p>
        )}
        {formData.coordinateStart.latitude !== 0 && formData.coordinateStop.latitude !== 0 && (
          <p className="mt-1 text-xs text-slate-400">
            💡 La distancia se calcula automáticamente en línea recta (con 2 decimales).
          </p>
        )}
      </div>

      {/* Botones */}
      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creando...
            </>
          ) : (
            <>
              <Route className="w-4 h-4" />
              Crear Ruta
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default CreateRouteForm;



