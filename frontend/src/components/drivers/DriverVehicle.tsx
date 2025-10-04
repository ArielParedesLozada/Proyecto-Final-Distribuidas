import React from "react";
import { Car, Fuel, Zap, Settings } from "lucide-react";

type Props = {
    vehicle?: { placa: string; tipo: string; estado: string; nivel: number };
    onAskFuel?: () => void;
};

const DriverVehicle: React.FC<Props> = ({ vehicle, onAskFuel }) => (
    <div className="space-y-6">
        {/* Título con gradiente */}
        <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Mi Vehículo
            </h1>
            <p className="text-slate-400">Información del vehículo asignado y acciones</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {/* Información del vehículo */}
            <div className="fuel-card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-lg bg-emerald-600/20 border border-emerald-600/30">
                        <Car className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">Vehículo Asignado</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="fuel-card p-4 text-center">
                        <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30 w-fit mx-auto mb-3">
                            <Settings className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="text-slate-400 text-sm mb-1">Placa</div>
                        <div className="font-semibold text-white text-lg">{vehicle?.placa ?? "—"}</div>
                    </div>
                    
                    <div className="fuel-card p-4 text-center">
                        <div className="p-2 rounded-lg bg-amber-600/20 border border-amber-600/30 w-fit mx-auto mb-3">
                            <Car className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="text-slate-400 text-sm mb-1">Tipo</div>
                        <div className="font-semibold text-white text-lg">{vehicle?.tipo ?? "—"}</div>
                    </div>
                    
                    <div className="fuel-card p-4 text-center">
                        <div className="p-2 rounded-lg bg-emerald-600/20 border border-emerald-600/30 w-fit mx-auto mb-3">
                            <Zap className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="text-slate-400 text-sm mb-1">Estado</div>
                        <div className="font-semibold text-white text-lg">{vehicle?.estado ?? "—"}</div>
                    </div>
                    
                    <div className="fuel-card p-4 text-center">
                        <div className="p-2 rounded-lg bg-cyan-600/20 border border-cyan-600/30 w-fit mx-auto mb-3">
                            <Fuel className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="text-slate-400 text-sm mb-1">Combustible</div>
                        <div className="font-semibold text-white text-lg">{vehicle ? `${vehicle.nivel}%` : "—"}</div>
                    </div>
                </div>

                {/* Barra de combustible */}
                {vehicle && (
                    <div className="mt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400 text-sm">Nivel de combustible</span>
                            <span className="text-white font-medium">{vehicle.nivel}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-3">
                            <div 
                                className={`h-3 rounded-full transition-all duration-500 ${
                                    vehicle.nivel > 70 ? 'bg-emerald-500' : 
                                    vehicle.nivel > 30 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${vehicle.nivel}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Acciones rápidas */}
            <div className="fuel-card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-lg bg-blue-600/20 border border-blue-600/30">
                        <Fuel className="w-6 h-6 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">Acciones Rápidas</h2>
                </div>
                
                <div className="space-y-4">
                    <button 
                        className="fuel-button w-full flex items-center justify-center gap-3 py-4 text-lg"
                        onClick={onAskFuel}
                    >
                        <Fuel className="w-6 h-6" />
                        Solicitar Combustible
                    </button>
                    
                    <div className="fuel-card p-4 bg-blue-600/10 border-blue-600/30">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                            <span className="text-blue-400 font-medium text-sm">Información</span>
                        </div>
                        <p className="text-slate-400 text-sm">
                            Si necesitas combustible para tu vehículo, puedes solicitar una recarga a través del botón superior.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);
export default DriverVehicle;
