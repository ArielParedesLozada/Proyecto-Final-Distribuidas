import React, { useState } from "react";
import { Clock, Route, Car } from "lucide-react";
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

const TripModal: React.FC<Props> = ({ trip, onClose, onAddObs, vehicle }) => {
    const [obs, setObs] = useState("");

    const ContentWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <div className="hidden md:block">{children}</div>
    );

    const ScrollableWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <div className="block md:hidden w-full h-[90vh]">
            <ScrollableContainer className="h-full p-2">{children}</ScrollableContainer>
        </div>
    );

    const Content = (
        <div
            className="
        w-full max-w-2xl sm:max-w-3xl max-h-[90vh] md:max-h-[85vh]
        flex flex-col p-6 relative rounded-2xl shadow-xl
        bg-[#0b1a2f] border border-slate-800
      "
        >
            {/* Cerrar */}
            <button
                className="absolute right-4 top-4 text-slate-400 hover:text-white"
                onClick={onClose}
            >
                ✕
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-6 shrink-0">
                <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
                    <Route className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                    {trip.origen} → {trip.destino}
                </h2>
            </div>

            {/* Vehículo asignado (tarjeta) */}
            <div className="fuel-card p-4 mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-600/20 border border-emerald-600/30">
                        <Car className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-slate-300 text-sm">Vehículo asignado</div>
                        <div className="font-semibold text-white">
                            {vehicle?.alias ?? vehicle?.tipo ?? "—"}{vehicle?.placa ? ` · ${vehicle.placa}` : ""}
                        </div>
                    </div>
                </div>
            </div>

            {/* Cuerpo con scroll interno */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-6">
                {/* Datos del viaje */}
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="fuel-card p-4 text-center">
                        <div className="text-slate-400 text-sm mb-1">Estado</div>
                        <div className="font-semibold text-white">{trip.estado}</div>
                    </div>
                    <div className="fuel-card p-4 text-center">
                        <div className="text-slate-400 text-sm mb-1">Estimado (L)</div>
                        <div className="font-semibold text-blue-400">{trip.estimado ?? "—"}</div>
                    </div>
                    <div className="fuel-card p-4 text-center">
                        <div className="text-slate-400 text-sm mb-1">Inicio</div>
                        <div className="font-semibold text-emerald-400">{fmt(trip.inicioAt)}</div>
                    </div>
                    <div className="fuel-card p-4 text-center">
                        <div className="text-slate-400 text-sm mb-1">Fin</div>
                        <div className="font-semibold text-amber-400">{fmt(trip.finAt)}</div>
                    </div>
                </div>

                {/* Observaciones */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
                            <Clock className="w-5 h-5 text-blue-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-white">Observaciones</h4>
                    </div>

                    <div className="space-y-2 max-h-[35vh] md:max-h-[32vh] overflow-y-auto pr-1">
                        {trip.observations.length === 0 && (
                            <p className="text-slate-400 text-center">Sin observaciones aún</p>
                        )}
                        {trip.observations.map((o) => (
                            <div key={o.id} className="fuel-card p-3">
                                <div className="text-sm text-white mb-1">{o.text}</div>
                                <div className="text-xs text-slate-500">{fmt(o.ts)}</div>
                            </div>
                        ))}
                    </div>

                    {/* Campo de agregar solo si está EnCurso */}
                    {trip.estado === "EnCurso" && (
                        <div className="flex gap-3">
                            <input
                                className="fuel-input flex-1"
                                placeholder="Escribe una observación..."
                                value={obs}
                                onChange={(e) => setObs(e.target.value)}
                            />
                            <button
                                className="fuel-button px-6"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            {/* Desktop */}
            <ContentWrapper>{Content}</ContentWrapper>

            {/* Móvil */}
            <ScrollableWrapper>{Content}</ScrollableWrapper>
        </div>
    );
};

export default TripModal;
