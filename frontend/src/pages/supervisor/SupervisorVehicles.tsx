import React, { useState, useEffect } from 'react';
import { Car, Clock, CheckCircle, User } from 'lucide-react';
import { api } from '../../api/api';
import type { VehicleWithDriver, ListVehiclesResponse } from '../../types/vehicle';
import { useToast } from '../../shared/ToastNotification';
import { VehicleTable, AssignDriverModal, ChangeStatusModal } from '../../components/admin/vehicles';
import EmptyState from '../../shared/EmptyState';
import Tabs from '../../shared/Tabs';
import Pagination from '../../shared/Pagination';
import { VEHICLE_STATUS } from '../../utils/constants';
import { formatErrorMessage } from '../../utils/errorTranslations';

interface Driver {
  id: string;
  full_name: string;
  license_number: string;
  availability: number;
  capabilities?: number; // 1=Liviana, 2=Pesada, 3=Ambas
}

const SupervisorVehicles: React.FC = () => {
  const { addToast } = useToast();

  // State
  const [vehicles, setVehicles] = useState<VehicleWithDriver[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [activeAssignments, setActiveAssignments] = useState<Array<{vehicle_id: string, driver_id: string}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'unassigned' | 'assigned'>('unassigned');
  
  // Modales
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithDriver | null>(null);

  // Pagination state for unassigned vehicles
  const [unassignedCurrentPage, setUnassignedCurrentPage] = useState(1);
  const [unassignedTotalPages, setUnassignedTotalPages] = useState(1);
  const [unassignedTotalCount, setUnassignedTotalCount] = useState(0);
  const [unassignedVehicles, setUnassignedVehicles] = useState<VehicleWithDriver[]>([]);
  const unassignedPageSize = 5;

  // Pagination state for assigned vehicles
  const [assignedCurrentPage, setAssignedCurrentPage] = useState(1);
  const [assignedTotalPages, setAssignedTotalPages] = useState(1);
  const [assignedTotalCount, setAssignedTotalCount] = useState(0);
  const [assignedVehicles, setAssignedVehicles] = useState<VehicleWithDriver[]>([]);
  const assignedPageSize = 5;

  // Calculate statistics using vehicle status
  const unassignedCount = unassignedTotalCount;
  const assignedCount = assignedTotalCount;
  const availableCount = vehicles.filter(v => v.status === VEHICLE_STATUS.AVAILABLE).length;
  const inUseCount = vehicles.filter(v => v.status === VEHICLE_STATUS.OCCUPIED).length;

  // Tab configuration
  const tabs = [
    {
      id: 'unassigned',
      label: 'Vehículos Sin Asignar',
      count: unassignedCount,
      icon: <Clock className="w-4 h-4" />,
      badge: availableCount > 0 ? `${availableCount} Disponibles` : undefined,
      badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
    },
    {
      id: 'assigned',
      label: 'Vehículos Asignados',
      count: assignedCount,
      icon: <CheckCircle className="w-4 h-4" />,
      badge: inUseCount > 0 ? `${inUseCount} Ocupados` : undefined,
      badgeColor: 'bg-green-500/20 text-green-400 border border-green-500/30'
    }
  ];

  // Fetch drivers
  const fetchDrivers = async () => {
    try {
      console.log('🔄 Cargando conductores...');
      const response = await api<{ drivers: Driver[] }>('/drivers');
      console.log('👥 Conductores recibidos:', response.drivers);
      setDrivers(response.drivers);
    } catch (error: any) {
      console.error('❌ Error fetching drivers:', error);
      addToast('Error al cargar conductores', 'error');
    }
  };

  // Fetch active assignments
  const fetchActiveAssignments = async () => {
    try {
      console.log('🔄 Cargando asignaciones activas...');
      const response = await api<{ active_assignments: Array<{vehicle_id: string, driver_id: string}> }>('/vehicles/active-assignments');
      console.log('🔗 Asignaciones activas recibidas:', response.active_assignments);
      setActiveAssignments(response.active_assignments);
    } catch (error: any) {
      console.error('❌ Error fetching active assignments:', error);
      addToast('Error al cargar asignaciones activas', 'error');
    }
  };

  // Fetch unassigned vehicles with pagination
  const fetchUnassignedVehicles = async (page: number = unassignedCurrentPage) => {
    try {
      setIsLoading(true);
      console.log('🔄 Cargando vehículos sin asignar página:', page);
      
      // Get all vehicles first
      const response = await api<ListVehiclesResponse>('/vehicles?page=1&page_size=1000');
      
      // Filter vehicles with status DISPONIBLE (1)
      const unassignedVehiclesList = response.vehicles.filter(vehicle => {
        console.log(`🔍 Vehículo ${vehicle.plate}: status = ${vehicle.status}`);
        
        // Return true if DISPONIBLE (status = 1)
        return vehicle.status === VEHICLE_STATUS.AVAILABLE;
      });
      
      // Calculate pagination
      const totalCount = unassignedVehiclesList.length;
      const totalPages = Math.ceil(totalCount / unassignedPageSize);
      const startIndex = (page - 1) * unassignedPageSize;
      const endIndex = startIndex + unassignedPageSize;
      const paginatedVehicles = unassignedVehiclesList.slice(startIndex, endIndex);
      
      setUnassignedVehicles(paginatedVehicles);
      setUnassignedTotalCount(totalCount);
      setUnassignedTotalPages(totalPages);
      setUnassignedCurrentPage(page);
      
      console.log('🚗 Vehículos sin asignar cargados:', {
        page,
        totalCount,
        totalPages,
        vehicles: paginatedVehicles.length
      });
    } catch (error: any) {
      console.error('❌ Error fetching unassigned vehicles:', error);
      addToast('Error al cargar vehículos sin asignar', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch assigned vehicles with pagination
  const fetchAssignedVehicles = async (page: number = assignedCurrentPage) => {
    try {
      setIsLoading(true);
      console.log('🔄 Cargando vehículos asignados página:', page);
      
      // Get all vehicles first
      const response = await api<ListVehiclesResponse>('/vehicles?page=1&page_size=1000');
      
      // Filter vehicles with status OCUPADO (2) and enrich with driver data
      const assignedVehiclesList = response.vehicles
        .filter(vehicle => {
          console.log(`🔍 Vehículo asignado ${vehicle.plate}: status = ${vehicle.status}`);
          
          // Return true if OCUPADO (status = 2)
          return vehicle.status === VEHICLE_STATUS.OCCUPIED;
        })
        .map(vehicle => {
          // Find the assignment for this vehicle
          const assignment = activeAssignments.find(assignment => assignment.vehicle_id === vehicle.id);
          const driver = assignment ? drivers.find(d => d.id === assignment.driver_id) : null;
          
          return {
            ...vehicle,
            driver_id: assignment?.driver_id || undefined,
            driver: driver ? {
              id: driver.id,
              full_name: driver.full_name,
              license_number: driver.license_number
            } : undefined
          };
        });
      
      // Calculate pagination
      const totalCount = assignedVehiclesList.length;
      const totalPages = Math.ceil(totalCount / assignedPageSize);
      const startIndex = (page - 1) * assignedPageSize;
      const endIndex = startIndex + assignedPageSize;
      const paginatedVehicles = assignedVehiclesList.slice(startIndex, endIndex);
      
      setAssignedVehicles(paginatedVehicles);
      setAssignedTotalCount(totalCount);
      setAssignedTotalPages(totalPages);
      setAssignedCurrentPage(page);
      
      console.log('🚗 Vehículos asignados cargados:', {
        page,
        totalCount,
        totalPages,
        vehicles: paginatedVehicles.length
      });
    } catch (error: any) {
      console.error('❌ Error fetching assigned vehicles:', error);
      addToast('Error al cargar vehículos asignados', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all vehicles for statistics
  const fetchAllVehicles = async () => {
    try {
      const response = await api<ListVehiclesResponse>('/vehicles?page=1&page_size=1000');
      setVehicles(response.vehicles);
    } catch (error: any) {
      console.error('❌ Error fetching all vehicles:', error);
    }
  };

  // Handle assign driver
  const handleAssignDriver = (vehicle: VehicleWithDriver) => {
    setSelectedVehicle(vehicle);
    setIsAssignModalOpen(true);
  };

  // Handle assign driver submit
  const handleAssignDriverSubmit = async (driverId: string) => {
    if (!selectedVehicle) return;

    try {
      setIsSubmitting(true);
      await api('/vehicles/assign', {
        method: 'POST',
        body: JSON.stringify({
          vehicle_id: selectedVehicle.id,
          driver_id: driverId
        })
      });

      addToast('Conductor asignado exitosamente', 'success');
      await Promise.all([
        fetchAllVehicles(),
        fetchUnassignedVehicles(unassignedCurrentPage),
        fetchAssignedVehicles(assignedCurrentPage),
        fetchActiveAssignments()
      ]);
    } catch (error: any) {
      console.error('Error assigning driver:', error);
      
      // Manejar errores específicos
      if (error.message?.includes('VEHICLE_ALREADY_ASSIGNED')) {
        addToast('Este vehículo ya está asignado a otro conductor', 'error');
      } else if (error.message?.includes('VEHICLE_NOT_FOUND')) {
        addToast('Vehículo no encontrado', 'error');
      } else {
        addToast('Error al asignar conductor', 'error');
      }
      
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle change status
  const handleChangeStatus = (vehicle: VehicleWithDriver) => {
    setSelectedVehicle(vehicle);
    setIsStatusModalOpen(true);
  };

  // Handle change status submit
  const handleChangeStatusSubmit = async (newStatus: number) => {
    if (!selectedVehicle) return;

    try {
      setIsSubmitting(true);
      
      // Si queremos cambiar a DISPONIBLE, usar el endpoint SetStatus que valida rutas activas
      if (newStatus === VEHICLE_STATUS.AVAILABLE) {
        // Usar el endpoint SetStatus que tiene la validación de rutas activas
        await api(`/vehicles/${selectedVehicle.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: VEHICLE_STATUS.AVAILABLE })
        });
        addToast('Estado del vehículo actualizado exitosamente', 'success');
      } else if (newStatus === VEHICLE_STATUS.OCCUPIED) {
        // Para cambiar a OCUPADO, usar SetStatus también
        await api(`/vehicles/${selectedVehicle.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: VEHICLE_STATUS.OCCUPIED })
        });
        addToast('Estado del vehículo actualizado exitosamente', 'success');
      } else {
        // Si ya está en el estado deseado, no hacer nada
        addToast('El vehículo ya está en el estado seleccionado', 'info');
        return;
      }

      await Promise.all([
        fetchAllVehicles(),
        fetchUnassignedVehicles(unassignedCurrentPage),
        fetchAssignedVehicles(assignedCurrentPage),
        fetchActiveAssignments()
      ]);
    } catch (error: any) {
      console.error('Error updating status:', error);
      
      const errorMessage = formatErrorMessage(error.message || 'Error al actualizar estado');
      
      if (error.message?.includes('VEHICLE_IN_ACTIVE_ROUTE')) {
        addToast(errorMessage, 'error');
      } else if (error.message?.includes('VEHICLE_NOT_FOUND')) {
        addToast('Vehículo no encontrado', 'error');
      } else {
        addToast(errorMessage, 'error');
      }
      
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close assign modal
  const handleAssignModalClose = () => {
    setIsAssignModalOpen(false);
    setSelectedVehicle(null);
  };

  // Handle close status modal
  const handleStatusModalClose = () => {
    setIsStatusModalOpen(false);
    setSelectedVehicle(null);
  };

  // Handle pagination for unassigned vehicles
  const handleUnassignedPageChange = (page: number) => {
    fetchUnassignedVehicles(page);
  };

  // Handle pagination for assigned vehicles
  const handleAssignedPageChange = (page: number) => {
    fetchAssignedVehicles(page);
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchDrivers(),
        fetchActiveAssignments(),
        fetchAllVehicles()
      ]);
    };
    loadData();
  }, []);

  // Refetch vehicles when assignments change
  useEffect(() => {
    if (activeAssignments.length >= 0) { // Allow empty array
      fetchUnassignedVehicles();
      fetchAssignedVehicles();
    }
  }, [activeAssignments]);

  // Refetch assigned vehicles when drivers change
  useEffect(() => {
    if (drivers.length > 0) {
      fetchAssignedVehicles(assignedCurrentPage);
    }
  }, [drivers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-2">
            Asignar Vehículos a Conductores
          </h1>
          <p className="text-slate-400">Gestiona las asignaciones de vehículos a conductores del sistema</p>
        </div>
      </div>

      {/* Estadísticas */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="fuel-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
                <Car className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{vehicles.length}</div>
                <div className="text-sm text-slate-400">Total Vehículos</div>
              </div>
            </div>
          </div>
          
          <div className="fuel-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-600/20 border border-green-600/30">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{assignedCount}</div>
                <div className="text-sm text-slate-400">Asignados</div>
              </div>
            </div>
          </div>
          
          <div className="fuel-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-600/20 border border-yellow-600/30">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{unassignedCount}</div>
                <div className="text-sm text-slate-400">Sin Asignar</div>
              </div>
            </div>
          </div>
          
          <div className="fuel-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-600/20 border border-purple-600/30">
                <User className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{drivers.length}</div>
                <div className="text-sm text-slate-400">Conductores</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {!isLoading && (
        <div className="space-y-6">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId as 'unassigned' | 'assigned')}
          />

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'unassigned' && (
              <div className="space-y-6">
                {unassignedVehicles.length > 0 ? (
                  <>
                    <div className="fuel-card p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-yellow-600/20 border border-yellow-600/30">
                          <Clock className="w-6 h-6 text-yellow-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">Vehículos Sin Asignar</h2>
                      </div>
                      
                      <VehicleTable
                        vehicles={unassignedVehicles}
                        isLoading={isLoading}
                        onAssign={handleAssignDriver}
                        showAsAvailable={true}
                      />
                    </div>

                    {/* Pagination for unassigned vehicles */}
                    {unassignedTotalPages > 1 && (
                      <div className="fuel-card p-6">
                        <Pagination
                          page={unassignedCurrentPage}
                          perPage={unassignedPageSize}
                          total={unassignedTotalCount}
                          onPageChange={handleUnassignedPageChange}
                          className="w-full"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="fuel-card p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-yellow-600/20 border border-yellow-600/30">
                        <Clock className="w-6 h-6 text-yellow-400" />
                      </div>
                      <h2 className="text-xl font-semibold text-white">Vehículos Sin Asignar</h2>
                    </div>
                    
                    <EmptyState
                      icon={Car}
                      title="No hay vehículos sin asignar"
                      description="Todos los vehículos están asignados a conductores"
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'assigned' && (
              <div className="space-y-6">
                {assignedVehicles.length > 0 ? (
                  <>
                    <div className="fuel-card p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-green-600/20 border border-green-600/30">
                          <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">Vehículos Asignados</h2>
                      </div>
                      
                      <VehicleTable
                        vehicles={assignedVehicles}
                        isLoading={isLoading}
                        onStatusChange={handleChangeStatus}
                        showAsAvailable={false}
                      />
                    </div>

                    {/* Pagination for assigned vehicles */}
                    {assignedTotalPages > 1 && (
                      <div className="fuel-card p-6">
                        <Pagination
                          page={assignedCurrentPage}
                          perPage={assignedPageSize}
                          total={assignedTotalCount}
                          onPageChange={handleAssignedPageChange}
                          className="w-full"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="fuel-card p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-green-600/20 border border-green-600/30">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      </div>
                      <h2 className="text-xl font-semibold text-white">Vehículos Asignados</h2>
                    </div>
                    
                    <EmptyState
                      icon={Car}
                      title="No hay vehículos asignados"
                      description="Los vehículos aparecerán aquí una vez que sean asignados a conductores"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Asignar Conductor */}
      <AssignDriverModal
        isOpen={isAssignModalOpen}
        onClose={handleAssignModalClose}
        onSubmit={handleAssignDriverSubmit}
        vehiclePlate={selectedVehicle?.plate || ''}
        vehicleMachinery={selectedVehicle?.machinery}
        isLoading={isSubmitting}
        drivers={drivers.map(d => ({
          id: d.id,
          full_name: d.full_name,
          license_number: d.license_number,
          capabilities: d.capabilities
        }))}
      />

      {/* Modal de Cambiar Estado */}
      <ChangeStatusModal
        isOpen={isStatusModalOpen}
        onClose={handleStatusModalClose}
        onSubmit={handleChangeStatusSubmit}
        vehiclePlate={selectedVehicle?.plate || ''}
        currentStatus={selectedVehicle?.status || 1}
        hasDriver={!!selectedVehicle?.driver}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default SupervisorVehicles;
