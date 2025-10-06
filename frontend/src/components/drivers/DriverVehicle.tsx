import React, { useMemo, useState } from "react";
import { Gauge, Eye, Car } from "lucide-react";
import VehicleTripsModal from "./VehicleTripsModal";
import type { Trip } from "./VehicleTripsModal";
import Pagination from "../../shared/Pagination";
import EmptyState from "../../shared/EmptyState";

type Vehicle = {
    placa: string;
    tipo: string;
    modelo?: string;
    /** estado se mantiene por compatibilidad pero ya no se muestra */
    estado?: string;
    nivel: number; // %
    alias?: string;
};

type Props = {
    vehicle?: Vehicle;
    vehicles?: Vehicle[];
    tripsByVehicle?: Record<string, Trip[]>;
};

/* ---------------- Demo fallback ---------------- */
const now = Date.now();
const DEMO_VEHICLES: Vehicle[] = [
    { placa: "PAC-1234", tipo: "Camioneta", modelo: "Hilux 2.8", estado: "Operativo", nivel: 32, alias: "Hilux" },
    { placa: "TBA-0987", tipo: "Furgón", modelo: "Sprinter 415", estado: "Operativo", nivel: 76 },
    { placa: "ABC-5678", tipo: "SUV", modelo: "Patrol 4.0", estado: "Taller", nivel: 58, alias: "Patrol" },
    { placa: "PBC-1122", tipo: "Camioneta", modelo: "Dmax 3.0", estado: "Operativo", nivel: 41, alias: "D-Max" },
    { placa: "MNO-5566", tipo: "Furgón", modelo: "Boxer", estado: "Operativo", nivel: 87 },
    { placa: "XYZ-0001", tipo: "SUV", modelo: "Fortuner", estado: "Operativo", nivel: 63 },
];

const demoTrips = (from: string): Trip[] => [
    { id: `${from}-VIA-01`, origen: "Ambato", destino: "Quito", estado: "Planificado", inicioAt: null, finAt: null, estimado: 30, observations: [] },
    { id: `${from}-VIA-02`, origen: "Latacunga", destino: "Ambato", estado: "EnCurso", inicioAt: now - 1000 * 60 * 25, finAt: null, estimado: 18, observations: [] },
    { id: `${from}-VIA-03`, origen: "Riobamba", destino: "Baños", estado: "Finalizado", inicioAt: now - 1000 * 60 * 120, finAt: now - 1000 * 60 * 70, estimado: 15, observations: [] },
];
/* ------------------------------------------------ */

const PER_PAGE = 5;

const DriverVehicle: React.FC<Props> = ({
    vehicle,
    vehicles,
    tripsByVehicle,
}) => {
    const source: Vehicle[] = useMemo(() => {
        if (typeof vehicles !== "undefined") return vehicles;
        if (vehicle) return [vehicle];
        return DEMO_VEHICLES;
    }, [vehicle, vehicles]);

    const [page, setPage] = useState(1);

    const { data, total } = useMemo(() => {
        const total = source.length;
        const start = (page - 1) * PER_PAGE;
        const end = start + PER_PAGE;
        return { data: source.slice(start, end), total };
    }, [source, page]);

    const [openVeh, setOpenVeh] = useState<Vehicle | null>(null);

    const getTrips = (placa: string): Trip[] => {
        if (tripsByVehicle && tripsByVehicle[placa]) return tripsByVehicle[placa];
        return demoTrips(placa);
    };

    React.useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(source.length / PER_PAGE));
        if (page > totalPages) setPage(totalPages);
    }, [source.length, page]);

    return (
        <div className="space-y-6">
            {/* Título */}
            <div className="text-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                    Mis Vehículos
                </h1>
                <p className="text-slate-400">Listado de vehículos asignados y sus viajes</p>
            </div>

            {/* Lista de cards */}
            <div className="max-w-5xl mx-auto space-y-4">
                {data.map((v) => {
                    const level = Math.max(0, Math.min(100, Math.round(v.nivel)));
                    const barColor =
                        level > 70 ? "bg-emerald-500" : level > 30 ? "bg-amber-500" : "bg-red-500";
                    const modeloToShow = v.modelo ?? v.estado ?? "—";

                    return (
                        <div
                            key={v.placa}
                            className="fuel-card p-5 flex items-center justify-between hover:shadow-lg transition-all"
                        >
                            {/* Izquierda */}
                            <div className="flex-1 min-w-0 pr-4">
                                <div className="font-semibold text-white text-lg truncate">
                                    {v.alias ?? v.tipo} · {v.placa}
                                </div>

                                <div className="text-sm text-slate-400">Modelo: {modeloToShow}</div>

                                <div className="mt-3 flex items-center gap-2">
                                    <Gauge className="w-4 h-4 text-slate-400 shrink-0" />
                                    <div className="flex-1">
                                        <div className="w-full bg-slate-800 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${barColor}`}
                                                style={{ width: `${level}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-300 shrink-0">{level}%</span>
                                </div>
                            </div>

                            {/* Acciones */}
                            <div className="shrink-0">
                                <button
                                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all"
                                    title="Ver viajes del vehículo"
                                    onClick={() => setOpenVeh(v)}
                                >
                                    <Eye className="w-5 h-5 text-slate-200" />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {source.length === 0 && (
                    <EmptyState
                        asCard
                        icon={Car}
                        title="No tienes vehículos asignados"
                        description="Cuando te asignen uno, aparecerá aquí."
                    />
                )}
            </div>

            <div className="max-w-5xl mx-auto">
                <Pagination
                    page={page}
                    perPage={PER_PAGE}
                    total={total}
                    onPageChange={setPage}
                    window={2}
                    compact
                    className="mt-2"
                />
            </div>

            {/* Modal: viajes por vehículo */}
            {openVeh && (
                <VehicleTripsModal
                    vehicle={openVeh}
                    trips={getTrips(openVeh.placa)}
                    onClose={() => setOpenVeh(null)}
                />
            )}
        </div>
    );
};

export default DriverVehicle;
