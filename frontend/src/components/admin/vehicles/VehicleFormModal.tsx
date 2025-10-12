import React, { useState, useEffect } from 'react';
import { Car, AlertCircle } from 'lucide-react';
import type { Vehicle } from '../../../types/vehicle';
// Interface local para el formulario
interface DriverForm {
  id: string;
  full_name: string;
  license_number: string;
}

export interface VehicleFormData {
  plate: string;
  type: string;
  brand: string;
  model: string;
  year: number;
  capacity_liters: number;
  odometer_km: number;
  status: number;
  driver_id?: string;
}

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VehicleFormData) => Promise<void>;
  vehicle?: Vehicle | null;
  isLoading?: boolean;
  drivers?: DriverForm[];
}

const VehicleFormModal: React.FC<VehicleFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  vehicle,
  isLoading = false,
  drivers = []
}) => {
  const [formData, setFormData] = useState<VehicleFormData>({
    plate: '',
    type: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    capacity_liters: 0,
    odometer_km: 0,
    status: 1, // Siempre Disponible por defecto (1=DISPONIBLE, 2=OCUPADO)
    driver_id: ''
  });

  const [errors, setErrors] = useState<Record<string, string | number>>({});

  // Vehicle types
  const vehicleTypes = [
    { value: 'camioneta', label: 'Camioneta' },
    { value: 'camión', label: 'Camión' },
    { value: 'automóvil', label: 'Automóvil' },
    { value: 'moto', label: 'Motocicleta' },
    { value: 'bus', label: 'Bus' }
  ];

  // Vehicle brands
  const vehicleBrands = [
    'Toyota', 'Nissan', 'Ford', 'Chevrolet', 'Volkswagen', 'Hyundai', 'Kia',
    'Mazda', 'Honda', 'Mitsubishi', 'Subaru', 'Isuzu', 'Mercedes-Benz',
    'BMW', 'Audi', 'Volvo', 'Scania', 'MAN', 'Iveco'
  ];


  // Initialize form data when modal opens or vehicle changes
  useEffect(() => {
    if (isOpen) {
      if (vehicle) {
        setFormData({
          plate: vehicle.plate,
          type: vehicle.type,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          capacity_liters: vehicle.capacity_liters,
          odometer_km: vehicle.odometer_km,
          status: vehicle.status,
          driver_id: vehicle.driver_id || ''
        });
      } else {
        setFormData({
          plate: '',
          type: '',
          brand: '',
          model: '',
          year: new Date().getFullYear(),
          capacity_liters: 0,
          odometer_km: 0,
          status: 1, // Siempre Disponible por defecto (1=DISPONIBLE, 2=OCUPADO)
          driver_id: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, vehicle]);

  // Función para verificar si el formulario está completo (para habilitar botón)
  const isFormComplete = (): boolean => {
    return (
      formData.plate.trim() !== '' &&
      formData.type.trim() !== '' &&
      formData.brand.trim() !== '' &&
      formData.model.trim() !== '' &&
      formData.year >= 1900 &&
      formData.year <= new Date().getFullYear() + 1 &&
      formData.capacity_liters > 0 &&
      formData.odometer_km >= 0
    );
  };

  // Función para obtener el mensaje del tooltip
  const getButtonTooltip = (): string => {
    if (isLoading) return '';
    
    if (isFormComplete()) return vehicle ? 'Actualizar vehículo' : 'Crear vehículo';
    
    // Determinar qué campo específico falta
    if (!formData.plate.trim()) return 'Complete la placa';
    if (!formData.type.trim()) return 'Seleccione un tipo de vehículo';
    if (!formData.brand.trim()) return 'Seleccione una marca';
    if (!formData.model.trim()) return 'Complete el modelo';
    if (formData.year < 1900 || formData.year > new Date().getFullYear() + 1) return 'Ingrese un año válido';
    if (formData.capacity_liters <= 0) return 'Ingrese una capacidad mayor a 0';
    if (formData.odometer_km < 0) return 'El odómetro no puede ser negativo';
    
    return 'Complete todos los campos requeridos';
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string | number> = {};

    if (!formData.plate.trim()) {
      newErrors.plate = 'La placa es requerida';
    } else if (!/^[A-Z]{3}-\d{4}$/i.test(formData.plate)) {
      newErrors.plate = 'Formato de placa inválido (ej: ABC-1234)';
    }

    if (!formData.type.trim()) {
      newErrors.type = 'El tipo de vehículo es requerido';
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'La marca es requerida';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'El modelo es requerido';
    }

    if (formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'Año inválido';
    }

    if (formData.capacity_liters <= 0) {
      newErrors.capacity_liters = 'La capacidad debe ser mayor a 0';
    }

    if (formData.odometer_km < 0) {
      newErrors.odometer_km = 'El odómetro no puede ser negativo';
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
      // Error is handled by parent component
    }
  };

  const handleInputChange = (field: keyof VehicleFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Función especial para manejar el input de la placa
  const handlePlateChange = (value: string) => {
    let formattedValue = '';
    
    // Si el valor incluye un guión, separar en letras y números
    if (value.includes('-')) {
      const parts = value.split('-');
      const letters = parts[0] || '';
      const numbers = parts[1] || '';
      
      // Procesar letras (solo permitir letras, máximo 3)
      const validLetters = letters.replace(/[^A-Za-z]/g, '').toUpperCase().substring(0, 3);
      
      // Procesar números (solo permitir números, máximo 4)
      const validNumbers = numbers.replace(/[^0-9]/g, '').substring(0, 4);
      
      // Construir el valor formateado
      formattedValue = validLetters;
      if (validNumbers.length > 0) {
        formattedValue += '-' + validNumbers;
      }
    } else {
      // Si no hay guión, verificar si son letras o números
      const currentLength = value.length;
      
      if (currentLength <= 3) {
        // Primeros 3 caracteres: solo letras
        formattedValue = value.replace(/[^A-Za-z]/g, '').toUpperCase();
      } else {
        // Más de 3 caracteres: separar letras y números
        const letters = value.substring(0, 3).replace(/[^A-Za-z]/g, '').toUpperCase();
        const numbers = value.substring(3).replace(/[^0-9]/g, '').substring(0, 4);
        
        formattedValue = letters;
        if (numbers.length > 0) {
          formattedValue += '-' + numbers;
        }
      }
    }
    
    // Actualizar el estado solo si el valor es válido
    setFormData(prev => ({ ...prev, plate: formattedValue }));
    
    // Clear error when user starts typing
    if (errors.plate) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.plate;
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/30 backdrop-blur-sm z-40" style={{ left: '250px' }}></div>
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-2xl max-h-[80vh] flex flex-col p-6 relative rounded-2xl shadow-xl bg-[#0b1a2f] border border-slate-800 text-white">
          {/* Cerrar */}
          <button
            className="absolute right-4 top-4 text-slate-400 hover:text-white"
            onClick={onClose}
            aria-label="Cerrar"
            title="Cerrar"
          >
            ✕
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
              <Car className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              {vehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Placa */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Placa</label>
                <input
                  type="text"
                  value={formData.plate}
                  onChange={(e) => handlePlateChange(e.target.value)}
                  className="fuel-input"
                  placeholder="ABC-1234"
                  maxLength={8}
                  required
                />
                {errors.plate && (
                  <div className="flex items-center gap-1 text-red-400 text-xs mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.plate}
                  </div>
                )}
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Tipo de Vehículo</label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="fuel-input"
                  required
                >
                  <option value="">Seleccione un tipo...</option>
                  {vehicleTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.type && (
                  <div className="flex items-center gap-1 text-red-400 text-xs mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.type}
                  </div>
                )}
              </div>

              {/* Marca */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Marca</label>
                <select
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  className="fuel-input"
                  required
                >
                  <option value="">Seleccione una marca...</option>
                  {vehicleBrands.map(brand => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
                {errors.brand && (
                  <div className="flex items-center gap-1 text-red-400 text-xs mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.brand}
                  </div>
                )}
              </div>

              {/* Modelo */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Modelo</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  className="fuel-input"
                  placeholder="Ej: Hilux, Frontier, Ranger"
                  required
                />
                {errors.model && (
                  <div className="flex items-center gap-1 text-red-400 text-xs mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.model}
                  </div>
                )}
              </div>

              {/* Año */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Año</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', parseInt(e.target.value) || 0)}
                  className="fuel-input"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  required
                />
                {errors.year && (
                  <div className="flex items-center gap-1 text-red-400 text-xs mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {typeof errors.year === 'string' ? errors.year : 'Año inválido'}
                  </div>
                )}
              </div>

              {/* Capacidad */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Capacidad del Tanque (L)</label>
                <input
                  type="number"
                  value={formData.capacity_liters}
                  onChange={(e) => handleInputChange('capacity_liters', parseFloat(e.target.value) || 0)}
                  className="fuel-input"
                  min="0"
                  step="0.1"
                  placeholder="65.0"
                  required
                />
                {errors.capacity_liters && (
                  <div className="flex items-center gap-1 text-red-400 text-xs mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {typeof errors.capacity_liters === 'string' ? errors.capacity_liters : 'Capacidad inválida'}
                  </div>
                )}
              </div>

              {/* Odómetro */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Odómetro (km)</label>
                <input
                  type="number"
                  value={formData.odometer_km}
                  onChange={(e) => handleInputChange('odometer_km', parseInt(e.target.value) || 0)}
                  className="fuel-input"
                  min="0"
                  placeholder="15000"
                  required
                />
                {errors.odometer_km && (
                  <div className="flex items-center gap-1 text-red-400 text-xs mt-1">
                    <AlertCircle className="w-3 h-3" />
                    {typeof errors.odometer_km === 'string' ? errors.odometer_km : 'Odómetro inválido'}
                  </div>
                )}
              </div>

              {/* Conductor Asignado */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Conductor Asignado</label>
                <select
                  value={formData.driver_id || ''}
                  onChange={(e) => handleInputChange('driver_id', e.target.value || '')}
                  className="fuel-input"
                >
                  <option value="">Seleccione un conductor...</option>
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>
                      {driver.full_name} ({driver.license_number})
                    </option>
                  ))}
                </select>
              </div>
            </div>

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
                  (isLoading || !isFormComplete()) 
                    ? 'opacity-50 cursor-not-allowed hover:shadow-none' 
                    : ''
                }`}
                disabled={isLoading || !isFormComplete()}
                title={getButtonTooltip()}
              >
                {isLoading ? 'Guardando...' : (vehicle ? 'Actualizar Vehículo' : 'Crear Vehículo')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export { VehicleFormModal };
export default VehicleFormModal;
