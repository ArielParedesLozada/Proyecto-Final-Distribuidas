import React from "react";
import { User, Mail, Shield } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth"; // para el profile

export type Driver = {
  id: string;
  user_id: string;
  full_name: string;
  license_number: string;
  capabilities: number;
  availability: number;
  created_at?: string;
  updated_at?: string;
};

type OutletContext = {
  driverData: Driver | null;
};

const availabilityLabel = (v?: number) =>
  v === 1 ? "Disponible" : v === 2 ? "Ocupado" : v === 3 ? "Fuera de Servicio" : "—";

const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : "—");

const DriverProfile: React.FC = () => {
  const { driverData } = useOutletContext<OutletContext>();
  const { user } = useAuth();

  const profile = {
    fullName: user?.name ?? "—",
    role: user?.roles ?? "—",
    email: user?.email ?? "—",
  };

  const driver = driverData;

  return (
    <div className="space-y-6 w-full px-2 sm:px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
          Mi Perfil
        </h1>
        <p className="text-slate-400">Información personal y profesional</p>
      </div>

      {/* Información del AuthService */}
      <div className="fuel-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/30 border border-blue-500/30">
            <User className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Información del Conductor</h2>
        </div>

        {/* Nombre Completo - Destacado */}
        {driverData && (
          <div className="mb-8">
            <div className="fuel-card p-8 text-center bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/30">
              <div className="p-4 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 border border-emerald-500/30 w-fit mx-auto mb-6">
                <User className="w-10 h-10 text-emerald-400" />
              </div>
              <div className="text-slate-400 text-base mb-3">Nombre Completo</div>
              <div className="font-bold text-white text-2xl">{driverData.full_name}</div>
            </div>
            <div className="text-slate-400 text-sm mb-1">Nombre Completo</div>
            <div className="font-semibold text-white text-lg">{profile.fullName}</div>
          </div>
        )}

        {/* Información Personal - Primera fila */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Rol */}
          <div className="fuel-card p-6 hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-600/20 border border-amber-600/30">
                <Shield className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="text-slate-400 text-sm mb-1">Rol</div>
                <div className="font-semibold text-white text-lg">{profileData?.role ?? "—"}</div>
              </div>
            </div>
            <div className="text-slate-400 text-sm mb-1">Rol</div>
            <div className="font-semibold text-white text-lg">{profile.role}</div>
          </div>

          {/* Email */}
          <div className="fuel-card p-6 hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-600/20 border border-blue-600/30">
                <Mail className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-slate-400 text-sm mb-1">Correo Electrónico</div>
                <div className="font-semibold text-white text-lg truncate" title={profileData?.email ?? "—"}>{profileData?.email ?? "—"}</div>
              </div>
            </div>
            <div className="text-slate-400 text-sm mb-1">Correo Electrónico</div>
            <div className="font-semibold text-white text-lg break-all">{profile.email}</div>
          </div>
        </div>

      </div>

      {/* Información del ChoferService */}
      <div className="mt-2 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-slate-400 text-sm">
            {driver ? "Datos del Chofer" : "Aún no tienes perfil de conductor"}
          </span>
        </div>

        {driver && (
          <div className="grid md:grid-cols-3 gap-6 mt-4">
            <div className="fuel-card p-4 text-center">
              <div className="text-slate-400 text-sm mb-1">Nombre en perfil</div>
              <div className="font-semibold text-white text-lg">{driver.full_name}</div>
            </div>

            {/* Disponibilidad */}
            <div className="fuel-card p-6 hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-teal-600/20 border border-teal-600/30">
                  <User className="w-6 h-6 text-teal-400" />
                </div>
                <div className="flex-1">
                  <div className="text-slate-400 text-sm mb-1">Disponibilidad</div>
                  <div className={`font-semibold text-lg ${
                    driverData.availability === 1 ? "text-green-400" :
                    driverData.availability === 2 ? "text-blue-400" :
                    driverData.availability === 3 ? "text-red-400" : "text-slate-400"
                  }`}>
                    {availabilityLabel(driverData.availability)}
                  </div>
                </div>
              </div>
            </div>

            {/* Capacidades */}
            <div className="fuel-card p-6 hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-600/20 border border-purple-600/30">
                  <Shield className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="text-slate-400 text-sm mb-1">Capacidades</div>
                  <div className="font-semibold text-white text-lg">
                    {driverData.capabilities === 1 ? "Liviana" :
                     driverData.capabilities === 2 ? "Pesada" :
                     driverData.capabilities === 3 ? "Ambas" : "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverProfile;
