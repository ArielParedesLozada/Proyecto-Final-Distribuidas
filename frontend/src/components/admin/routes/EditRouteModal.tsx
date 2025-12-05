import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Navigation, Route, AlertCircle } from 'lucide-react';
import MapSelector from './MapSelector';
import type { RouteProto } from '../../../types/trip';
import { reverseGeocode } from '../../../api/api';

export interface EditRouteFormData {
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

interface EditRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EditRouteFormData) => Promise<void>;
  route: RouteProto | null;
  isLoading?: boolean;
}

const EditRouteModal: React.FC<EditRouteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  route,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<EditRouteFormData>({
    originName: '',
    destinationName: '',
    coordinateStart: { latitude: 0, longitude: 0 },
    coordinateStop: { latitude: 0, longitude: 0 },
    distanceKm: 0,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof EditRouteFormData, string>>>({});
  const [selectionMode, setSelectionMode] = useState<'origin' | 'destination' | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Cargar datos de la ruta cuando se abre el modal
  useEffect(() => {
    if (isOpen && route) {
      const originName = route.originName || route.origin_name || '';
      const destinationName = route.destinationName || route.destination_name || '';
      const coordinateStart = route.coordinateStart || route.coordinate_start || { latitude: 0, longitude: 0 };
      const coordinateStop = route.coordinateStop || route.coordinate_stop || { latitude: 0, longitude: 0 };
      const distanceKm = route.distanceKm || route.distance_km || 0;

      setFormData({
        originName,
        destinationName,
        coordinateStart: {
          latitude: coordinateStart.latitude || 0,
          longitude: coordinateStart.longitude || 0,
        },
        coordinateStop: {
          latitude: coordinateStop.latitude || 0,
          longitude: coordinateStop.longitude || 0,
        },
        distanceKm,
      });
      setErrors({});
    }
  }, [isOpen, route]);


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
    console.log('🟢 handleOriginSelect llamado con:', { lat, lng });
    setSelectionMode(null);
    setIsGeocoding(true);
    isUpdatingFromMapRef.current = true; // Marcar que la actualización viene del mapa
    
    // Obtener nombre del lugar automáticamente
    let placeName = `Ubicación (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
    try {
      placeName = await reverseGeocode(lat, lng);
      console.log('✅ Nombre de origen obtenido:', placeName);
    } catch (error) {
      // Si falla, usar coordenadas como nombre
      placeName = `Ubicación (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
      console.log('⚠️ Error en geocodificación de origen, usando coordenadas:', placeName);
    } finally {
      setIsGeocoding(false);
    }
    
    // Actualizar todo en una sola operación para evitar condiciones de carrera
    setFormData((prev) => {
      console.log('📝 Estado anterior (origen):', prev);
      const newCoordinateStart = { latitude: lat, longitude: lng };
      let newDistanceKm = prev.distanceKm;
      
      // Calcular distancia si ya hay destino
      if (prev.coordinateStop.latitude !== 0 && prev.coordinateStop.longitude !== 0) {
        const distance = calculateDistance(lat, lng, prev.coordinateStop.latitude, prev.coordinateStop.longitude);
        // Redondear hacia arriba a 2 decimales
        newDistanceKm = Math.ceil(distance * 100) / 100;
      }
      
      const newState = {
        ...prev,
        coordinateStart: newCoordinateStart,
        originName: placeName,
        distanceKm: newDistanceKm,
      };
      console.log('📝 Nuevo estado (origen):', newState);
      return newState;
    });
  };

  // Manejar selección de destino desde el mapa
  const handleDestinationSelect = async (lat: number, lng: number) => {
    console.log('🟢 handleDestinationSelect llamado con:', { lat, lng });
    setSelectionMode(null);
    setIsGeocoding(true);
    isUpdatingFromMapRef.current = true; // Marcar que la actualización viene del mapa
    
    // Obtener nombre del lugar automáticamente
    let placeName = `Ubicación (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
    try {
      placeName = await reverseGeocode(lat, lng);
      console.log('✅ Nombre obtenido:', placeName);
    } catch (error) {
      // Si falla, usar coordenadas como nombre
      placeName = `Ubicación (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
      console.log('⚠️ Error en geocodificación, usando coordenadas:', placeName);
    } finally {
      setIsGeocoding(false);
    }
    
    // Actualizar todo en una sola operación para evitar condiciones de carrera
    setFormData((prev) => {
      console.log('📝 Estado anterior:', prev);
      const newCoordinateStop = { latitude: lat, longitude: lng };
      let newDistanceKm = prev.distanceKm;
      
      // Calcular distancia si ya hay origen
      if (prev.coordinateStart.latitude !== 0 && prev.coordinateStart.longitude !== 0) {
        const distance = calculateDistance(prev.coordinateStart.latitude, prev.coordinateStart.longitude, lat, lng);
        // Redondear hacia arriba a 2 decimales
        newDistanceKm = Math.ceil(distance * 100) / 100;
      }
      
      const newState = {
        ...prev,
        coordinateStop: newCoordinateStop,
        destinationName: placeName,
        distanceKm: newDistanceKm,
      };
      console.log('📝 Nuevo estado:', newState);
      return newState;
    });
  };

  // Sincronizar distancia cuando se editan coordenadas manualmente (solo si no se está geocodificando)
  // Esto evita que interfiera con las actualizaciones de handleOriginSelect/handleDestinationSelect
  // NOTA: Este efecto solo actualiza la distancia, no las coordenadas ni los nombres
  // IMPORTANTE: Usamos un ref para rastrear si la actualización viene del mapa o es manual
  const isUpdatingFromMapRef = React.useRef(false);
  
  useEffect(() => {
    // Si la actualización viene del mapa, no hacer nada (ya se calculó la distancia)
    if (isUpdatingFromMapRef.current) {
      isUpdatingFromMapRef.current = false;
      return;
    }
    
    // Solo ejecutar si no se está geocodificando y hay coordenadas válidas
    if (!isGeocoding && 
        formData.coordinateStart.latitude !== 0 && formData.coordinateStart.longitude !== 0 &&
        formData.coordinateStop.latitude !== 0 && formData.coordinateStop.longitude !== 0) {
      const calculatedDistance = calculateDistance(
        formData.coordinateStart.latitude,
        formData.coordinateStart.longitude,
        formData.coordinateStop.latitude,
        formData.coordinateStop.longitude
      );
      // Redondear hacia arriba a 2 decimales
      const roundedDistance = Math.ceil(calculatedDistance * 100) / 100;
      // Solo actualizar si la distancia es 0 o si la diferencia es significativa
      if (formData.distanceKm === 0 || Math.abs(roundedDistance - formData.distanceKm) > 0.01) {
        console.log('🔄 useEffect actualizando distancia:', roundedDistance);
        setFormData((prev) => ({
          ...prev,
          distanceKm: roundedDistance,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.coordinateStart.latitude, formData.coordinateStart.longitude, formData.coordinateStop.latitude, formData.coordinateStop.longitude]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof EditRouteFormData, string>> = {};

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

  // Verificar si la ruta está activa (no se puede editar)
  // Solo se bloquea si está en estado STARTED (activa/iniciada)
  const isRouteActive = route && (
    route.status === 'ROUTE_STATE_STARTED' || 
    route.status === 2 ||
    (typeof route.status === 'string' && route.status.includes('STARTED'))
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/30 backdrop-blur-sm z-40" style={{ left: '250px' }}></div>
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ left: '250px' }}>
        <div className="w-full max-w-4xl max-h-[90vh] flex flex-col p-6 relative rounded-2xl shadow-xl bg-[#0b1a2f] border border-slate-800 text-white overflow-y-auto">
          {/* Cerrar */}
          <button
            className="absolute right-4 top-4 text-slate-400 hover:text-white z-10"
            onClick={onClose}
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
              <Route className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Editar Ruta</h2>
          </div>

          {isRouteActive && (
            <div className="mb-4 p-4 bg-yellow-600/20 border border-yellow-600/30 rounded-lg">
              <p className="text-yellow-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                No se puede editar una ruta que está en curso (activa). Solo se pueden editar rutas sin asignar, asignadas o completadas.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mapa Interactivo */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Seleccionar Origen y Destino en el Mapa
              </label>
              <div className="w-full max-w-lg mx-auto relative">
                {isRouteActive && (
                  <div className="absolute inset-0 bg-slate-900/50 z-10 rounded-lg flex items-center justify-center" style={{ height: '180px', top: '60px' }}>
                    <p className="text-slate-400 text-sm">El mapa está deshabilitado para rutas en curso</p>
                  </div>
                )}
                <div className={isRouteActive ? 'pointer-events-none opacity-50' : ''}>
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
                    mapHeight={320}
                  />
                </div>
              </div>
              {isGeocoding && (
                <p className="mt-2 text-sm text-blue-400">Obteniendo nombre del lugar...</p>
              )}
            </div>

            {/* Campos de formulario - Debajo del mapa */}
            <div className="space-y-4">
              {/* Origen */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-white border-b border-slate-700 pb-2">Origen</h3>
                
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

              {/* Destino */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-white border-b border-slate-700 pb-2">Destino</h3>
                
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
            <div className="mt-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
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
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-3 mt-3 border-t border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={isLoading || isRouteActive}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditRouteModal;
