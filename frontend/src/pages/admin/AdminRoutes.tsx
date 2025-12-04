import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Route, Plus, List, Loader2, UserCheck, AlertCircle, Car, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { CreateRouteForm, type CreateRouteFormData } from '../../components/admin/routes';
import { api } from '../../api/api';
import { useToast } from '../../shared/ToastNotification';
import { formatErrorMessage } from '../../utils/errorTranslations';
import type { RouteProto, ListRoutesResponse } from '../../types/trip';
import type { Driver, DriversListResponse, DriverResponse } from '../../types/driver';
import type { Vehicle, VehicleResponse } from '../../types/vehicle';
import Tabs from '../../shared/Tabs';
import Pagination from '../../shared/Pagination';

interface AssignmentRow {
  assignment_id: string;
  vehicle_id: string;
  driver_id: string;
  assigned_at?: string;
  unassigned_at?: string | null;
  vehicle?: {
    plate: string;
    brand: string;
    model: string;
  };
}

interface AssignmentsResponse {
  items: AssignmentRow[];
}

const AdminRoutes: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'assign'>('create');
  
  // Estado para la lista de rutas
  const [routes, setRoutes] = useState<RouteProto[]>([]);
  const [allRoutes, setAllRoutes] = useState<RouteProto[]>([]); // Todas las rutas sin filtrar
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 5;
  
  // Estado para almacenar información de conductores (driver_id -> Driver)
  const [driversMap, setDriversMap] = useState<Record<string, Driver>>({});
  
  // Estado para almacenar información de vehículos (vehicle_id -> Vehicle)
  const [vehiclesMap, setVehiclesMap] = useState<Record<string, Vehicle>>({});
  
  // Estado para controlar qué rutas tienen las observaciones expandidas
  const [expandedObservations, setExpandedObservations] = useState<Set<string>>(new Set());
  
  // Estado para el filtro por conductor
  const [selectedDriverFilter, setSelectedDriverFilter] = useState<string>('');
  const [allDriversForFilter, setAllDriversForFilter] = useState<Driver[]>([]);
  
  // Estado para el filtro de rutas sin asignar
  const [showUnassignedOnly, setShowUnassignedOnly] = useState<boolean>(false);

  // Estado para asignar rutas
  const [unassignedRoutes, setUnassignedRoutes] = useState<RouteProto[]>([]);
  const [isLoadingUnassignedRoutes, setIsLoadingUnassignedRoutes] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignErrors, setAssignErrors] = useState<Record<string, string>>({});

  // Cargar rutas cuando se cambia a la tab de lista
  useEffect(() => {
    if (activeTab === 'list') {
      loadRoutes();
      loadAllDriversForFilter();
    }
  }, [activeTab, currentPage]);
  
  // Cargar información del conductor cuando se selecciona en el filtro
  useEffect(() => {
    if (selectedDriverFilter && !driversMap[selectedDriverFilter]) {
      loadDriverById(selectedDriverFilter).then(driver => {
        if (driver) {
          setDriversMap(prev => ({ ...prev, [driver.id]: driver }));
        }
      });
    }
  }, [selectedDriverFilter]);

  // Resetear página cuando cambia cualquier filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDriverFilter, showUnassignedOnly]);

  // Filtrar rutas cuando cambia el filtro de conductor, rutas sin asignar o la página
  useEffect(() => {
    if (allRoutes.length === 0) return; // Esperar a que se carguen las rutas
    
    let filteredRoutes = allRoutes;
    
    // Aplicar filtro de rutas sin asignar si está activo
    if (showUnassignedOnly) {
      filteredRoutes = filteredRoutes.filter(route => 
        route.status === 'ROUTE_STATE_UNASSIGNED' || !route.driverId
      );
    }
    
    // Aplicar filtro por conductor si está seleccionado
    if (selectedDriverFilter) {
      filteredRoutes = filteredRoutes.filter(route => route.driverId === selectedDriverFilter);
    }
    
    // Aplicar paginación
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    setRoutes(filteredRoutes.slice(startIndex, endIndex));
    setTotalCount(filteredRoutes.length);
    setTotalPages(Math.ceil(filteredRoutes.length / pageSize) || 1);
  }, [selectedDriverFilter, showUnassignedOnly, allRoutes, currentPage, pageSize]);
  
  // Cargar todos los conductores para el filtro
  const loadAllDriversForFilter = async () => {
    try {
      const response = await api<DriversListResponse>('/drivers?page=1&page_size=1000');
      setAllDriversForFilter(response.drivers || []);
    } catch (error: any) {
      console.error('❌ Error al cargar conductores para filtro:', error);
    }
  };

  // Cargar datos cuando se cambia a la tab de asignar
  useEffect(() => {
    if (activeTab === 'assign') {
      loadUnassignedRoutes();
      loadDrivers();
    }
  }, [activeTab]);

  // Cargar assignments cuando se selecciona un driver
  useEffect(() => {
    if (selectedDriverId && activeTab === 'assign') {
      loadDriverAssignments(selectedDriverId);
    } else {
      setAssignments([]);
      setSelectedAssignmentId('');
    }
  }, [selectedDriverId, activeTab]);

  // Función para mapear datos de la API (snake_case) al formato esperado (camelCase)
  const mapRouteFromApi = (route: any): RouteProto => {
    // Mapear observaciones si vienen en la respuesta
    const observations = route.observations || [];
    
    return {
      id: route.id || route.route_id || '',
      driverVehicleId: route.driver_vehicle_id || route.driverVehicleId || '',
      driverId: route.driver_id || route.driverId || '',
      vehicleId: route.vehicle_id || route.vehicleId || '',
      assignedAt: route.assigned_at || route.assignedAt || '',
      originName: route.origin_name || route.originName || '',
      destinationName: route.destination_name || route.destinationName || '',
      status: route.status || 'ROUTE_STATE_UNASSIGNED',
      createdAt: route.created_at || route.createdAt || '',
      startedAt: route.started_at || route.startedAt || null,
      completedAt: route.completed_at || route.completedAt || null,
      coordinateStart: {
        latitude: route.coordinate_start?.latitude || route.coordinateStart?.latitude || 0,
        longitude: route.coordinate_start?.longitude || route.coordinateStart?.longitude || 0,
      },
      coordinateStop: {
        latitude: route.coordinate_stop?.latitude || route.coordinateStop?.latitude || 0,
        longitude: route.coordinate_stop?.longitude || route.coordinateStop?.longitude || 0,
      },
      distanceKm: route.distance_km || route.distanceKm || 0,
      realDistanceKm: route.real_distance_km || route.realDistanceKm || 0,
      estimatedFuelConsumptionLiters: route.estimated_fuel_consumption_liters || route.estimatedFuelConsumptionLiters || 0,
      realFuelConsumptionLiters: route.real_fuel_consumption_liters || route.realFuelConsumptionLiters || 0,
      observations: observations.map((obs: any) => ({
        id: obs.id || '',
        routeId: obs.route_id || obs.routeId || '',
        text: obs.text || '',
        createdAt: obs.created_at || obs.createdAt || '',
        createdBy: obs.created_by || obs.createdBy || '',
      })),
    };
  };

  // Cargar información de un conductor por ID
  const loadDriverById = async (driverId: string): Promise<Driver | null> => {
    try {
      const response = await api<DriverResponse>(`/drivers/${driverId}`);
      return response.driver || null;
    } catch (error) {
      console.error(`❌ Error al cargar conductor ${driverId}:`, error);
      return null;
    }
  };
  
  const loadVehicleById = async (vehicleId: string): Promise<Vehicle | null> => {
    try {
      const response = await api<VehicleResponse>(`/vehicles/${vehicleId}`);
      // La API puede devolver { vehicle: {...} } o directamente el vehículo
      return response.vehicle || null;
    } catch (error) {
      console.error(`❌ Error al cargar vehículo ${vehicleId}:`, error);
      return null;
    }
  };

  const loadRoutes = async () => {
    setIsLoadingRoutes(true);
    try {
      // Cargar todas las rutas (sin paginación para poder filtrar)
      const response = await api<ListRoutesResponse>(`/routes/?page=1&page_size=1000`);
      // Mapear las rutas al formato correcto
      const mappedRoutes = (response.routes || []).map(mapRouteFromApi);
      setAllRoutes(mappedRoutes);
      
      // Aplicar paginación inicial
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      setRoutes(mappedRoutes.slice(startIndex, endIndex));
      setTotalPages(Math.ceil(mappedRoutes.length / pageSize));
      setTotalCount(mappedRoutes.length);
      
      // Cargar información de conductores y vehículos para rutas asignadas
      const uniqueDriverIds = new Set<string>();
      const uniqueVehicleIds = new Set<string>();
      mappedRoutes.forEach(route => {
        if (route.driverId && route.status !== 'ROUTE_STATE_UNASSIGNED') {
          uniqueDriverIds.add(route.driverId);
        }
        if (route.vehicleId && route.status !== 'ROUTE_STATE_UNASSIGNED') {
          uniqueVehicleIds.add(route.vehicleId);
        }
      });
      
      // Cargar información de conductores que aún no tenemos
      const driversToLoad = Array.from(uniqueDriverIds).filter(id => !driversMap[id]);
      if (driversToLoad.length > 0) {
        const driversData = await Promise.all(
          driversToLoad.map(id => loadDriverById(id))
        );
        
        const newDriversMap: Record<string, Driver> = { ...driversMap };
        driversData.forEach((driver, index) => {
          if (driver) {
            newDriversMap[driversToLoad[index]] = driver;
          }
        });
        setDriversMap(newDriversMap);
      }
      
      // Cargar información de vehículos que aún no tenemos
      const vehiclesToLoad = Array.from(uniqueVehicleIds).filter(id => !vehiclesMap[id]);
      if (vehiclesToLoad.length > 0) {
        const vehiclesData = await Promise.all(
          vehiclesToLoad.map(id => loadVehicleById(id))
        );
        
        const newVehiclesMap: Record<string, Vehicle> = { ...vehiclesMap };
        vehiclesData.forEach((vehicle, index) => {
          if (vehicle) {
            newVehiclesMap[vehiclesToLoad[index]] = vehicle;
          }
        });
        setVehiclesMap(newVehiclesMap);
      }
    } catch (error: any) {
      console.error('❌ Error al cargar rutas:', error);
      const errorMessage = formatErrorMessage(error instanceof Error ? error.message : 'Error al cargar las rutas');
      addToast(errorMessage, 'error');
    } finally {
      setIsLoadingRoutes(false);
    }
  };

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
      
      // Cambiar a la tab de lista y recargar
      setActiveTab('list');
      loadRoutes();
    } catch (error: any) {
      console.error('❌ Error al crear ruta:', error);
      const errorMessage = formatErrorMessage(error instanceof Error ? error.message : 'Error al crear la ruta');
      addToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/dashboard');
  };

  // Cargar rutas sin asignar
  const loadUnassignedRoutes = async () => {
    setIsLoadingUnassignedRoutes(true);
    try {
      // Cargar todas las rutas y filtrar las sin asignar
      const response = await api<ListRoutesResponse>(`/routes/?page=1&page_size=1000`);
      const mappedRoutes = (response.routes || []).map(mapRouteFromApi);
      const unassigned = mappedRoutes.filter(r => r.status === 'ROUTE_STATE_UNASSIGNED');
      setUnassignedRoutes(unassigned);
    } catch (error: any) {
      console.error('❌ Error al cargar rutas sin asignar:', error);
      const errorMessage = formatErrorMessage(error instanceof Error ? error.message : 'Error al cargar las rutas');
      addToast(errorMessage, 'error');
    } finally {
      setIsLoadingUnassignedRoutes(false);
    }
  };

  // Cargar drivers disponibles
  const loadDrivers = async () => {
    setIsLoadingDrivers(true);
    try {
      const response = await api<DriversListResponse>('/drivers?page=1&page_size=1000');
      // Filtrar solo drivers disponibles (availability = 1)
      const availableDrivers = (response.drivers || []).filter(d => d.availability === 1);
      setDrivers(availableDrivers);
    } catch (error: any) {
      console.error('❌ Error al cargar conductores:', error);
      const errorMessage = formatErrorMessage(error instanceof Error ? error.message : 'Error al cargar los conductores');
      addToast(errorMessage, 'error');
    } finally {
      setIsLoadingDrivers(false);
    }
  };

  // Cargar assignments de un driver
  const loadDriverAssignments = async (driverId: string) => {
    setIsLoadingAssignments(true);
    try {
      console.log(`🔄 Cargando assignments para driver ${driverId}...`);
      const response = await api<AssignmentsResponse>(`/drivers/${driverId}/assignments`);
      console.log('📦 Assignments recibidos:', response);
      
      // Filtrar solo assignments activos (sin unassigned_at)
      const activeAssignments = (response.items || []).filter(a => !a.unassigned_at);
      console.log('✅ Assignments activos:', activeAssignments.length);
      
      // Enriquecer con información de vehículos
      const enrichedAssignments = await Promise.all(
        activeAssignments.map(async (assignment) => {
          try {
            console.log(`🔄 Cargando vehículo ${assignment.vehicle_id}...`);
            const vehicleResponse = await api<any>(`/vehicles/${assignment.vehicle_id}`);
            console.log(`📦 Respuesta vehículo ${assignment.vehicle_id}:`, vehicleResponse);
            
            // La API puede devolver { vehicle: {...} } o directamente el vehículo
            const vehicle = vehicleResponse.vehicle || vehicleResponse;
            console.log(`🚗 Vehículo procesado:`, vehicle);
            
            // Manejar tanto camelCase como snake_case
            const enriched = {
              ...assignment,
              vehicle: {
                plate: vehicle.plate || vehicle.placa || vehicle.plate_number || 'N/A',
                brand: vehicle.brand || vehicle.marca || vehicle.brand_name || '',
                model: vehicle.model || vehicle.modelo || vehicle.model_name || '',
              },
            };
            console.log(`✅ Assignment enriquecido:`, enriched);
            return enriched;
          } catch (error) {
            console.error(`❌ Error al cargar vehículo ${assignment.vehicle_id}:`, error);
            return {
              ...assignment,
              vehicle: {
                plate: 'N/A',
                brand: '',
                model: '',
              },
            };
          }
        })
      );
      
      console.log('✅ Assignments enriquecidos finales:', enrichedAssignments);
      setAssignments(enrichedAssignments);
      
      // Si había un assignment seleccionado que ya no está disponible, limpiarlo
      if (selectedAssignmentId && !enrichedAssignments.find(a => a.assignment_id === selectedAssignmentId)) {
        setSelectedAssignmentId('');
      }
    } catch (error: any) {
      console.error('❌ Error al cargar asignaciones:', error);
      const errorMessage = formatErrorMessage(error instanceof Error ? error.message : 'Error al cargar las asignaciones');
      addToast(errorMessage, 'error');
      setAssignments([]);
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  // Manejar asignación de ruta
  const handleAssignRoute = async () => {
    // Validar
    const errors: Record<string, string> = {};
    if (!selectedRouteId) {
      errors.route = 'Debes seleccionar una ruta';
    }
    if (!selectedDriverId) {
      errors.driver = 'Debes seleccionar un conductor';
    }
    if (!selectedAssignmentId) {
      errors.assignment = 'Debes seleccionar un vehículo';
    }

    if (Object.keys(errors).length > 0) {
      setAssignErrors(errors);
      return;
    }

    setIsAssigning(true);
    setAssignErrors({});
    try {
      console.log('🔄 Asignando ruta...', {
        routeId: selectedRouteId,
        driverId: selectedDriverId,
        assignmentId: selectedAssignmentId,
      });

      await api<RouteProto>(`/routes/assign/${selectedRouteId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          driver_vehicle_id: selectedAssignmentId,
        }),
      });

      addToast('Ruta asignada exitosamente', 'success');
      
      // Limpiar formulario
      setSelectedRouteId('');
      setSelectedDriverId('');
      setSelectedAssignmentId('');
      setAssignments([]);
      
      // Recargar datos
      await Promise.all([
        loadUnassignedRoutes(),
        loadRoutes(),
      ]);
      
      // Cambiar a la tab de lista para ver la ruta asignada
      setActiveTab('list');
    } catch (error: any) {
      console.error('❌ Error al asignar ruta:', error);
      const errorMessage = formatErrorMessage(error instanceof Error ? error.message : 'Error al asignar la ruta');
      addToast(errorMessage, 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const getRouteStatusLabel = (status: string | undefined): string => {
    const statusMap: Record<string, string> = {
      'ROUTE_STATE_UNASSIGNED': 'Sin Asignar',
      'ROUTE_STATE_ASSIGNED': 'Asignada',
      'ROUTE_STATE_STARTED': 'En Curso',
      'ROUTE_STATE_COMPLETED': 'Completada',
    };
    return status ? statusMap[status] || 'Desconocido' : 'Desconocido';
  };

  const getRouteStatusColor = (status: string | undefined): string => {
    const colorMap: Record<string, string> = {
      'ROUTE_STATE_UNASSIGNED': 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30',
      'ROUTE_STATE_ASSIGNED': 'text-blue-400 bg-blue-400/20 border-blue-400/30',
      'ROUTE_STATE_STARTED': 'text-green-400 bg-green-400/20 border-green-400/30',
      'ROUTE_STATE_COMPLETED': 'text-slate-400 bg-slate-400/20 border-slate-400/30',
    };
    return status ? colorMap[status] || 'text-slate-400 bg-slate-400/20 border-slate-400/30' : 'text-slate-400 bg-slate-400/20 border-slate-400/30';
  };

  const tabs = [
    {
      id: 'create',
      label: 'Crear Ruta',
      icon: <Plus className="w-4 h-4" />,
    },
    {
      id: 'assign',
      label: 'Asignar Ruta',
      icon: <UserCheck className="w-4 h-4" />,
      count: unassignedRoutes.length,
    },
    {
      id: 'list',
      label: 'Ver Rutas',
      icon: <List className="w-4 h-4" />,
      count: totalCount,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-blue-600/20 border border-blue-600/30">
          <Route className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Rutas</h1>
          <p className="text-slate-400">Crea y administra las rutas del sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as 'create' | 'list' | 'assign')}
      />

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'create' && (
          <div className="space-y-6">
            {/* Form Card */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur-sm">
              <CreateRouteForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="space-y-6">
            {/* Filtros */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur-sm space-y-4">
              {/* Filtro de rutas sin asignar */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="unassigned-filter"
                  checked={showUnassignedOnly}
                  onChange={(e) => {
                    setShowUnassignedOnly(e.target.checked);
                    setCurrentPage(1);
                  }}
                  disabled={!!selectedDriverFilter} // Bloquear si hay un conductor seleccionado
                  className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label 
                  htmlFor="unassigned-filter" 
                  className={`text-sm font-medium cursor-pointer ${
                    selectedDriverFilter ? 'text-slate-500 cursor-not-allowed' : 'text-white'
                  }`}
                >
                  Mostrar solo rutas sin asignar
                </label>
              </div>

              {/* Filtro por conductor */}
              <div className="flex items-center gap-4">
                <label htmlFor="driver-filter" className="text-sm font-medium text-white whitespace-nowrap">
                  Filtrar por conductor:
                </label>
                <select
                  id="driver-filter"
                  className="fuel-input flex-1 max-w-md disabled:opacity-50 disabled:cursor-not-allowed"
                  value={selectedDriverFilter}
                  onChange={(e) => {
                    setSelectedDriverFilter(e.target.value);
                    setCurrentPage(1); // Resetear a la primera página al cambiar el filtro
                  }}
                  disabled={showUnassignedOnly} // Bloquear si está marcado "sin asignar"
                >
                  <option value="">Todos los conductores</option>
                  {allDriversForFilter.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.full_name} ({driver.license_number})
                    </option>
                  ))}
                </select>
                {(selectedDriverFilter || showUnassignedOnly) && (
                  <button
                    onClick={() => {
                      setSelectedDriverFilter('');
                      setShowUnassignedOnly(false);
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors border border-slate-600 hover:border-slate-500"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
              
              {/* Información de filtros activos */}
              {(selectedDriverFilter || showUnassignedOnly) && (
                <div className="pt-3 border-t border-slate-700">
                  <p className="text-sm text-slate-400">
                    {showUnassignedOnly && (
                      <span className="text-white font-medium">Rutas sin asignar</span>
                    )}
                    {showUnassignedOnly && selectedDriverFilter && ' • '}
                    {selectedDriverFilter && driversMap[selectedDriverFilter] && (
                      <span className="text-white font-medium">Asignadas a: {driversMap[selectedDriverFilter].full_name}</span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {isLoadingRoutes ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                <span className="ml-3 text-slate-400">Cargando rutas...</span>
              </div>
            ) : routes.length > 0 ? (
              <>
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur-sm">
                  <div className="space-y-4">
                    {routes.map((route) => (
                      <div
                        key={route.id}
                        className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-slate-500/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-white">
                                {route.originName || 'Sin origen'} → {route.destinationName || 'Sin destino'}
                              </h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRouteStatusColor(route.status)}`}>
                                {getRouteStatusLabel(route.status)}
                              </span>
                            </div>
                            {/* Mostrar información del conductor y vehículo si la ruta está asignada */}
                            {route.driverId && route.status !== 'ROUTE_STATE_UNASSIGNED' && driversMap[route.driverId] && (
                              <div className="space-y-2 mb-3">
                                <div className="flex items-center gap-2 p-2 bg-slate-600/30 rounded-lg">
                                  <UserCheck className="w-4 h-4 text-blue-400" />
                                  <span className="text-slate-300 text-sm">
                                    <span className="text-slate-400">Conductor asignado: </span>
                                    <span className="font-medium text-white">{driversMap[route.driverId].full_name}</span>
                                    {driversMap[route.driverId].license_number && (
                                      <span className="text-slate-500 ml-2">({driversMap[route.driverId].license_number})</span>
                                    )}
                                  </span>
                                </div>
                                {route.vehicleId && vehiclesMap[route.vehicleId] && (
                                  <div className="flex items-center gap-2 p-2 bg-slate-600/30 rounded-lg">
                                    <Car className="w-4 h-4 text-green-400" />
                                    <span className="text-slate-300 text-sm">
                                      <span className="text-slate-400">Vehículo asignado: </span>
                                      <span className="font-medium text-white">
                                        {vehiclesMap[route.vehicleId].plate}
                                      </span>
                                      {(vehiclesMap[route.vehicleId].brand || vehiclesMap[route.vehicleId].model) && (
                                        <span className="text-slate-500 ml-2">
                                          ({vehiclesMap[route.vehicleId].brand} {vehiclesMap[route.vehicleId].model})
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                              <div>
                                <span className="text-slate-400">Distancia:</span>
                                <p className="text-white font-medium">
                                  {route.distanceKm ? `${route.distanceKm.toFixed(2)} km` : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <span className="text-slate-400">Coordenadas inicio:</span>
                                <p className="text-white font-medium">
                                  {route.coordinateStart?.latitude && route.coordinateStart?.longitude
                                    ? `${route.coordinateStart.latitude.toFixed(4)}, ${route.coordinateStart.longitude.toFixed(4)}`
                                    : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <span className="text-slate-400">Coordenadas fin:</span>
                                <p className="text-white font-medium">
                                  {route.coordinateStop?.latitude && route.coordinateStop?.longitude
                                    ? `${route.coordinateStop.latitude.toFixed(4)}, ${route.coordinateStop.longitude.toFixed(4)}`
                                    : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <span className="text-slate-400">Creada:</span>
                                <p className="text-white font-medium text-xs">
                                  {route.createdAt ? new Date(route.createdAt).toLocaleDateString('es-ES') : 'N/A'}
                                </p>
                              </div>
                            </div>
                            {/* Observaciones */}
                            {(route.observations && route.observations.length > 0) && (
                              <div className="mt-3 pt-3 border-t border-slate-600/50">
                                <button
                                  onClick={() => {
                                    const newExpanded = new Set(expandedObservations);
                                    if (newExpanded.has(route.id || '')) {
                                      newExpanded.delete(route.id || '');
                                    } else {
                                      newExpanded.add(route.id || '');
                                    }
                                    setExpandedObservations(newExpanded);
                                  }}
                                  className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors w-full"
                                >
                                  <Clock className="w-4 h-4 text-blue-400" />
                                  <span className="text-sm font-medium">
                                    Observaciones ({route.observations.length})
                                  </span>
                                  {expandedObservations.has(route.id || '') ? (
                                    <ChevronUp className="w-4 h-4 ml-auto" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 ml-auto" />
                                  )}
                                </button>
                                {expandedObservations.has(route.id || '') && (
                                  <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                                    {route.observations.map((obs) => {
                                      const obsDate = obs.createdAt || obs.created_at;
                                      const obsText = obs.text || '';
                                      const obsId = obs.id || '';
                                      
                                      return (
                                        <div
                                          key={obsId}
                                          className="p-3 bg-slate-600/20 rounded-lg border border-slate-600/30"
                                        >
                                          <p className="text-sm text-white mb-1">{obsText}</p>
                                          <p className="text-xs text-slate-400">
                                            {obsDate ? new Date(obsDate).toLocaleString('es-ES') : 'Fecha desconocida'}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="mt-3 pt-3 border-t border-slate-600/50">
                              <span className="text-slate-400 text-xs">ID: </span>
                              <span className="text-slate-500 font-mono text-xs">{route.id}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pagination */}
                {totalCount > pageSize && (
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                    <Pagination
                      page={currentPage}
                      perPage={pageSize}
                      total={totalCount}
                      onPageChange={setCurrentPage}
                      className="w-full"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
                <Route className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                {selectedDriverFilter ? (
                  <>
                    <h3 className="text-lg font-semibold text-white mb-2">No hay rutas para este conductor</h3>
                    <p className="text-slate-400 mb-4">
                      {driversMap[selectedDriverFilter] 
                        ? `El conductor ${driversMap[selectedDriverFilter].full_name} no tiene rutas asignadas.`
                        : 'Este conductor no tiene rutas asignadas.'}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedDriverFilter('');
                        setCurrentPage(1);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Ver todas las rutas
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-white mb-2">No hay rutas creadas</h3>
                    <p className="text-slate-400 mb-4">Crea tu primera ruta usando la pestaña "Crear Ruta"</p>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Crear Ruta
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'assign' && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-white mb-6">Asignar Ruta a Conductor y Vehículo</h2>
              
              <form onSubmit={(e) => { e.preventDefault(); handleAssignRoute(); }} className="space-y-6">
                {/* Select de Ruta */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Seleccionar Ruta <span className="text-red-400">*</span>
                  </label>
                  {isLoadingUnassignedRoutes ? (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Cargando rutas...</span>
                    </div>
                  ) : (
                    <select
                      value={selectedRouteId}
                      onChange={(e) => {
                        setSelectedRouteId(e.target.value);
                        if (assignErrors.route) {
                          setAssignErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.route;
                            return newErrors;
                          });
                        }
                      }}
                      className={`w-full px-4 py-3 bg-slate-700/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${
                        assignErrors.route ? 'border-red-500' : 'border-slate-600'
                      }`}
                      required
                    >
                      <option value="">Seleccione una ruta sin asignar...</option>
                      {unassignedRoutes.map((route) => (
                        <option key={route.id} value={route.id}>
                          {route.originName || 'Sin origen'} → {route.destinationName || 'Sin destino'} 
                          {' '}({route.distanceKm ? `${route.distanceKm.toFixed(2)} km` : 'N/A'})
                        </option>
                      ))}
                    </select>
                  )}
                  {assignErrors.route && (
                    <div className="flex items-center gap-1 text-red-400 text-xs mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {assignErrors.route}
                    </div>
                  )}
                  {!isLoadingUnassignedRoutes && unassignedRoutes.length === 0 && (
                    <p className="text-slate-400 text-sm mt-2">No hay rutas sin asignar disponibles</p>
                  )}
                </div>

                {/* Select de Conductor */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Seleccionar Conductor <span className="text-red-400">*</span>
                  </label>
                  {isLoadingDrivers ? (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Cargando conductores...</span>
                    </div>
                  ) : (
                    <select
                      value={selectedDriverId}
                      onChange={(e) => {
                        setSelectedDriverId(e.target.value);
                        setSelectedAssignmentId(''); // Limpiar selección de vehículo
                        if (assignErrors.driver) {
                          setAssignErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.driver;
                            return newErrors;
                          });
                        }
                      }}
                      className={`w-full px-4 py-3 bg-slate-700/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${
                        assignErrors.driver ? 'border-red-500' : 'border-slate-600'
                      }`}
                      required
                    >
                      <option value="">Seleccione un conductor disponible...</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.full_name} ({driver.license_number})
                        </option>
                      ))}
                    </select>
                  )}
                  {assignErrors.driver && (
                    <div className="flex items-center gap-1 text-red-400 text-xs mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {assignErrors.driver}
                    </div>
                  )}
                  {!isLoadingDrivers && drivers.length === 0 && (
                    <p className="text-slate-400 text-sm mt-2">No hay conductores disponibles</p>
                  )}
                </div>

                {/* Select de Vehículo (Assignment) */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Seleccionar Vehículo <span className="text-red-400">*</span>
                  </label>
                  {!selectedDriverId ? (
                    <div className="px-4 py-3 bg-slate-700/30 border border-slate-600 rounded-lg text-slate-500">
                      Primero seleccione un conductor
                    </div>
                  ) : isLoadingAssignments ? (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Cargando vehículos del conductor...</span>
                    </div>
                  ) : (
                    <select
                      value={selectedAssignmentId}
                      onChange={(e) => {
                        setSelectedAssignmentId(e.target.value);
                        if (assignErrors.assignment) {
                          setAssignErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.assignment;
                            return newErrors;
                          });
                        }
                      }}
                      className={`w-full px-4 py-3 bg-slate-700/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${
                        assignErrors.assignment ? 'border-red-500' : 'border-slate-600'
                      }`}
                      required
                      disabled={!selectedDriverId || isLoadingAssignments}
                    >
                      <option value="">Seleccione un vehículo asignado al conductor...</option>
                      {assignments.map((assignment) => (
                        <option key={assignment.assignment_id} value={assignment.assignment_id}>
                          {assignment.vehicle
                            ? `${assignment.vehicle.plate} - ${assignment.vehicle.brand} ${assignment.vehicle.model}`
                            : `Vehículo ${assignment.vehicle_id.substring(0, 8)}...`}
                        </option>
                      ))}
                    </select>
                  )}
                  {assignErrors.assignment && (
                    <div className="flex items-center gap-1 text-red-400 text-xs mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {assignErrors.assignment}
                    </div>
                  )}
                  {selectedDriverId && !isLoadingAssignments && assignments.length === 0 && (
                    <p className="text-slate-400 text-sm mt-2">Este conductor no tiene vehículos asignados</p>
                  )}
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4 border-t border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRouteId('');
                      setSelectedDriverId('');
                      setSelectedAssignmentId('');
                      setAssignments([]);
                      setAssignErrors({});
                    }}
                    className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    disabled={isAssigning}
                  >
                    Limpiar
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isAssigning ||
                      !selectedRouteId ||
                      !selectedDriverId ||
                      !selectedAssignmentId ||
                      isLoadingUnassignedRoutes ||
                      isLoadingDrivers ||
                      isLoadingAssignments
                    }
                    className={`flex-1 px-4 py-3 rounded-lg transition-colors ${
                      isAssigning ||
                      !selectedRouteId ||
                      !selectedDriverId ||
                      !selectedAssignmentId ||
                      isLoadingUnassignedRoutes ||
                      isLoadingDrivers ||
                      isLoadingAssignments
                        ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isAssigning ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Asignando...
                      </span>
                    ) : (
                      'Asignar Ruta'
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Info Card */}
            <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <UserCheck className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-slate-300">
                  <p className="font-medium text-blue-400 mb-1">Información sobre la asignación:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li>Solo se muestran rutas sin asignar (estado "Sin Asignar")</li>
                    <li>Solo se muestran conductores disponibles (no ocupados)</li>
                    <li>Los vehículos mostrados son los que están actualmente asignados al conductor seleccionado</li>
                    <li>Al asignar una ruta, el conductor cambiará su estado a "Ocupado"</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRoutes;
