import React from "react";
import { User, Mail, Shield, Car, Calendar } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import type { Driver } from "../../types/driver";

type Props = { profile?: { fullName: string; role: string; email?: string } };

type DisplayProfile = {
  fullName: string;
  role: string;
  email: string;
  licenseNumber?: string;
  capabilities?: string;
  availability?: string;
  createdAt?: string;
};

// Función para convertir capabilities a texto
const getCapabilitiesText = (capabilities: number): string => {
  switch (capabilities) {
    case 1: return "Liviana";
    case 2: return "Pesada";
    case 3: return "Ambas";
    default: return "No especificada";
  }
};

// Función para convertir availability a texto
const getAvailabilityText = (availability: number): string => {
  switch (availability) {
    case 1: return "Disponible";
    case 2: return "Ocupado";
    case 3: return "Fuera de Servicio";
    default: return "No especificada";
  }
};

const DriverProfile: React.FC<Props> = ({ profile }) => {
  const { driverData } = useOutletContext<{ driverData: Driver }>() || {};
  
  // Usar datos del API si están disponibles, sino usar props
  const displayProfile: DisplayProfile = driverData ? {
    fullName: driverData.full_name,
    role: "CONDUCTOR",
    email: driverData.user_id, // En el contexto real, esto vendría del AuthService
    licenseNumber: driverData.license_number,
    capabilities: getCapabilitiesText(driverData.capabilities),
    availability: getAvailabilityText(driverData.availability),
    createdAt: new Date(driverData.created_at).toLocaleDateString()
  } : {
    fullName: profile?.fullName || "",
    role: profile?.role || "",
    email: profile?.email || ""
  };

  return (
    <div className="space-y-6">
      {/* Título con gradiente */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
          Mi Perfil
        </h1>
        <p className="text-slate-400">Información personal y de cuenta</p>
      </div>

      <div className="fuel-card p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-blue-600/20 border border-blue-600/30">
            <User className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Información Personal</h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="fuel-card p-4 text-center">
            <div className="p-2 rounded-lg bg-emerald-600/20 border border-emerald-600/30 w-fit mx-auto mb-3">
              <User className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-slate-400 text-sm mb-1">Nombre Completo</div>
            <div className="font-semibold text-white text-lg">{displayProfile?.fullName ?? "—"}</div>
          </div>
          
          <div className="fuel-card p-4 text-center">
            <div className="p-2 rounded-lg bg-amber-600/20 border border-amber-600/30 w-fit mx-auto mb-3">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-slate-400 text-sm mb-1">Rol</div>
            <div className="font-semibold text-white text-lg">{displayProfile?.role ?? "—"}</div>
          </div>
          
          <div className="fuel-card p-4 text-center">
            <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30 w-fit mx-auto mb-3">
              <Mail className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-slate-400 text-sm mb-1">ID de Usuario</div>
            <div className="font-semibold text-white text-lg break-all">{displayProfile?.email ?? "—"}</div>
          </div>

          {driverData && (
            <>
              <div className="fuel-card p-4 text-center">
                <div className="p-2 rounded-lg bg-cyan-600/20 border border-cyan-600/30 w-fit mx-auto mb-3">
                  <Car className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="text-slate-400 text-sm mb-1">Licencia</div>
                <div className="font-semibold text-white text-lg">{displayProfile?.licenseNumber ?? "—"}</div>
              </div>
              
              <div className="fuel-card p-4 text-center">
                <div className="p-2 rounded-lg bg-purple-600/20 border border-purple-600/30 w-fit mx-auto mb-3">
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-slate-400 text-sm mb-1">Capacidades</div>
                <div className="font-semibold text-white text-lg">{displayProfile?.capabilities ?? "—"}</div>
              </div>
              
              <div className="fuel-card p-4 text-center">
                <div className="p-2 rounded-lg bg-green-600/20 border border-green-600/30 w-fit mx-auto mb-3">
                  <Calendar className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-slate-400 text-sm mb-1">Estado</div>
                <div className="font-semibold text-white text-lg">{displayProfile?.availability ?? "—"}</div>
              </div>
            </>
          )}
        </div>
        
        <div className="mt-6 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            <span className="text-slate-400 text-sm">
              {driverData 
                ? "Datos obtenidos del ChoferService via Gateway" 
                : "Datos provenientes de AuthService (JWT)"
              }
            </span>
          </div>
          {driverData && (
            <div className="mt-2 text-xs text-slate-500">
              Registrado el {displayProfile?.createdAt}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverProfile;