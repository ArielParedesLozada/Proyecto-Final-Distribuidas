import React, { useMemo, useState, useEffect } from "react";
import { Gauge, Eye, Car, Loader2, AlertCircle } from "lucide-react";
import VehicleTripsModal from "./VehicleTripsModal";
import type { Trip } from "./VehicleTripsModal";
import Pagination from "../../shared/Pagination";
import EmptyState from "../../shared/EmptyState";
import { api } from "../../api/api";
import type { Vehicle as ApiVehicle, ListVehiclesByDriverResponse } from "../../types/vehicle";

type VehicleDisplay = {
    id: string;
    placa: string;
    tipo: string;
    modelo?: string;
    estado?: string;
    nivel: number; 
    brand?: string;
    capacity_liters: number;
    odometer_km: number;
    year: number;
};

type Props = {
    vehicle?: VehicleDisplay;
    vehicles?: VehicleDisplay[];
    tripsByVehicle?: Record<string, Trip[]>;
};

/* ---------------- Demo fallback ---------------- */
const now = Date.now();
const demoTrips = (from: string): Trip[] => [
    { id: `${from}-VIA-01`, origen: "Ambato", destino: "Quito", estado: "Planificado", inicioAt: null, finAt: null, estimado: 30, observations: [] },
    { id: `${from}-VIA-02`, origen: "Latacunga", destino: "Ambato", estado: "EnCurso", inicioAt: now - 1000 * 60 * 25, finAt: null, estimado: 18, observations: [] },
    { id: `${from}-VIA-03`, origen: "Riobamba", destino: "Baños", estado: "Finalizado", inicioAt: now - 1000 * 60 * 120, finAt: now - 1000 * 60 * 70, estimado: 15, observations: [] },
];
/* ------------------------------------------------ */

const PER_PAGE = 5;

// Mapeo de estados
const vehicleStatusLabels: Record<number, string> = {
    1: "Activo",
    2: "Inactivo",
};

// Convertir vehículo del API al formato de display
const mapVehicleToDisplay = (v: ApiVehicle): VehicleDisplay => {
    // Simular nivel de combustible (en el futuro vendrá del backend)
    const nivel = Math.floor(Math.random() * 100); // Temporal
    
    return {
        id: v.id,
        placa: v.plate,
        tipo: v.type,
        modelo: `${v.brand} ${v.model}`,
        estado: vehicleStatusLabels[v.status] || "Desconocido",
        nivel,
        brand: v.brand,
        capacity_liters: v.capacity_liters,
        odometer_km: v.odometer_km,
        year: v.year,
    };
};

const DriverVehicle: React.FC<Props> = ({ vehicle, vehicles, tripsByVehicle }) => {
    const [apiVehicles, setApiVehicles] = useState<VehicleDisplay[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>("");

    // Cargar vehículos del conductor desde el API
    useEffect(() => {
        let cancelled = false;

        const fetchVehicles = async () => {
            try {
                setIsLoading(true);
                setError("");

                // Llamar al endpoint que devuelve los vehículos del conductor logueado
                const response = await api<ListVehiclesByDriverResponse>("/me/vehicles");
                
                if (cancelled) return;

                // Mapear los vehículos del API al formato de display
                const mappedVehicles = response.vehicles.map(mapVehicleToDisplay);
                setApiVehicles(mappedVehicles);
            } catch (err: any) {
                if (cancelled) return;
                
                const errorMessage = err instanceof Error ? err.message : String(err);
                console.error("❌ Error al cargar vehículos:", errorMessage);
                setError(errorMessage || "Error al cargar vehículos");
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        // Solo hacer fetch si no se pasaron vehículos como props
        if (!vehicles && !vehicle) {
            fetchVehicles();
        } else {
            setIsLoading(false);
        }

        return () => {
            cancelled = true;
        };
    }, [vehicles, vehicle]);

    const source: VehicleDisplay[] = useMemo(() => {
        if (typeof vehicles !== "undefined") return vehicles;
        if (vehicle) return [vehicle];
        return apiVehicles;
    }, [vehicle, vehicles, apiVehicles]);

    const [page, setPage] = useState(1);

    const { data, total } = useMemo(() => {
        const total = source.length;
        const start = (page - 1) * PER_PAGE;
        const end = start + PER_PAGE;
        return { data: source.slice(start, end), total };
    }, [source, page]);

    const [openVeh, setOpenVeh] = useState<VehicleDisplay | null>(null);

    const getTrips = (placa: string): Trip[] => {
        if (tripsByVehicle && tripsByVehicle[placa]) return tripsByVehicle[placa];
        return demoTrips(placa);
    };

    React.useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(source.length / PER_PAGE));
        if (page > totalPages) setPage(totalPages);
    }, [source.length, page]);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-slate-400">Cargando vehículos...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center max-w-md mx-auto p-8 fuel-card">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Error al cargar vehículos</h2>
                    <p className="text-slate-400 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full px-2 sm:px-4">
            {/* Título */}
            <div className="text-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                    Mis Vehículos
                </h1>
                <p className="text-slate-400">Listado de vehículos asignados y sus viajes</p>
            </div>

            {/* Lista de cards (ancho fluido) */}
            <div className="space-y-4">
                {data.map((v) => {
                    const level = Math.max(0, Math.min(100, Math.round(v.nivel)));
                    const barColor = level > 70 ? "bg-emerald-500" : level > 30 ? "bg-amber-500" : "bg-red-500";
                    const modeloToShow = v.modelo ?? v.estado ?? "—";
                    const displayName = v.brand ? `${v.brand} ${v.tipo}` : v.tipo;

                    return (
                        <div key={v.id} className="fuel-card p-5 flex items-center justify-between hover:shadow-lg transition-all">
                            {/* Izquierda */}
                            <div className="flex-1 min-w-0 pr-4">
                                <div className="font-semibold text-white text-lg truncate">
                                    {displayName} · {v.placa}
                                </div>

                                <div className="text-sm text-slate-400">
                                    {modeloToShow}
                                    {v.estado && <span className="ml-2 text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-300">
                                        {v.estado}
                                    </span>}
                                </div>

                                <div className="mt-3 flex items-center gap-2">
                                    <Gauge className="w-4 h-4 text-slate-400 shrink-0" />
                                    <div className="flex-1">
                                        <div className="w-full bg-slate-800 rounded-full h-2">
                                            <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${level}%` }} />
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-300 shrink-0">{level}%</span>
                                </div>
                            </div>

                            {/* Acciones */}
                            <div className="shrink-0">
                                <button
                                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all"
                                    title="Ver detalles del vehículo"
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
                        icon={Car} 
                        title="No tienes vehículos asignados" 
                        description="Cuando te asignen uno, aparecerá aquí." 
                    />
                )}
            </div>

            <div>
                <Pagination page={page} perPage={PER_PAGE} total={total} onPageChange={setPage} window={2} compact className="mt-2" />
            </div>

            {openVeh && (
                <VehicleTripsModal vehicle={openVeh} trips={getTrips(openVeh.placa)} onClose={() => setOpenVeh(null)} />
            )}
        </div>
    );
};

export default DriverVehicle;
