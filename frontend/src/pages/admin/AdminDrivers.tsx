import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, AlertCircle, Users, Car, User, Clock, CheckCircle } from 'lucide-react';
import { api } from '../../api/api';
import type { Driver, DriversListResponse } from '../../types/driver';
import { useToast } from '../../shared/ToastNotification';
import { DriverTable, DriverFormModal } from '../../components/admin/drivers';
import type { DriverFormData } from '../../components/admin/drivers';
import EmptyState from '../../shared/EmptyState';
import UserTable from '../../shared/UserTable';
import Tabs from '../../shared/Tabs';
import Pagination from '../../shared/Pagination';

interface User {
  id: string;
  email: string;
  nombre: string;
  roles: 'ADMIN' | 'CONDUCTOR' | 'SUPERVISOR';
}


const AdminDrivers: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  // State
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'incomplete' | 'complete'>('incomplete');

  // Pagination state for incomplete profiles
  const [incompleteCurrentPage, setIncompleteCurrentPage] = useState(1);
  const [incompleteTotalPages, setIncompleteTotalPages] = useState(1);
  const [incompleteTotalCount, setIncompleteTotalCount] = useState(0);
  const [incompleteUsers, setIncompleteUsers] = useState<User[]>([]);
  const incompletePageSize = 5;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 5;

  // Role check is handled by ProtectedRoute in App.tsx

  // Calculate statistics
  const incompleteCount = incompleteTotalCount;
  const completeCount = totalCount;
  const availableCount = drivers.filter(d => d.availability === 1).length;

  // Tab configuration
  const tabs = [
    {
      id: 'incomplete',
      label: 'Perfiles Incompletos',
      count: incompleteCount,
      icon: <Clock className="w-4 h-4" />,
      badge: incompleteCount > 0 ? 'Pendientes' : undefined,
      badgeColor: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
    },
    {
      id: 'complete',
      label: 'Perfiles Completos',
      count: completeCount,
      icon: <CheckCircle className="w-4 h-4" />,
      badge: availableCount > 0 ? `${availableCount} Disponibles` : undefined,
      badgeColor: 'bg-green-500/20 text-green-400 border border-green-500/30'
    }
  ];

  // Fetch users with CONDUCTOR role
  const fetchConductorUsers = async () => {
    try {
      console.log('🔄 Cargando usuarios CONDUCTOR...');
      const response = await api<{ users: User[] }>('/admin/users');
      console.log('📊 Usuarios recibidos:', response.users);
      const conductorUsers = response.users.filter(user => user.roles === 'CONDUCTOR');
      console.log('👥 Usuarios CONDUCTOR filtrados:', conductorUsers);
      setUsers(conductorUsers);
    } catch (error: any) {
      console.error('❌ Error fetching conductor users:', error);
      addToast('Error al cargar usuarios conductores', 'error');
    }
  };

  // Fetch incomplete users with pagination
  const fetchIncompleteUsers = async (page: number = incompleteCurrentPage) => {
    try {
      setIsLoading(true);
      console.log('🔄 Cargando usuarios incompletos página:', page);
      
      // Get all users first
      const response = await api<{ users: User[] }>('/admin/users');
      const conductorUsers = response.users.filter(user => user.roles === 'CONDUCTOR');
      
      // Filter users without complete profiles
      const incompleteUsersList = conductorUsers.filter(user => 
        !drivers.some(driver => driver.user_id === user.id)
      );
      
      // Calculate pagination
      const totalCount = incompleteUsersList.length;
      const totalPages = Math.ceil(totalCount / incompletePageSize);
      const startIndex = (page - 1) * incompletePageSize;
      const endIndex = startIndex + incompletePageSize;
      const paginatedUsers = incompleteUsersList.slice(startIndex, endIndex);
      
      setIncompleteUsers(paginatedUsers);
      setIncompleteTotalCount(totalCount);
      setIncompleteTotalPages(totalPages);
      setIncompleteCurrentPage(page);
      
      console.log('👥 Usuarios incompletos cargados:', {
        page,
        totalCount,
        totalPages,
        users: paginatedUsers.length
      });
    } catch (error: any) {
      console.error('❌ Error fetching incomplete users:', error);
      addToast('Error al cargar usuarios incompletos', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch drivers
  const fetchDrivers = async (page: number = currentPage) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Cargando conductores...');

      const response = await api<DriversListResponse>(`/drivers?page=${page}&page_size=${pageSize}`);
      console.log('🚗 Conductores recibidos:', response);
      
      setDrivers(response.drivers);
      setTotalCount(response.total_count);
      setTotalPages(response.total_pages);
      setCurrentPage(response.page);
    } catch (error: any) {
      console.error('❌ Error fetching drivers:', error);
      
      if (error.status === 403) {
        setError('No tienes permisos para acceder a esta información');
      } else if (error.status === 401) {
        navigate('/auth/login');
        return;
      } else {
        setError(error.message || 'Error al cargar los conductores');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle create driver
  const handleCreateDriver = async (driverData: DriverFormData) => {
    try {
      setIsSubmitting(true);
      console.log('🔄 Creando conductor:', driverData);
      
      const response = await api('/drivers', {
        method: 'POST',
        body: JSON.stringify(driverData)
      });
      console.log('✅ Conductor creado exitosamente:', response);

      addToast('Conductor creado exitosamente', 'success');
      await fetchDrivers(currentPage);
    } catch (error: any) {
      console.error('❌ Error creating driver:', error);
      
      if (error.status === 403) {
        addToast('No tienes permisos para crear conductores', 'error');
      } else if (error.status === 401) {
        navigate('/auth/login');
        return;
      } else {
        addToast(error.message || 'Error al crear el conductor', 'error');
      }
      throw error; // Re-throw to prevent modal from closing
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update driver
  const handleUpdateDriver = async (driverData: DriverFormData) => {
    if (!editingDriver) return;

    try {
      setIsSubmitting(true);
      
      await api(`/drivers/${editingDriver.id}`, {
        method: 'PATCH',
        body: JSON.stringify(driverData)
      });

      addToast('Conductor actualizado exitosamente', 'success');
      await fetchDrivers(currentPage);
    } catch (error: any) {
      console.error('Error updating driver:', error);
      
      if (error.status === 403) {
        addToast('No tienes permisos para actualizar conductores', 'error');
      } else if (error.status === 401) {
        navigate('/auth/login');
        return;
      } else {
        addToast(error.message || 'Error al actualizar el conductor', 'error');
      }
      throw error; // Re-throw to prevent modal from closing
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit driver
  const handleEditDriver = (driver: Driver) => {
    // Buscar el usuario correspondiente al conductor
    const user = users.find(u => u.id === driver.user_id);
    setEditingDriver(driver);
    setSelectedUserForProfile(user || null);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingDriver(null);
    setSelectedUserForProfile(null);
  };

  // Handle form submit
  const handleFormSubmit = async (driverData: DriverFormData) => {
    if (editingDriver) {
      await handleUpdateDriver(driverData);
    } else {
      await handleCreateDriver(driverData);
    }
  };

  // Handle retry
  const handleRetry = () => {
    fetchDrivers();
  };


  // Handle pagination for incomplete profiles
  const handleIncompletePageChange = (page: number) => {
    fetchIncompleteUsers(page);
  };

  // Handle pagination for complete profiles
  const handleCompletePageChange = (page: number) => {
    fetchDrivers(page);
  };

  // Initial load
  useEffect(() => {
    fetchConductorUsers();
    fetchDrivers();
    fetchIncompleteUsers();
  }, []);

  // Refetch incomplete users when drivers change
  useEffect(() => {
    if (drivers.length > 0 || users.length > 0) {
      fetchIncompleteUsers(incompleteCurrentPage);
    }
  }, [drivers, users]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Gestión de Conductores
          </h1>
          <p className="text-slate-400">Administra y completa los perfiles de conductores del sistema</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchConductorUsers();
              fetchDrivers();
              fetchIncompleteUsers();
            }}
            className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg border border-slate-600/50 transition-colors"
            title="Actualizar datos"
          >
            <RefreshCw className="w-5 h-5 text-slate-400" />
          </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="fuel-button flex items-center gap-2"
            disabled={users.length === 0}
        >
          <Plus className="w-5 h-5" />
            {users.length === 0 ? 'No hay usuarios CONDUCTOR' : 'Completar Perfil'}
        </button>
        </div>
      </div>

      {/* Estadísticas */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="fuel-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{users.length}</div>
                <div className="text-sm text-slate-400">Usuarios CONDUCTOR</div>
              </div>
            </div>
          </div>
          
          <div className="fuel-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-600/20 border border-green-600/30">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{completeCount}</div>
                <div className="text-sm text-slate-400">Perfiles Completos</div>
              </div>
            </div>
          </div>
          
          <div className="fuel-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-600/20 border border-yellow-600/30">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{incompleteCount}</div>
                <div className="text-sm text-slate-400">Perfiles Incompletos</div>
              </div>
            </div>
          </div>
          
          <div className="fuel-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-600/20 border border-purple-600/30">
                <Car className="w-5 h-5 text-purple-400" />
            </div>
              <div>
                <div className="text-2xl font-bold text-white">{availableCount}</div>
                <div className="text-sm text-slate-400">Disponibles</div>
          </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <h3 className="text-lg font-medium text-red-400">Error</h3>
          </div>
          <p className="text-slate-300 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="fuel-button-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      )}

      {/* Tabs */}
      {!isLoading && !error && (
        <div className="space-y-6">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId as 'incomplete' | 'complete')}
          />

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'incomplete' && (
              <div className="space-y-6">
                {incompleteUsers.length > 0 ? (
                  <>
                    <div className="fuel-card p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-yellow-600/20 border border-yellow-600/30">
                          <Clock className="w-6 h-6 text-yellow-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">Perfiles Incompletos</h2>
                      </div>
                      
                      <UserTable
                        users={incompleteUsers}
                        title=""
                        showHeaderIcon={false}
                        statusFilter={() => true} // All users in this list are incomplete
                        statusLabel="Perfil Incompleto"
                        statusColor="yellow"
                        actionLabel="Completar Perfil"
                        onAction={(user) => {
                          setSelectedUserForProfile(user);
                          setEditingDriver(null);
                          setIsModalOpen(true);
                        }}
                        emptyStateTitle="¡Excelente! No hay perfiles incompletos"
                        emptyStateDescription="Todos los usuarios CONDUCTOR tienen su perfil completo"
                      />
                    </div>

                    {/* Pagination for incomplete profiles */}
                    {incompleteTotalPages > 1 && (
                      <div className="fuel-card p-6">
                        <Pagination
                          page={incompleteCurrentPage}
                          perPage={incompletePageSize}
                          total={incompleteTotalCount}
                          onPageChange={handleIncompletePageChange}
                          className="w-full"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="fuel-card p-12">
                    <EmptyState
                      icon={Users}
                      title="No hay usuarios CONDUCTOR"
                      description="Primero debes crear usuarios con rol CONDUCTOR en la sección de usuarios"
                      actionLabel="Ir a Usuarios"
                      onAction={() => {/* Navigate to users page */}}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'complete' && (
              <div className="space-y-6">
                <div className="fuel-card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-green-600/20 border border-green-600/30">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">Perfiles Completos</h2>
                  </div>
                  
                  {drivers.length > 0 ? (
                    <DriverTable
                      drivers={drivers}
                      isLoading={isLoading}
                      onEdit={handleEditDriver}
                    />
                  ) : (
                    <EmptyState
                      icon={Car}
                      title="No hay perfiles completos"
                      description="Los conductores aparecerán aquí una vez que completen su perfil"
                      actionLabel="Completar Primer Perfil"
                      onAction={() => setIsModalOpen(true)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pagination for complete profiles */}
      {!isLoading && !error && totalPages > 1 && activeTab === 'complete' && (
        <div className="fuel-card p-6">
          <Pagination
            page={currentPage}
            perPage={pageSize}
            total={totalCount}
            onPageChange={handleCompletePageChange}
            className="w-full"
          />
        </div>
      )}

      {/* Modal */}
      <DriverFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleFormSubmit}
        driver={editingDriver}
        isLoading={isSubmitting}
        users={users}
        preSelectedUser={selectedUserForProfile}
      />
    </div>
  );
};

export default AdminDrivers;
