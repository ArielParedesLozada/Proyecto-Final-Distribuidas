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
    capabilities: 0, // 0 = Sin seleccionar
    availability: 1 // 1 = Disponible por defecto
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
          capabilities: 0, // Sin seleccionar
          availability: 1  // Siempre Disponible por defecto
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
          capabilities: 0, // Sin seleccionar
          availability: 1  // Siempre Disponible por defecto
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
    // Solo considerar cambios en disponibilidad para conductores existentes
    return (
      formData.availability !== originalData.availability
    );
  };

  // Función para verificar si el formulario es válido (todos los campos llenos)
  const isFormValid = (): boolean => {
    const baseValidation = (
      formData.user_id.trim() !== '' &&
      formData.full_name.trim().length >= 3 &&
      formData.license_number.trim().length === 12 &&
      /^\d{12}$/.test(formData.license_number.trim())
    );
    
    // Para perfiles incompletos, solo validar capacidad (disponibilidad siempre es 1)
    if (!driver) {
      return baseValidation && formData.capabilities > 0;
    }
    
    // Para perfiles completos (edición), no validar capacidad ni disponibilidad como requeridas
    return baseValidation;
  };

  // Función específica para determinar si el botón debe estar habilitado
  const isButtonEnabled = (): boolean => {
    if (isLoading) return false;
    
    if (driver) {
      // Para perfiles completos (edición): habilitar solo si hay cambios
      return hasChanges();
    } else {
      // Para perfiles incompletos: habilitar solo si todos los campos están llenos
      return isFormValid();
    }
  };

  // Función para obtener el mensaje del tooltip
  const getButtonTooltip = (): string => {
    if (isLoading) return '';
    
    if (driver) {
      // Para perfiles completos
      return !hasChanges() ? 'No hay cambios para guardar' : '';
    } else {
      // Para perfiles incompletos
      if (isFormValid()) return '';
      
      // Determinar qué campo específico falta
      if (!formData.user_id) return 'Seleccione un usuario';
      if (!formData.full_name || formData.full_name.length < 3) return 'Complete el nombre (mínimo 3 caracteres)';
      if (!formData.license_number || formData.license_number.length !== 12) return 'El número de licencia debe tener 12 dígitos';
      if (formData.capabilities === 0) return 'Seleccione una capacidad';
      return 'Complete todos los campos requeridos';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Solo validar campos editables según el contexto
    if (!driver) {
      // Para nuevos conductores, validar todos los campos
      if (!formData.full_name || formData.full_name.trim().length < 3) {
        newErrors.full_name = 'El nombre completo debe tener al menos 3 caracteres';
      }

      if (!formData.license_number || formData.license_number.trim().length === 0) {
        newErrors.license_number = 'El número de licencia es requerido';
      } else if (!/^\d{12}$/.test(formData.license_number.trim())) {
        newErrors.license_number = 'El número de licencia debe tener exactamente 12 dígitos';
      }

      if (!formData.user_id || formData.user_id.trim().length === 0) {
        newErrors.user_id = 'El ID de usuario es requerido';
      }

      if (![1, 2, 3].includes(formData.capabilities)) {
        newErrors.capabilities = 'La capacidad debe ser válida';
      }

      if (formData.availability !== 1) {
        newErrors.availability = 'Los nuevos conductores siempre inician como Disponibles';
      }
    } else {
      // Para conductores existentes, solo validar disponibilidad (1 o 3)
      if (![1, 3].includes(formData.availability)) {
        newErrors.availability = 'La disponibilidad debe ser válida';
      }
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
    // Validación especial para número de licencia
    if (field === 'license_number' && typeof value === 'string') {
      // Solo permitir números y máximo 12 dígitos
      const numericValue = value.replace(/\D/g, '').slice(0, 12);
      setFormData(prev => ({ ...prev, [field]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
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
    <>
      <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/30 backdrop-blur-sm z-40" style={{ left: '250px' }}></div>
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-md flex flex-col p-6 relative rounded-2xl shadow-xl bg-[#0b1a2f] border border-slate-800 text-white">
          {/* Cerrar */}
          <button
            className="absolute right-4 top-4 text-slate-400 hover:text-white"
            onClick={onClose}
            aria-label="Cerrar"
            title="Cerrar"
            disabled={isLoading}
          >
            ✕
          </button>

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
                Seleccionar Usuario CONDUCTOR para Completar Perfil
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
              Nombre Completo
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              className={`fuel-input ${driver ? 'opacity-60 cursor-not-allowed' : ''}`}
              placeholder="Ingresa el nombre completo"
              disabled={isLoading || (!!selectedUser && !driver) || !!driver}
            />
          </div>

          {/* License Number */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Número de Licencia
            </label>
            <input
              type="text"
              value={formData.license_number}
              onChange={(e) => handleInputChange('license_number', e.target.value)}
              className={`fuel-input ${driver ? 'opacity-60 cursor-not-allowed' : ''}`}
              placeholder="123456789012 (12 dígitos)"
              disabled={isLoading || !!driver}
              maxLength={12}
            />
          </div>

          {/* Capabilities */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Capacidad
            </label>
            <div className="relative">
              <select
                value={formData.capabilities}
                onChange={(e) => handleInputChange('capabilities', parseInt(e.target.value))}
                className={`fuel-input ${driver ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={isLoading || !!driver}
              >
                {!driver && (
                  <option value={0}>Seleccione una capacidad...</option>
                )}
                <option value={1}>Liviana</option>
                <option value={2}>Pesada</option>
                <option value={3}>Ambas</option>
              </select>
            </div>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Disponibilidad
            </label>
            <div className="relative">
              <select
                value={formData.availability}
                onChange={(e) => handleInputChange('availability', parseInt(e.target.value))}
                className={`fuel-input ${!driver ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={isLoading || !driver}
              >
                <option value={1}>Disponible</option>
                {driver && (
                  <option value={3}>Fuera de servicio</option>
                )}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 mt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="fuel-button-secondary flex-1 py-3"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`fuel-button flex-1 py-3 ${
                !isButtonEnabled() 
                  ? 'opacity-50 cursor-not-allowed hover:shadow-none' 
                  : ''
              }`}
              disabled={!isButtonEnabled()}
              title={getButtonTooltip()}
            >
              {isLoading ? (driver ? 'Actualizando...' : 'Completando...') : (driver ? 'Actualizar' : 'Completar Perfil')}
            </button>
          </div>
        </form>
        </div>
      </div>
    </>
  );
};

export default DriverFormModal;
