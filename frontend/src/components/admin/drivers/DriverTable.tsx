import React from 'react';
import { Edit, Loader2 } from 'lucide-react';
import type { Driver } from '../../../types/driver';
import { mapCapability, mapAvailability, getCapabilityColor, getAvailabilityColor, formatDate } from '../../../utils/driverUtils';

interface DriverTableProps {
  drivers: Driver[];
  isLoading?: boolean;
  onEdit: (driver: Driver) => void;
}

const DriverTable: React.FC<DriverTableProps> = ({
  drivers,
  isLoading = false,
  onEdit
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Cargando conductores...</p>
        </div>
      </div>
    );
  }

  if (drivers.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700 flex items-center justify-center">
            <span className="text-2xl">🚛</span>
          </div>
          <h3 className="text-lg font-medium text-slate-300 mb-2">No hay conductores</h3>
          <p className="text-slate-400">No se encontraron conductores registrados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-3 px-4 text-slate-300 font-medium">Nombre Completo</th>
            <th className="text-left py-3 px-4 text-slate-300 font-medium">N° Licencia</th>
            <th className="text-left py-3 px-4 text-slate-300 font-medium">Capacidad</th>
            <th className="text-left py-3 px-4 text-slate-300 font-medium">Disponibilidad</th>
            <th className="text-left py-3 px-4 text-slate-300 font-medium">Fecha Creación</th>
            <th className="text-center py-3 px-4 text-slate-300 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map((driver) => (
            <tr key={driver.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
              <td className="py-4 px-4">
                <div>
                  <div className="font-medium text-white">{driver.full_name}</div>
                  <div className="text-sm text-slate-400">ID: {driver.user_id}</div>
                </div>
              </td>
              <td className="py-4 px-4">
                <span className="text-slate-300 font-mono">{driver.license_number}</span>
              </td>
              <td className="py-4 px-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCapabilityColor(driver.capabilities)}`}>
                  {mapCapability(driver.capabilities)}
                </span>
              </td>
              <td className="py-4 px-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getAvailabilityColor(driver.availability)}`}>
                  {mapAvailability(driver.availability)}
                </span>
              </td>
              <td className="py-4 px-4">
                <span className="text-slate-400 text-sm">
                  {formatDate(driver.created_at)}
                </span>
              </td>
              <td className="py-4 px-4">
                <div className="flex justify-center">
                  <button
                    onClick={() => onEdit(driver)}
                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                    title="Editar conductor"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DriverTable;
