import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Car, Plus, Clock, CheckCircle, User } from 'lucide-react';
import { api } from '../../api/api';
import type { VehicleWithDriver, VehiclesListResponse } from '../../types/vehicle';
import { useToast } from '../../shared/ToastNotification';
import { VehicleTable, VehicleFormModal } from '../../components/admin/vehicles';
import type { VehicleFormData as VehicleFormDataType } from '../../components/admin/vehicles';
import EmptyState from '../../shared/EmptyState';
import Tabs from '../../shared/Tabs';
import Pagination from '../../shared/Pagination';

interface Driver {
  id: string;
  full_name: string;
  license_number: string;
  availability: number;
}

const AdminVehicles: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  // State
  const [vehicles, setVehicles] = useState<VehicleWithDriver[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleWithDriver | null>(null);
  const [activeTab, setActiveTab] = useState<'unassigned' | 'assigned'>('unassigned');

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

  // Calculate statistics
  const unassignedCount = unassignedTotalCount;
  const assignedCount = assignedTotalCount;
  const availableCount = vehicles.filter(v => v.status === 1 && !v.driver_id).length;
  const inUseCount = vehicles.filter(v => v.status === 2).length;
  const maintenanceCount = vehicles.filter(v => v.status === 3).length;
  const outOfServiceCount = vehicles.filter(v => v.status === 4).length;

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
      badge: inUseCount > 0 ? `${inUseCount} En Uso` : undefined,
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

  // Fetch unassigned vehicles with pagination
  const fetchUnassignedVehicles = async (page: number = unassignedCurrentPage) => {
    try {
      setIsLoading(true);
      console.log('🔄 Cargando vehículos sin asignar página:', page);
      
      // Get all vehicles first
      const response = await api<VehiclesListResponse>('/vehicles?page=1&page_size=1000');
      
      // Filter vehicles without assigned drivers
      const unassignedVehiclesList = response.vehicles.filter(vehicle => 
        !vehicle.driver_id
      );
      
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
      const response = await api<VehiclesListResponse>('/vehicles?page=1&page_size=1000');
      
      // Filter vehicles with assigned drivers and enrich with driver data
      const assignedVehiclesList = response.vehicles
        .filter(vehicle => vehicle.driver_id)
        .map(vehicle => {
          const driver = drivers.find(d => d.id === vehicle.driver_id);
          return {
            ...vehicle,
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
      const response = await api<VehiclesListResponse>('/vehicles?page=1&page_size=1000');
      setVehicles(response.vehicles);
    } catch (error: any) {
      console.error('❌ Error fetching all vehicles:', error);
    }
  };

  // Handle create vehicle
  const handleCreateVehicle = async (vehicleData: VehicleFormDataType) => {
    try {
      setIsSubmitting(true);
      console.log('🔄 Creando vehículo:', vehicleData);
      
      const response = await api('/vehicles', {
        method: 'POST',
        body: JSON.stringify(vehicleData)
      });
      console.log('✅ Vehículo creado exitosamente:', response);

      addToast('Vehículo creado exitosamente', 'success');
      await Promise.all([
        fetchAllVehicles(),
        fetchUnassignedVehicles(unassignedCurrentPage),
        fetchAssignedVehicles(assignedCurrentPage)
      ]);
    } catch (error: any) {
      console.error('❌ Error creating vehicle:', error);
      
      if (error.status === 403) {
        addToast('No tienes permisos para crear vehículos', 'error');
      } else if (error.status === 401) {
        navigate('/auth/login');
        return;
      } else {
        addToast(error.message || 'Error al crear el vehículo', 'error');
      }
      throw error; // Re-throw to prevent modal from closing
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update vehicle
  const handleUpdateVehicle = async (vehicleData: VehicleFormDataType) => {
    if (!editingVehicle) return;

    try {
      setIsSubmitting(true);
      
      await api(`/vehicles/${editingVehicle.id}`, {
        method: 'PATCH',
        body: JSON.stringify(vehicleData)
      });

      addToast('Vehículo actualizado exitosamente', 'success');
      await Promise.all([
        fetchAllVehicles(),
        fetchUnassignedVehicles(unassignedCurrentPage),
        fetchAssignedVehicles(assignedCurrentPage)
      ]);
    } catch (error: any) {
      console.error('Error updating vehicle:', error);
      
      if (error.status === 403) {
        addToast('No tienes permisos para actualizar vehículos', 'error');
      } else if (error.status === 401) {
        navigate('/auth/login');
        return;
      } else {
        addToast(error.message || 'Error al actualizar el vehículo', 'error');
      }
      throw error; // Re-throw to prevent modal from closing
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit vehicle
  const handleEditVehicle = (vehicle: VehicleWithDriver) => {
    setEditingVehicle(vehicle);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
  };

  // Handle form submit
  const handleFormSubmit = async (vehicleData: VehicleFormDataType) => {
    if (editingVehicle) {
      await handleUpdateVehicle(vehicleData);
    } else {
      await handleCreateVehicle(vehicleData);
    }
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
    fetchDrivers();
    fetchAllVehicles();
    fetchUnassignedVehicles();
    fetchAssignedVehicles();
  }, []);

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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Gestión de Vehículos
          </h1>
          <p className="text-slate-400">Administra y asigna vehículos a conductores del sistema</p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="fuel-button flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Vehículo
        </button>
      </div>

      {/* Estadísticas */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{inUseCount}</div>
                <div className="text-sm text-slate-400">En Uso</div>
              </div>
            </div>
          </div>

          <div className="fuel-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-600/20 border border-red-600/30">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{maintenanceCount + outOfServiceCount}</div>
                <div className="text-sm text-slate-400">Mantenimiento</div>
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
                        onEdit={handleEditVehicle}
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
                      actionLabel="Crear Nuevo Vehículo"
                      onAction={() => setIsModalOpen(true)}
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
                        onEdit={handleEditVehicle}
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

      {/* Modal */}
      <VehicleFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleFormSubmit}
        vehicle={editingVehicle}
        isLoading={isSubmitting}
        drivers={drivers.map(d => ({
          id: d.id,
          full_name: d.full_name,
          license_number: d.license_number
        }))}
      />
    </div>
  );
};

export default AdminVehicles;
