import React, { useEffect, useMemo, useState } from "react";
import { Clock, Route, Car, Calendar } from "lucide-react";
import ScrollableContainer from "../../shared/ScrollableContainer";
import type { Trip } from "./DriverTrips";

type VehicleInfo = {
    placa: string;
    tipo?: string;
    alias?: string;
};

type Props = {
    trip: Trip;
    onClose: () => void;
    onAddObs?: (tripId: string, text: string) => void;
    vehicle?: VehicleInfo;
};

const fmt = (ts?: number | null) => (ts ? new Date(ts).toLocaleString() : "—");

function formatRelative(targetTs: number, now: number): { text: string; future: boolean } {
    const diffMs = targetTs - now;
    const future = diffMs > 0;
    const abs = Math.abs(diffMs);
    const mins = Math.round(abs / 60000);
    if (mins < 1) return { text: "ahora", future };
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const body = `${h ? `${h} h` : ""}${h && m ? " " : ""}${m ? `${m} m` : ""}`.trim();
    return { text: future ? `en ${body}` : `hace ${body}`, future };
}

const TripModal: React.FC<Props> = ({ trip, onClose, onAddObs, vehicle }) => {
    const [obs, setObs] = useState("");

    const [nowTick, setNowTick] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNowTick(Date.now()), 30000);
        return () => clearInterval(id);
    }, []);

    const programadoBadge = useMemo(() => {
        if (!trip.programadoAt) return null;
        const { text, future } = formatRelative(trip.programadoAt, nowTick);
        const cls = future
            ? "bg-blue-600/10 text-blue-300 border-blue-500/30"
            : "bg-slate-700/30 text-slate-300 border-slate-600/40";
        return (
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs border ${cls}`}>
                {text}
            </span>
        );
    }, [trip.programadoAt, nowTick]);

    const stateChip =
        trip.estado === "Finalizado"
            ? "bg-emerald-600/20 text-emerald-300 border border-emerald-600/30"
            : trip.estado === "EnCurso"
                ? "bg-blue-600/20 text-blue-300 border border-blue-600/30"
                : "bg-amber-600/20 text-amber-300 border border-amber-600/30";

    const renderContent = () => (
        <div
            className="
        w-full max-w-xl sm:max-w-2xl md:max-w-3xl
        max-h-[92vh] md:max-h-[85vh]
        flex flex-col p-4 md:p-6 relative rounded-2xl shadow-xl
        bg-[#0b1a2f] border border-slate-800
      "
        >
            {/* Cerrar */}
            <button
                className="absolute right-3 top-3 md:right-4 md:top-4 text-slate-400 hover:text-white"
                onClick={onClose}
                aria-label="Cerrar"
            >
                ✕
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-4 md:mb-6 shrink-0">
                <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
                    <Route className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-lg md:text-xl font-semibold text-white truncate">
                    {trip.origen} → {trip.destino}
                </h2>
            </div>

            {/* Vehículo asignado */}
            <div className="fuel-card p-3 md:p-4 mb-3 md:mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-600/20 border border-emerald-600/30">
                        <Car className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-slate-300 text-sm">Vehículo asignado</div>
                        <div className="font-semibold text-white truncate">
                            {vehicle?.alias ?? vehicle?.tipo ?? "—"}
                            {vehicle?.placa ? ` · ${vehicle.placa}` : ""}
                        </div>
                    </div>
                </div>
            </div>

            {/* Cuerpo con scroll interno */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-5 md:space-y-6">
                {/* ====== Datos del viaje (layout móvil mejorado) ====== */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {/* Estado */}
                    <div className="fuel-card p-3 md:p-4 text-center">
                        <div className="text-slate-400 text-xs md:text-sm mb-1">Estado</div>
                        <div className="mt-1">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${stateChip}`}>
                                {trip.estado}
                            </span>
                        </div>
                    </div>

                    {/* Estimado */}
                    <div className="fuel-card p-3 md:p-4 text-center">
                        <div className="text-slate-400 text-xs md:text-sm mb-1">Estimado (L)</div>
                        <div className="font-semibold text-blue-400 text-base md:text-lg">
                            {trip.estimado ?? "—"}
                        </div>
                    </div>

                    {/* Programado (ocupa 2 col en móvil y 2 en md) */}
                    <div className="fuel-card p-3 md:p-4 text-center col-span-2 md:col-span-2">
                        <div className="text-slate-400 text-xs md:text-sm mb-1 flex items-center justify-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>Programado</span>
                        </div>
                        <div className="font-semibold text-white text-sm md:text-base">{fmt(trip.programadoAt)}</div>
                        {programadoBadge}
                    </div>

                    {/* Inicio */}
                    <div className="fuel-card p-3 md:p-4 text-center col-span-1 md:col-span-2">
                        <div className="text-slate-400 text-xs md:text-sm mb-1">Inicio</div>
                        <div className="font-semibold text-emerald-400 text-sm md:text-base">{fmt(trip.inicioAt)}</div>
                    </div>

                    {/* Fin */}
                    <div className="fuel-card p-3 md:p-4 text-center col-span-1 md:col-span-2">
                        <div className="text-slate-400 text-xs md:text-sm mb-1">Fin</div>
                        <div className="font-semibold text-amber-400 text-sm md:text-base">{fmt(trip.finAt)}</div>
                    </div>
                </div>

                {/* Observaciones */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
                            <Clock className="w-5 h-5 text-blue-400" />
                        </div>
                        <h4 className="text-base md:text-lg font-semibold text-white">Observaciones</h4>
                    </div>

                    <div className="space-y-2 max-h-[42vh] md:max-h-[32vh] overflow-y-auto pr-1">
                        {trip.observations.length === 0 && (
                            <p className="text-slate-400 text-center text-sm">Sin observaciones aún</p>
                        )}
                        {trip.observations.map((o) => (
                            <div key={o.id} className="fuel-card p-2 md:p-3">
                                <div className="text-sm text-white mb-1">{o.text}</div>
                                <div className="text-xs text-slate-500">{fmt(o.ts)}</div>
                            </div>
                        ))}
                    </div>

                    {/* Agregar observación solo en EnCurso (apilado en móvil) */}
                    {trip.estado === "EnCurso" && (
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <input
                                className="fuel-input w-full sm:flex-1"
                                placeholder="Escribe una observación..."
                                value={obs}
                                onChange={(e) => setObs(e.target.value)}
                            />
                            <button
                                className="fuel-button w-full sm:w-auto px-5 md:px-6"
                                onClick={() => {
                                    if (obs.trim()) {
                                        onAddObs?.(trip.id, obs.trim());
                                        setObs("");
                                    }
                                }}
                            >
                                Agregar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-2 sm:px-4">
            {/* Desktop / tablet */}
            <div className="hidden md:block">{renderContent()}</div>

            {/* Móvil con scroll suave */}
            <div className="block md:hidden w-full h-[94vh]">
                <ScrollableContainer className="h-full p-2">
                    {renderContent()}
                </ScrollableContainer>
            </div>
        </div>
    );
};

export default TripModal;
