import React, { useState } from "react";
import { Route, Clock, CheckCircle, Play, Fuel } from "lucide-react";

export type Trip = {
    id: string; origen: string; destino: string;
    estado: "Planificado" | "EnCurso" | "Finalizado";
    estimado?: number; inicioAt?: number | null; finAt?: number | null;
    observations: Array<{ id: string; text: string; ts: number }>;
};

type Props = {
    trips: Trip[];
    onStart?: (id: string) => void;
    onFinish?: (id: string) => void;
    onAddObs?: (tripId: string, text: string) => void;
    onAskFuel?: (tripId: string) => void;
};

const fmt = (ts?: number | null) => ts ? new Date(ts).toLocaleString() : "—";

const DriverTrips: React.FC<Props> = ({ trips, onStart, onFinish, onAddObs, onAskFuel }) => {
    const [selected, setSelected] = useState<string | undefined>(trips[0]?.id);
    const [obs, setObs] = useState("");
    const trip = trips.find(t => t.id === selected);

    return (
        <div className="space-y-6">
            {/* Título con gradiente */}
            <div className="text-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                    Mis Viajes
                </h1>
                <p className="text-slate-400">Gestiona tus viajes y observaciones</p>
            </div>

            <div className="grid lg:grid-cols-[320px,1fr] gap-6">
                {/* list */}
                <div className="fuel-card h-fit lg:h-[76vh] overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-800/60">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
                                <Route className="w-5 h-5 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">Lista de Viajes</h3>
                        </div>
                    </div>
                    <div className="space-y-3 overflow-auto max-h-[66vh] px-6 pb-6">
                        {trips.map(t => (
                            <button key={t.id} onClick={() => setSelected(t.id)}
                                className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${
                                    selected === t.id 
                                        ? "border-blue-500/50 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 shadow-lg" 
                                        : "border-slate-800 hover:bg-slate-800/40 hover:border-slate-700"
                                }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="font-semibold text-white">{t.origen} → {t.destino}</div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        t.estado === "Finalizado" 
                                            ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30" 
                                            : t.estado === "EnCurso" 
                                            ? "bg-blue-600/20 text-blue-400 border border-blue-600/30" 
                                            : "bg-amber-600/20 text-amber-400 border border-amber-600/30"
                                    }`}>{t.estado}</span>
                                </div>
                                <div className="text-xs text-slate-400">ID: {t.id}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* detail */}
                <div className="fuel-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 rounded-lg bg-emerald-600/20 border border-emerald-600/30">
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-white">Detalle del viaje</h3>
                            </div>
                            <div className="text-slate-400">{trip?.origen} → {trip?.destino}</div>
                        </div>
                        <div className="flex gap-3">
                            {trip?.estado === "Planificado" && (
                                <button className="fuel-button flex items-center gap-2" onClick={() => onStart?.(trip.id)}>
                                    <Play className="w-4 h-4" />
                                    Iniciar
                                </button>
                            )}
                            {trip?.estado === "EnCurso" && (
                                <button className="fuel-button-secondary flex items-center gap-2" onClick={() => onFinish?.(trip.id)}>
                                    <CheckCircle className="w-4 h-4" />
                                    Finalizar
                                </button>
                            )}
                            {trip && (
                                <button className="fuel-button-secondary flex items-center gap-2" onClick={() => onAskFuel?.(trip.id)}>
                                    <Fuel className="w-4 h-4" />
                                    Pedir gasolina
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
                                    <Clock className="w-5 h-5 text-blue-400" />
                                </div>
                                <h4 className="text-lg font-semibold text-white">Observaciones</h4>
                            </div>
                            <div className="space-y-3 max-h-[46vh] overflow-auto pr-1">
                                {trip?.observations.map(o => (
                                    <div key={o.id} className="fuel-card p-4">
                                        <div className="text-sm text-white mb-2">{o.text}</div>
                                        <div className="text-xs text-slate-500">{fmt(o.ts)}</div>
                                    </div>
                                ))}
                                {trip && trip.observations.length === 0 && (
                                    <div className="text-center py-8">
                                        <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                                        <div className="text-slate-400">Sin observaciones aún</div>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <input 
                                    className="fuel-input flex-1" 
                                    placeholder="Escribe una observación..." 
                                    value={obs} 
                                    onChange={(e) => setObs(e.target.value)} 
                                />
                                <button 
                                    className="fuel-button px-6" 
                                    onClick={() => { if (obs.trim() && trip) { onAddObs?.(trip.id, obs.trim()); setObs(""); } }}
                                >
                                    Agregar
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-amber-600/20 border border-amber-600/30">
                                    <Route className="w-5 h-5 text-amber-400" />
                                </div>
                                <h4 className="text-lg font-semibold text-white">Resumen</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="fuel-card p-4 text-center">
                                    <div className="text-slate-400 text-sm mb-1">Estado</div>
                                    <div className="font-semibold text-white">{trip?.estado ?? "—"}</div>
                                </div>
                                <div className="fuel-card p-4 text-center">
                                    <div className="text-slate-400 text-sm mb-1">Estimado (L)</div>
                                    <div className="font-semibold text-blue-400">{trip?.estimado ?? "—"}</div>
                                </div>
                                <div className="fuel-card p-4 text-center">
                                    <div className="text-slate-400 text-sm mb-1">Inicio</div>
                                    <div className="font-semibold text-emerald-400">{fmt(trip?.inicioAt)}</div>
                                </div>
                                <div className="fuel-card p-4 text-center">
                                    <div className="text-slate-400 text-sm mb-1">Fin</div>
                                    <div className="font-semibold text-amber-400">{fmt(trip?.finAt)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default DriverTrips;
