import React from "react";
import { useOutletContext } from "react-router-dom";
import { User, Mail, Shield } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import type { Driver } from "../../types/driver";

type Props = {
  profile?: { fullName: string; role: string; email?: string }; // viene del JWT/Auth
  driver?: Driver | null;                                       // viene del ChoferService
};

const availabilityLabel = (v?: number) =>
  v === 1 ? "Disponible" : v === 2 ? "Ocupado" : v === 3 ? "Fuera de Servicio" : "—";

const DriverProfile: React.FC<Props> = ({ profile, driver: propDriver }) => {
  // Obtener datos del contexto de DriverPage
  const contextData = useOutletContext<{ driverData: Driver | null }>();
  const driverData = contextData?.driverData || propDriver;

  // Obtener datos del usuario autenticado
  const { user } = useAuth();

  // Crear profileData combinando props y datos del JWT
  const profileData = profile || {
    fullName: user?.name || "",
    role: user?.roles?.[0] || "",
    email: user?.email || ""
  };
  return (
    <div className="space-y-6 w-full px-2 sm:px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
          Mi Perfil
        </h1>
        <p className="text-slate-400">Información personal y profesional</p>
      </div>

      {/* Card principal unificada */}
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
          </div>
        </div>

        {/* Información del Conductor - Segunda fila */}
        {driverData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Licencia */}
            <div className="fuel-card p-6 hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-orange-600/20 border border-orange-600/30">
                  <Shield className="w-6 h-6 text-orange-400" />
                </div>
                <div className="flex-1">
                  <div className="text-slate-400 text-sm mb-1">Licencia</div>
                  <div className="font-semibold text-white text-lg font-mono">{driverData.license_number || "—"}</div>
                </div>
              </div>
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
