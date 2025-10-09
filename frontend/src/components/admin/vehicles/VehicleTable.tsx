import React from 'react';
import { Edit, Car, User, Calendar, Gauge, Fuel, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import type { VehicleWithDriver } from '../../../types/vehicle';

interface VehicleTableProps {
  vehicles: VehicleWithDriver[];
  isLoading?: boolean;
  onEdit: (vehicle: VehicleWithDriver) => void;
}

const VehicleTable: React.FC<VehicleTableProps> = ({
  vehicles,
  isLoading = false,
  onEdit
}) => {
  const getStatusInfo = (status: number) => {
    switch (status) {
      case 1:
        return {
          label: 'Disponible',
          color: 'bg-green-500/20 text-green-400 border border-green-500/30',
          icon: <CheckCircle className="w-4 h-4" />
        };
      case 2:
        return {
          label: 'En Uso',
          color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
          icon: <Car className="w-4 h-4" />
        };
      case 3:
        return {
          label: 'Mantenimiento',
          color: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
          icon: <Clock className="w-4 h-4" />
        };
      case 4:
        return {
          label: 'Fuera de Servicio',
          color: 'bg-red-500/20 text-red-400 border border-red-500/30',
          icon: <XCircle className="w-4 h-4" />
        };
      default:
        return {
          label: 'Desconocido',
          color: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
          icon: <AlertCircle className="w-4 h-4" />
        };
    }
  };

  const getVehicleTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'camioneta':
        return <Car className="w-5 h-5 text-blue-400" />;
      case 'camión':
      case 'camion':
        return <Car className="w-5 h-5 text-orange-400" />;
      default:
        return <Car className="w-5 h-5 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="fuel-card p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-700 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-700 rounded w-32"></div>
                  <div className="h-3 bg-slate-700 rounded w-24"></div>
                </div>
              </div>
              <div className="w-24 h-8 bg-slate-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-12">
        <Car className="w-16 h-16 text-slate-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-300 mb-2">No hay vehículos</h3>
        <p className="text-slate-500">No se encontraron vehículos para mostrar</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {vehicles.map((vehicle) => {
        const statusInfo = getStatusInfo(vehicle.status);
        
        return (
          <div key={vehicle.id} className="fuel-card p-6 hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-slate-700/50 border border-slate-600/50">
                  {getVehicleTypeIcon(vehicle.type)}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">
                      {vehicle.plate}
                    </h3>
                    <span className="text-sm text-slate-400">
                      {vehicle.brand} {vehicle.model} ({vehicle.year})
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <Gauge className="w-4 h-4" />
                      <span>{vehicle.odometer_km.toLocaleString()} km</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Fuel className="w-4 h-4" />
                      <span>{vehicle.capacity_liters}L</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{vehicle.year}</span>
                    </div>
                  </div>
                  
                  {vehicle.driver && (
                    <div className="flex items-center gap-1 text-sm text-blue-400">
                      <User className="w-4 h-4" />
                      <span>Conductor: {vehicle.driver.full_name}</span>
                      <span className="text-slate-500">({vehicle.driver.license_number})</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.color}`}>
                  {statusInfo.icon}
                  {statusInfo.label}
                </div>
                
                <button
                  onClick={() => onEdit(vehicle)}
                  className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-colors"
                  title="Editar vehículo"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export { VehicleTable };
export default VehicleTable;
