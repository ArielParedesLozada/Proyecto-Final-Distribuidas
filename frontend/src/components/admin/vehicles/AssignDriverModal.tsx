import React, { useState } from 'react';
import { User, AlertCircle } from 'lucide-react';
// Interface local para el formulario
interface DriverForm {
  id: string;
  full_name: string;
  license_number: string;
}

interface AssignDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (driverId: string) => Promise<void>;
  vehiclePlate: string;
  isLoading?: boolean;
  drivers?: DriverForm[];
}

const AssignDriverModal: React.FC<AssignDriverModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  vehiclePlate,
  isLoading = false,
  drivers = []
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDriverId) {
      setErrors({ driver: 'Debes seleccionar un conductor' });
      return;
    }

    try {
      await onSubmit(selectedDriverId);
      onClose();
      setSelectedDriverId('');
      setErrors({});
    } catch (error) {
      // Error is handled by parent component
    }
  };

  const handleDriverChange = (driverId: string) => {
    setSelectedDriverId(driverId);
    if (errors.driver) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.driver;
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
          >
            ✕
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
              <User className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Asignar Conductor</h2>
              <p className="text-sm text-slate-400">Vehículo: {vehiclePlate}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Seleccionar Conductor
              </label>
              <select
                value={selectedDriverId}
                onChange={(e) => handleDriverChange(e.target.value)}
                className="fuel-input"
                required
              >
                <option value="">Seleccione un conductor...</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.full_name} ({driver.license_number})
                  </option>
                ))}
              </select>
              {errors.driver && (
                <div className="flex items-center gap-1 text-red-400 text-xs mt-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.driver}
                </div>
              )}
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
                  (isLoading || !selectedDriverId) 
                    ? 'opacity-50 cursor-not-allowed hover:shadow-none' 
                    : ''
                }`}
                disabled={isLoading || !selectedDriverId}
                title={!selectedDriverId ? 'Seleccione un conductor' : 'Asignar conductor al vehículo'}
              >
                {isLoading ? 'Asignando...' : 'Asignar Conductor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AssignDriverModal;
