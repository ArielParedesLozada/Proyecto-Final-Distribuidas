import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { Driver } from '../../../types/driver';

interface DriverFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (driverData: DriverFormData) => Promise<void>;
  driver?: Driver | null;
  isLoading?: boolean;
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
  isLoading = false
}) => {
  const [formData, setFormData] = useState<DriverFormData>({
    user_id: '',
    full_name: '',
    license_number: '',
    capabilities: 1,
    availability: 1
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or driver changes
  useEffect(() => {
    if (isOpen) {
      if (driver) {
        setFormData({
          user_id: driver.user_id,
          full_name: driver.full_name,
          license_number: driver.license_number,
          capabilities: driver.capabilities,
          availability: driver.availability
        });
      } else {
        setFormData({
          user_id: '',
          full_name: '',
          license_number: '',
          capabilities: 1,
          availability: 1
        });
      }
      setErrors({});
    }
  }, [isOpen, driver]);

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            {driver ? 'Editar Conductor' : 'Nuevo Conductor'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* User ID */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              ID de Usuario *
            </label>
            <input
              type="text"
              value={formData.user_id}
              onChange={(e) => handleInputChange('user_id', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ingresa el ID del usuario"
              disabled={isLoading}
            />
            {errors.user_id && (
              <p className="mt-1 text-sm text-red-400">{errors.user_id}</p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ingresa el nombre completo"
              disabled={isLoading}
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-400">{errors.full_name}</p>
            )}
          </div>

          {/* License Number */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Número de Licencia *
            </label>
            <input
              type="text"
              value={formData.license_number}
              onChange={(e) => handleInputChange('license_number', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ingresa el número de licencia"
              disabled={isLoading}
            />
            {errors.license_number && (
              <p className="mt-1 text-sm text-red-400">{errors.license_number}</p>
            )}
          </div>

          {/* Capabilities */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Capacidad *
            </label>
            <select
              value={formData.capabilities}
              onChange={(e) => handleInputChange('capabilities', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Disponibilidad *
            </label>
            <select
              value={formData.availability}
              onChange={(e) => handleInputChange('availability', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {driver ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DriverFormModal;
