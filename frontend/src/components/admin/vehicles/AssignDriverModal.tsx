import React, { useState, useMemo } from 'react';
import { User, AlertCircle } from 'lucide-react';
// Interface local para el formulario
interface DriverForm {
  id: string;
  full_name: string;
  license_number: string;
  capabilities?: number; // 1=Liviana, 2=Pesada, 3=Ambas
}

interface AssignDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (driverId: string) => Promise<void>;
  vehiclePlate: string;
  vehicleMachinery?: number; // 0=Liviano, 1=Pesado
  isLoading?: boolean;
  drivers?: DriverForm[];
}

const AssignDriverModal: React.FC<AssignDriverModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  vehiclePlate,
  vehicleMachinery,
  isLoading = false,
  drivers = []
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Log cuando se abre el modal
  React.useEffect(() => {
    if (isOpen) {
      console.log('📋 Modal de asignar conductor abierto:', {
        vehiclePlate,
        vehicleMachinery,
        machineryType: typeof vehicleMachinery,
        machineryValue: vehicleMachinery,
        machineryIsUndefined: vehicleMachinery === undefined,
        machineryIsNull: vehicleMachinery === null,
        machineryIsNaN: isNaN(Number(vehicleMachinery)),
        totalDrivers: drivers.length,
        drivers: drivers.map(d => ({
          id: d.id,
          name: d.full_name,
          capabilities: d.capabilities,
          capabilitiesType: typeof d.capabilities
        }))
      });
    }
  }, [isOpen, vehiclePlate, vehicleMachinery, drivers]);

  // Filtrar conductores según el tipo de maquinaria del vehículo
  // Lógica:
  // - Vehículo pesado (machinery = 1) → Solo conductores con capabilities = 2 (Pesada) o 3 (Ambas)
  // - Vehículo liviano (machinery = 0) → Solo conductores con capabilities = 1 (Liviana) o 3 (Ambas)
  // Función para convertir machinery de string a número
  const convertMachineryToNumber = (machinery: any): number | null => {
    if (machinery === undefined || machinery === null) {
      return null;
    }
    
    // Si ya es un número, retornarlo
    if (typeof machinery === 'number') {
      return isNaN(machinery) ? null : machinery;
    }
    
    // Si es string, convertir según el valor del enum
    if (typeof machinery === 'string') {
      if (machinery === 'VEHICLE_MACHINERY_TYPES_PESADO' || machinery === 'PESADO' || machinery === '1') {
        return 1;
      }
      if (machinery === 'VEHICLE_MACHINERY_TYPES_LIVIANO' || machinery === 'LIVIANO' || machinery === '0') {
        return 0;
      }
      // Intentar parsear como número
      const parsed = parseInt(machinery, 10);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    
    return null;
  };

  const availableDrivers = useMemo(() => {
    // Convertir vehicleMachinery a número si es necesario
    const machinery = convertMachineryToNumber(vehicleMachinery);

    console.log('🔍 Filtrando conductores:', {
      vehicleMachinery,
      machinery,
      machineryType: typeof vehicleMachinery,
      totalDrivers: drivers.length,
      driversWithCapabilities: drivers.map(d => ({
        id: d.id,
        name: d.full_name,
        capabilities: d.capabilities,
        capabilitiesType: typeof d.capabilities
      }))
    });

    if (machinery === null || machinery === undefined || isNaN(machinery)) {
      // Si no se especifica el tipo de maquinaria, mostrar todos los conductores
      console.log('⚠️ No se especificó tipo de maquinaria válido, mostrando todos los conductores. vehicleMachinery:', vehicleMachinery, 'machinery:', machinery);
      return drivers;
    }

    if (machinery === 1) {
      // Vehículo pesado: solo conductores con licencia pesada (2) o ambas (3)
      const filtered = drivers.filter(driver => {
        // Obtener capabilities - puede venir como capabilities o capabilities (snake_case)
        let capabilities = (driver as any).capabilities ?? (driver as any).capabilities;
        
        // Convertir capabilities a número si es necesario
        if (typeof capabilities === 'string') {
          capabilities = parseInt(capabilities, 10);
        } else if (capabilities !== undefined && capabilities !== null) {
          capabilities = Number(capabilities);
        }
        
        // Si capabilities es undefined, null, o NaN, excluir el conductor
        if (capabilities === undefined || capabilities === null || isNaN(capabilities)) {
          console.log(`⚠️ Conductor ${driver.full_name} (${driver.license_number}) no tiene capabilities definido o válido. Valor:`, (driver as any).capabilities);
          return false;
        }
        
        const hasValidLicense = capabilities === 2 || capabilities === 3;
        if (!hasValidLicense) {
          console.log(`❌ Conductor ${driver.full_name} (${driver.license_number}) no tiene licencia válida para vehículo pesado. Capabilities: ${capabilities} (tipo: ${typeof capabilities})`);
        }
        return hasValidLicense;
      });
      console.log(`✅ Vehículo pesado (machinery=${machinery}): ${filtered.length} conductores válidos de ${drivers.length} totales`);
      return filtered;
    } else {
      // Vehículo liviano: solo conductores con licencia liviana (1) o ambas (3)
      const filtered = drivers.filter(driver => {
        // Obtener capabilities - puede venir como capabilities o capabilities (snake_case)
        let capabilities = (driver as any).capabilities ?? (driver as any).capabilities;
        
        // Convertir capabilities a número si es necesario
        if (typeof capabilities === 'string') {
          capabilities = parseInt(capabilities, 10);
        } else if (capabilities !== undefined && capabilities !== null) {
          capabilities = Number(capabilities);
        }
        
        // Si capabilities es undefined, null, o NaN, excluir el conductor
        if (capabilities === undefined || capabilities === null || isNaN(capabilities)) {
          console.log(`⚠️ Conductor ${driver.full_name} (${driver.license_number}) no tiene capabilities definido o válido. Valor:`, (driver as any).capabilities);
          return false;
        }
        
        const hasValidLicense = capabilities === 1 || capabilities === 3;
        if (!hasValidLicense) {
          console.log(`❌ Conductor ${driver.full_name} (${driver.license_number}) no tiene licencia válida para vehículo liviano. Capabilities: ${capabilities} (tipo: ${typeof capabilities})`);
        }
        return hasValidLicense;
      });
      console.log(`✅ Vehículo liviano (machinery=${machinery}): ${filtered.length} conductores válidos de ${drivers.length} totales`);
      return filtered;
    }
  }, [drivers, vehicleMachinery]);

  // Limpiar selección cuando cambia el vehículo o se abre el modal
  React.useEffect(() => {
    if (isOpen) {
      setSelectedDriverId('');
      setErrors({});
      
      // Si hay un conductor seleccionado previamente, verificar si sigue siendo válido
      // (esto puede pasar si el vehículo cambió)
      if (selectedDriverId) {
        const selectedDriver = availableDrivers.find(d => d.id === selectedDriverId);
        if (!selectedDriver) {
          setSelectedDriverId('');
        }
      }
    }
  }, [isOpen, vehicleMachinery, availableDrivers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDriverId) {
      setErrors({ driver: 'Debes seleccionar un conductor' });
      return;
    }

    // Verificar que el conductor seleccionado esté en la lista de disponibles
    const selectedDriver = availableDrivers.find(d => d.id === selectedDriverId);
    if (!selectedDriver) {
      setErrors({ driver: 'El conductor seleccionado no tiene la licencia adecuada para este vehículo' });
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
                disabled={availableDrivers.length === 0}
              >
                <option value="">
                  {availableDrivers.length === 0 
                    ? 'No hay conductores disponibles con la licencia adecuada...'
                    : 'Seleccione un conductor...'}
                </option>
                {availableDrivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.full_name} ({driver.license_number})
                  </option>
                ))}
              </select>
              {vehicleMachinery !== undefined && vehicleMachinery !== null && availableDrivers.length === 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  No hay conductores disponibles con la licencia adecuada para este tipo de vehículo.
                  {vehicleMachinery === 1 
                    ? ' Se requiere licencia tipo Pesada o Ambas.'
                    : ' Se requiere licencia tipo Liviana o Ambas.'}
                </p>
              )}
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
