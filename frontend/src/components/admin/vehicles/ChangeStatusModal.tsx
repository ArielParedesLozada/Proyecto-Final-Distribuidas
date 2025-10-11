import React, { useState, useEffect } from 'react';
import { Settings, AlertCircle } from 'lucide-react';
import { VEHICLE_STATUS, VEHICLE_STATUS_LABELS } from '../../../utils/constants';

interface ChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (status: number) => Promise<void>;
  vehiclePlate: string;
  currentStatus: number;
  hasDriver: boolean;
  isLoading?: boolean;
}

const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  vehiclePlate,
  currentStatus,
  hasDriver,
  isLoading = false
}) => {
  const [selectedStatus, setSelectedStatus] = useState<number>(currentStatus);
  
  // Actualizar selectedStatus cuando cambie currentStatus o isOpen
  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(currentStatus);
    }
  }, [currentStatus, isOpen]);

  const statusOptions = [
    { value: VEHICLE_STATUS.AVAILABLE, label: VEHICLE_STATUS_LABELS[VEHICLE_STATUS.AVAILABLE] },
    { value: VEHICLE_STATUS.OCCUPIED, label: VEHICLE_STATUS_LABELS[VEHICLE_STATUS.OCCUPIED] }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await onSubmit(selectedStatus);
      onClose();
    } catch (error) {
      // Error is handled by parent component
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
            <div className="p-2 rounded-lg bg-orange-600/20 border border-orange-600/30">
              <Settings className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Cambiar Estado</h2>
              <p className="text-sm text-slate-400">Vehículo: {vehiclePlate}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Estado del Vehículo
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(parseInt(e.target.value))}
                className="fuel-input"
                required
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {hasDriver && selectedStatus === VEHICLE_STATUS.AVAILABLE && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-200">
                    <p className="font-medium mb-1">Vehículo con conductor asignado</p>
                    <p>Al cambiar a "Disponible", el conductor será desasignado automáticamente.</p>
                  </div>
                </div>
              </div>
            )}

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
                  (isLoading || selectedStatus === currentStatus) 
                    ? 'opacity-50 cursor-not-allowed hover:shadow-none' 
                    : ''
                }`}
                disabled={isLoading || selectedStatus === currentStatus}
                title={selectedStatus === currentStatus ? 'Seleccione un estado diferente' : 'Actualizar estado del vehículo'}
              >
                {isLoading ? 'Actualizando...' : 'Actualizar Estado'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ChangeStatusModal;

