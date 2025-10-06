import React from "react";
import { Car, Route } from "lucide-react";
import ScrollableContainer from "../../shared/ScrollableContainer";

export type Trip = {
    id: string;
    origen: string;
    destino: string;
    estado: "Planificado" | "EnCurso" | "Finalizado";
    estimado?: number;
    inicioAt?: number | null;
    finAt?: number | null;
    observations: Array<{ id: string; text: string; ts: number }>;
};

type Vehicle = {
    placa: string;
    tipo?: string;
    alias?: string;
    modelo?: string;
    estado?: string;
    nivel?: number;
    categoria?: "Liviano" | "Pesado";
};

type Props = {
    vehicle: Vehicle;
    trips: Trip[];
    onClose: () => void;
};

const inferCategoria = (v: Vehicle): "Liviano" | "Pesado" => {
    if (v.categoria) return v.categoria;
    const t = (v.tipo ?? "").toLowerCase();
    const pesadoKeys = ["camión", "camion", "tráiler", "trailer", "volqueta", "tracto", "pesado"];
    const isPesado = pesadoKeys.some((k) => t.includes(k));
    return isPesado ? "Pesado" : "Liviano";
};

const VehicleTripsModal: React.FC<Props> = ({ vehicle, trips, onClose }) => {
    const level = Math.max(0, Math.min(100, Math.round(vehicle.nivel ?? 0)));
    const barColor =
        level > 70 ? "bg-emerald-500" : level > 30 ? "bg-amber-500" : "bg-red-500";

    const categoria = inferCategoria(vehicle);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            {/* Desktop / tablet */}
            <div className="hidden md:block">
                <div className="w-full max-w-2xl max-h-[85vh] flex flex-col p-6 relative rounded-2xl shadow-xl bg-[#0b1a2f] border border-slate-800 text-white">
                    {/* Close */}
                    <button
                        className="absolute right-4 top-4 text-slate-400 hover:text-white"
                        onClick={onClose}
                        aria-label="Cerrar"
                        title="Cerrar"
                    >
                        ✕
                    </button>

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-emerald-600/20 border border-emerald-600/30">
                            <Car className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h2 className="text-lg font-semibold">
                            Vehículo: {vehicle.alias ?? vehicle.tipo ?? "—"}
                            {vehicle.placa ? ` · ${vehicle.placa}` : ""}
                        </h2>
                    </div>

                    {/* Resumen vehículo (4 cards en la misma fila) */}
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                        <div className="fuel-card p-4 text-center">
                            <div className="text-slate-400 text-sm mb-1">Modelo</div>
                            <div className="font-semibold">{vehicle.modelo ?? "—"}</div>
                        </div>
                        <div className="fuel-card p-4 text-center">
                            <div className="text-slate-400 text-sm mb-1">Combustible</div>
                            <div className="font-semibold">
                                {vehicle.nivel != null ? `${level}%` : "—"}
                            </div>
                        </div>
                        <div className="fuel-card p-4 text-center">
                            <div className="text-slate-400 text-sm mb-1">Tipo</div>
                            <div className="font-semibold">{categoria}</div>
                        </div>
                        <div className="fuel-card p-4 text-center">
                            <div className="text-slate-400 text-sm mb-1">Estado</div>
                            <div className="font-semibold">No operativo</div>
                        </div>
                    </div>

                    {/* Barra combustible */}
                    {vehicle.nivel != null && (
                        <div className="mb-4">
                            <div className="w-full bg-slate-800 rounded-full h-3">
                                <div className={`h-3 rounded-full ${barColor}`} style={{ width: `${level}%` }} />
                            </div>
                        </div>
                    )}

                    {/* Lista de viajes */}
                    <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
                                <Route className="w-5 h-5 text-blue-400" />
                            </div>
                            <h3 className="text-base font-semibold">Viajes de este vehículo</h3>
                        </div>

                        {trips.length === 0 && (
                            <div className="text-slate-400 text-sm text-center py-6">
                                No hay viajes asociados a este vehículo.
                            </div>
                        )}

                        {trips.map((t) => (
                            <div key={t.id} className="fuel-card p-4 flex items-center justify-between">
                                <div className="min-w-0">
                                    <div className="font-medium truncate">
                                        {t.origen} → {t.destino}
                                    </div>
                                    <div className="text-xs text-slate-400">ID: {t.id}</div>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${t.estado === "Finalizado"
                                            ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30"
                                            : t.estado === "EnCurso"
                                                ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                                                : "bg-amber-600/20 text-amber-400 border border-amber-600/30"
                                        }`}
                                >
                                    {t.estado}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Móvil con scroll suave */}
            <div className="block md:hidden w-full h-[90vh]">
                <ScrollableContainer className="h-full p-2">
                    <div className="w-full max-w-2xl mx-auto flex flex-col p-6 relative rounded-2xl shadow-xl bg-[#0b1a2f] border border-slate-800 text-white">
                        <button
                            className="absolute right-4 top-4 text-slate-400 hover:text-white"
                            onClick={onClose}
                            aria-label="Cerrar"
                            title="Cerrar"
                        >
                            ✕
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-emerald-600/20 border border-emerald-600/30">
                                <Car className="w-5 h-5 text-emerald-400" />
                            </div>
                            <h2 className="text-lg font-semibold">
                                Vehículo: {vehicle.alias ?? vehicle.tipo ?? "—"}
                                {vehicle.placa ? ` · ${vehicle.placa}` : ""}
                            </h2>
                        </div>

                        <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                            <div className="fuel-card p-4 text-center">
                                <div className="text-slate-400 text-sm mb-1">Modelo</div>
                                <div className="font-semibold">{vehicle.modelo ?? "—"}</div>
                            </div>
                            <div className="fuel-card p-4 text-center">
                                <div className="text-slate-400 text-sm mb-1">Combustible</div>
                                <div className="font-semibold">
                                    {vehicle.nivel != null ? `${level}%` : "—"}
                                </div>
                            </div>
                            <div className="fuel-card p-4 text-center">
                                <div className="text-slate-400 text-sm mb-1">Tipo</div>
                                <div className="font-semibold">{categoria}</div>
                            </div>
                            <div className="fuel-card p-4 text-center">
                                <div className="text-slate-400 text-sm mb-1">Estado</div>
                                <div className="font-semibold">No operativo</div>
                            </div>
                        </div>

                        {vehicle.nivel != null && (
                            <div className="mb-4">
                                <div className="w-full bg-slate-800 rounded-full h-3">
                                    <div className={`h-3 rounded-full ${barColor}`} style={{ width: `${level}%` }} />
                                </div>
                            </div>
                        )}

                        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
                                    <Route className="w-5 h-5 text-blue-400" />
                                </div>
                                <h3 className="text-base font-semibold">Viajes de este vehículo</h3>
                            </div>

                            {trips.length === 0 && (
                                <div className="text-slate-400 text-sm text-center py-6">
                                    No hay viajes asociados a este vehículo.
                                </div>
                            )}

                            {trips.map((t) => (
                                <div key={t.id} className="fuel-card p-4 flex items-center justify-between">
                                    <div className="min-w-0">
                                        <div className="font-medium truncate">
                                            {t.origen} → {t.destino}
                                        </div>
                                        <div className="text-xs text-slate-400">ID: {t.id}</div>
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${t.estado === "Finalizado"
                                                ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30"
                                                : t.estado === "EnCurso"
                                                    ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                                                    : "bg-amber-600/20 text-amber-400 border border-amber-600/30"
                                            }`}
                                    >
                                        {t.estado}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </ScrollableContainer>
            </div>
        </div>
    );
};

export default VehicleTripsModal;
