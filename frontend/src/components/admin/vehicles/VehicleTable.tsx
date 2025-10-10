import React from 'react';
import { Edit, Car, User, AlertCircle, Loader2 } from 'lucide-react';
import type { VehicleWithDriver } from '../../../types/vehicle';

interface VehicleTableProps {
  vehicles: VehicleWithDriver[];
  isLoading?: boolean;
  onEdit?: (vehicle: VehicleWithDriver) => void;
  onAssign?: (vehicle: VehicleWithDriver) => void;
  onStatusChange?: (vehicle: VehicleWithDriver) => void;
  showAsAvailable?: boolean; // Nueva prop para indicar si mostrar como "Disponible" o "Ocupado"
}

const VehicleTable: React.FC<VehicleTableProps> = ({
  vehicles,
  isLoading = false,
  onEdit,
  onAssign,
  onStatusChange,
  showAsAvailable = false
}) => {
  const getStatusInfo = (_status: number) => {
    // Si showAsAvailable es true, siempre mostrar "Disponible"
    if (showAsAvailable) {
      return {
        label: 'Disponible',
        color: 'bg-green-600/20 border border-green-600/30 text-green-400'
      };
    }
    
    // Si showAsAvailable es false, mostrar "Ocupado" para vehículos asignados
    return {
      label: 'Ocupado',
      color: 'bg-blue-600/20 border border-blue-600/30 text-blue-400'
    };
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Cargando vehículos...</p>
        </div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700 flex items-center justify-center">
            <Car className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-300 mb-2">No hay vehículos</h3>
          <p className="text-slate-400">No se encontraron vehículos para mostrar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-3 px-4 text-slate-300 font-medium">Placa</th>
            <th className="text-left py-3 px-4 text-slate-300 font-medium">Vehículo</th>
            {!showAsAvailable && (
              <th className="text-left py-3 px-4 text-slate-300 font-medium">Conductor</th>
            )}
            <th className="text-left py-3 px-4 text-slate-300 font-medium">Estado</th>
            <th className="text-center py-3 px-4 text-slate-300 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => {
            const statusInfo = getStatusInfo(vehicle.status);
            
            return (
              <tr key={vehicle.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                <td className="py-4 px-4">
                  <div>
                    <div className="font-medium text-white font-mono">{vehicle.plate}</div>
                    <div className="text-sm text-slate-400">ID: {vehicle.id}</div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div>
                    <div className="font-medium text-white">{vehicle.brand} {vehicle.model}</div>
                    <div className="text-sm text-slate-400">{vehicle.type} • {vehicle.year}</div>
                  </div>
                </td>
                {!showAsAvailable && (
                  <td className="py-4 px-4">
                    {vehicle.driver ? (
                      <div>
                        <div className="font-medium text-white">{vehicle.driver.full_name}</div>
                        <div className="text-sm text-slate-400">{vehicle.driver.license_number}</div>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">Sin asignar</span>
                    )}
                  </td>
                )}
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex justify-center gap-2">
                    {onAssign && (
                      <button
                        onClick={() => onAssign(vehicle)}
                        className="p-2.5 rounded-lg border border-slate-600 bg-slate-800/50 text-slate-300 hover:border-green-500 hover:text-green-400 hover:bg-green-500/10 transition-all duration-200 hover:shadow-lg hover:shadow-green-500/20"
                        title="Asignar conductor"
                      >
                        <User className="w-4 h-4" />
                      </button>
                    )}
                    {onStatusChange && (
                      <button
                        onClick={() => onStatusChange(vehicle)}
                        className="p-2.5 rounded-lg border border-slate-600 bg-slate-800/50 text-slate-300 hover:border-orange-500 hover:text-orange-400 hover:bg-orange-500/10 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/20"
                        title="Cambiar estado"
                      >
                        <AlertCircle className="w-4 h-4" />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(vehicle)}
                        className="p-2.5 rounded-lg border border-slate-600 bg-slate-800/50 text-slate-300 hover:border-blue-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20"
                        title="Editar vehículo"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export { VehicleTable };
export default VehicleTable;