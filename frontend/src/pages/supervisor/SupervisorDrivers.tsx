import React from 'react';
import { Users } from 'lucide-react';

const SupervisorDrivers: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-2">
            Conductores
          </h1>
          <p className="text-slate-400">Gestiona la información de los conductores del sistema</p>
        </div>
      </div>

      {/* Contenido temporal */}
      <div className="fuel-card p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-lg bg-amber-600/20 border border-amber-600/30">
            <Users className="w-12 h-12 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Página en Desarrollo</h2>
            <p className="text-slate-400">
              Esta funcionalidad estará disponible próximamente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDrivers;
