import React from "react";
import { User, Mail, Shield, Car, Calendar } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import type { Driver } from "../../types/driver";

type Props = { profile?: { fullName: string; role: string; email?: string } };

const DriverProfile: React.FC<Props> = ({ profile }) => (
    <div className="space-y-6 w-full px-2 sm:px-4">
        <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Mi Perfil
            </h1>
            <p className="text-slate-400">Información personal y de cuenta</p>
        </div>

        <div className="fuel-card p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-blue-600/20 border border-blue-600/30">
                    <User className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Información Personal</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="fuel-card p-4 text-center">
                    <div className="p-2 rounded-lg bg-emerald-600/20 border border-emerald-600/30 w-fit mx-auto mb-3">
                        <User className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="text-slate-400 text-sm mb-1">Nombre Completo</div>
                    <div className="font-semibold text-white text-lg">{profile?.fullName ?? "—"}</div>
                </div>

                <div className="fuel-card p-4 text-center">
                    <div className="p-2 rounded-lg bg-amber-600/20 border border-amber-600/30 w-fit mx-auto mb-3">
                        <Shield className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="text-slate-400 text-sm mb-1">Rol</div>
                    <div className="font-semibold text-white text-lg">{profile?.role ?? "—"}</div>
                </div>

                <div className="fuel-card p-4 text-center">
                    <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30 w-fit mx-auto mb-3">
                        <Mail className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-slate-400 text-sm mb-1">Correo Electrónico</div>
                    <div className="font-semibold text-white text-lg break-all">{profile?.email ?? "—"}</div>
                </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <span className="text-slate-400 text-sm">Datos provenientes de AuthService (JWT)</span>
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