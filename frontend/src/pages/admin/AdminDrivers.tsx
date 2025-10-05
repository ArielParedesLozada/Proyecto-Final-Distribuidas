import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../api/api';
import type { Driver, DriversListResponse } from '../../types/driver';
import { useToast } from '../../shared/ToastNotification';
import { DriverTable, DriverFormModal } from '../../components/admin/drivers';
import type { DriverFormData } from '../../components/admin/drivers';
import NotAuthorized from '../NotAuthorized';


const AdminDrivers: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { addToast } = useToast();

  // State
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // Check admin role
  if (!hasRole('ADMIN')) {
    return <NotAuthorized />;
  }

  // Fetch drivers
  const fetchDrivers = async (page: number = currentPage) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api<DriversListResponse>(`/drivers?page=${page}&page_size=${pageSize}`);
      
      setDrivers(response.drivers);
      setTotalCount(response.total_count);
      setTotalPages(response.total_pages);
      setCurrentPage(response.page);
    } catch (error: any) {
      console.error('Error fetching drivers:', error);
      
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
      
      await api('/drivers', {
        method: 'POST',
        body: JSON.stringify(driverData)
      });

      addToast('Conductor creado exitosamente', 'success');
      await fetchDrivers(currentPage);
    } catch (error: any) {
      console.error('Error creating driver:', error);
      
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
    setEditingDriver(driver);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingDriver(null);
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

  // Handle pagination
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      fetchDrivers(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchDrivers(currentPage + 1);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDrivers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Conductores</h1>
          <p className="text-slate-400 mt-1">
            Gestiona los conductores del sistema
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="fuel-button flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Conductor
        </button>
      </div>

      {/* Stats */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl font-bold text-white">{totalCount}</div>
            <div className="text-slate-400">Total Conductores</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl font-bold text-white">
              {drivers.filter(d => d.availability === 1).length}
            </div>
            <div className="text-slate-400">Disponibles</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl font-bold text-white">
              {drivers.filter(d => d.availability === 2).length}
            </div>
            <div className="text-slate-400">Ocupados</div>
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

      {/* Table */}
      {!error && (
        <div className="bg-slate-800/50 rounded-lg border border-slate-700">
          <DriverTable
            drivers={drivers}
            isLoading={isLoading}
            onEdit={handleEditDriver}
          />
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-slate-400 text-sm">
            Página {currentPage} de {totalPages} ({totalCount} conductores)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      <DriverFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleFormSubmit}
        driver={editingDriver}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default AdminDrivers;
