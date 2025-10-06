import React, { useState, useEffect } from 'react';
import { User, Mail, Edit3, UserPlus } from 'lucide-react';
import type { Driver } from '../../../types/driver';

interface User {
  id: string;
  email: string;
  nombre: string;
  roles: 'ADMIN' | 'CONDUCTOR' | 'SUPERVISOR';
}

interface DriverFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (driverData: DriverFormData) => Promise<void>;
  driver?: Driver | null;
  isLoading?: boolean;
  users?: User[];
  preSelectedUser?: User | null;
}

export interface DriverFormData {
  user_id: string;
  full_name: string;
  license_number: string;
  capabilities: number;
  availability: number;
}

const DriverFormModal: React.FC<DriverFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  driver,
  isLoading = false,
  users = [],
  preSelectedUser = null
}) => {
  const [formData, setFormData] = useState<DriverFormData>({
    user_id: '',
    full_name: '',
    license_number: '',
    capabilities: 1,
    availability: 1
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [originalData, setOriginalData] = useState<DriverFormData | null>(null);

  // Reset form when modal opens/closes or driver changes
  useEffect(() => {
    if (isOpen) {
      if (driver) {
        // Editing existing driver
        setSelectedUser(preSelectedUser || null);
        const driverData = {
          user_id: driver.user_id,
          full_name: driver.full_name,
          license_number: driver.license_number,
          capabilities: driver.capabilities,
          availability: driver.availability
        };
        setFormData(driverData);
        setOriginalData(driverData); // Guardar datos originales
      } else if (preSelectedUser) {
        // Creating new driver with pre-selected user
        setSelectedUser(preSelectedUser);
        const newDriverData = {
          user_id: preSelectedUser.id,
          full_name: preSelectedUser.nombre,
          license_number: '',
          capabilities: 1,
          availability: 1
        };
        setFormData(newDriverData);
        setOriginalData(null); // No hay datos originales para nuevo conductor
      } else {
        // Creating new driver without pre-selection
        setSelectedUser(null);
        const emptyData = {
          user_id: '',
          full_name: '',
          license_number: '',
          capabilities: 1,
          availability: 1
        };
        setFormData(emptyData);
        setOriginalData(null); // No hay datos originales para nuevo conductor
      }
      setErrors({});
    }
  }, [isOpen, driver, users, preSelectedUser]);

  // Función para detectar si hay cambios
  const hasChanges = (): boolean => {
    if (!originalData) return true; // Si no hay datos originales, es un nuevo conductor
    return (
      formData.full_name !== originalData.full_name ||
      formData.license_number !== originalData.license_number ||
      formData.capabilities !== originalData.capabilities ||
      formData.availability !== originalData.availability
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name || formData.full_name.trim().length < 3) {
      newErrors.full_name = 'El nombre completo debe tener al menos 3 caracteres';
    }

    if (!formData.license_number || formData.license_number.trim().length === 0) {
      newErrors.license_number = 'El número de licencia es requerido';
    }

    if (!formData.user_id || formData.user_id.trim().length === 0) {
      newErrors.user_id = 'El ID de usuario es requerido';
    }

    if (![1, 2, 3].includes(formData.capabilities)) {
      newErrors.capabilities = 'La capacidad debe ser válida';
    }

    if (![1, 2, 3].includes(formData.availability)) {
      newErrors.availability = 'La disponibilidad debe ser válida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setFormData(prev => ({
        ...prev,
        user_id: user.id,
        full_name: user.nombre
      }));
    }
  };

  const handleInputChange = (field: keyof DriverFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="fuel-card p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
            {driver ? <Edit3 className="w-6 h-6 text-blue-400" /> : <UserPlus className="w-6 h-6 text-blue-400" />}
          </div>
          <h2 className="text-xl font-semibold text-white">
            {driver ? 'Editar Perfil de Conductor' : 'Completar Perfil de Conductor'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Selection - Solo mostrar si no hay usuario pre-seleccionado */}
          {!driver && !preSelectedUser && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Seleccionar Usuario CONDUCTOR para Completar Perfil *
              </label>
              <select
                value={formData.user_id}
                onChange={(e) => handleUserSelect(e.target.value)}
                className="fuel-input"
                disabled={isLoading}
              >
                <option value="">Selecciona un usuario conductor para completar su perfil</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nombre} ({user.email})
                  </option>
                ))}
              </select>
              {errors.user_id && (
                <p className="mt-1 text-sm text-red-400">{errors.user_id}</p>
              )}
            </div>
          )}

          {/* Selected User Info - Mostrar siempre que haya usuario seleccionado */}
          {selectedUser && (
            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="font-medium text-white">{selectedUser.nombre}</div>
                  <div className="text-sm text-slate-400 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {selectedUser.email}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              className="fuel-input"
              placeholder="Ingresa el nombre completo"
              disabled={isLoading || (!!selectedUser && !driver)}
            />
            {selectedUser && !driver && (
              <p className="mt-1 text-sm text-blue-400">
                Se llenó automáticamente con el nombre del usuario seleccionado
              </p>
            )}
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-400">{errors.full_name}</p>
            )}
          </div>

          {/* License Number */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Número de Licencia *
            </label>
            <input
              type="text"
              value={formData.license_number}
              onChange={(e) => handleInputChange('license_number', e.target.value)}
              className="fuel-input"
              placeholder="Ingresa el número de licencia"
              disabled={isLoading}
            />
            {errors.license_number && (
              <p className="mt-1 text-sm text-red-400">{errors.license_number}</p>
            )}
          </div>

          {/* Capabilities */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Capacidad *
            </label>
            <select
              value={formData.capabilities}
              onChange={(e) => handleInputChange('capabilities', parseInt(e.target.value))}
              className="fuel-input"
              disabled={isLoading}
            >
              <option value={1}>Liviana</option>
              <option value={2}>Pesada</option>
              <option value={3}>Ambas</option>
            </select>
            {errors.capabilities && (
              <p className="mt-1 text-sm text-red-400">{errors.capabilities}</p>
            )}
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Disponibilidad *
            </label>
            <select
              value={formData.availability}
              onChange={(e) => handleInputChange('availability', parseInt(e.target.value))}
              className="fuel-input"
              disabled={isLoading}
            >
              <option value={1}>Disponible</option>
              <option value={2}>Ocupado</option>
              <option value={3}>Fuera de servicio</option>
            </select>
            {errors.availability && (
              <p className="mt-1 text-sm text-red-400">{errors.availability}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="fuel-button-secondary flex-1"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="fuel-button flex-1"
              disabled={isLoading || (!!driver && !hasChanges())}
            >
              {isLoading ? (driver ? 'Actualizando...' : 'Completando...') : (driver ? 'Actualizar' : 'Completar Perfil')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DriverFormModal;
