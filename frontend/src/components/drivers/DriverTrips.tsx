import React, { useMemo, useState, useEffect } from "react";
import { Eye, CheckCircle, Play, Fuel, Filter } from "lucide-react";
import TripModal from "./TripModal";
import FuelRequestModal from "./FuelRequestModal";
import EmptyState from "../../shared/EmptyState";
import Pagination from "../../shared/Pagination";
import TripFilters, {
    type TripFiltersValue,
    type TripStatus,
    DEFAULT_TRIP_FILTERS,
} from "../../shared/TripFilters";
import api from "../../api/api";
import type { ListRoutesResponse, RouteProto } from "../../types/trip";

export type Trip = {
    id: string;
    origen: string;
    destino: string;
    estado: "Planificado" | "EnCurso" | "Finalizado";
    estimado?: number;
    inicioAt?: number | null;
    finAt?: number | null;
    programadoAt?: number | null;
    observations: Array<{ id: string; text: string; ts: number }>;
};

type Props = {
    trips?: Trip[];
    onStart?: (id: string) => void;
    onFinish?: (id: string) => void;
    onAddObs?: (tripId: string, text: string) => void;
    onAskFuel?: (tripId: string) => void;
};

const ONE_DAY = 24 * 60 * 60 * 1000;
const PER_PAGE = 6;

// ----------------------
// MAP ROUTEPROTO → TRIP
// ----------------------
const mapRoutesToDisplay = (r: RouteProto): Trip => {
    const statusMap: Record<RouteProto["status"], Trip["estado"]> = {
        ROUTE_STATE_UNASSIGNED: "Planificado",
        ROUTE_STATE_ASSIGNED: "Planificado",
        ROUTE_STATE_STARTED: "EnCurso",
        ROUTE_STATE_COMPLETED: "Finalizado",
    };

    return {
        id: r.id,
        origen: r.originName,
        destino: r.destinationName,
        estado: statusMap[r.status],
        estimado: r.distanceKm,
        inicioAt: r.startedAt ? Date.parse(r.startedAt) : null,
        finAt: r.completedAt ? Date.parse(r.completedAt) : null,
        programadoAt: Date.parse(r.assignedAt), // para próximos 24h
        observations: [], // no hay observaciones en la API aún
    };
};

const DriverTrips: React.FC<Props> = ({
    onStart,
    onFinish,
    onAddObs,
    onAskFuel,
}) => {
    // --- Estado para rutas reales ---
    const [apiRoutes, setApiRoutes] = useState<Trip[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>("");

    // --- Filtros ---
    const [filters, setFilters] = useState<TripFiltersValue>({
        ...DEFAULT_TRIP_FILTERS,
    });

    // ----------------------------------------
    // FETCH A LA API (solo al montar el comp.)
    // ----------------------------------------
    useEffect(() => {
        let cancelled = false;

        const fetchTrips = async () => {
            try {
                setIsLoading(true);
                setError("");

                const response = await api<ListRoutesResponse>("/routes/my");
                if (cancelled) return;

                const mapped = response.routes.map(mapRoutesToDisplay);
                setApiRoutes(mapped);

            } catch (err: any) {
                if (cancelled) return;
                const msg = err instanceof Error ? err.message : String(err);
                console.error("❌ Error al cargar rutas:", msg);
                setError(msg || "Error al cargar rutas");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        fetchTrips();
        return () => {
            cancelled = true;
        };
    }, []);

    // Ahora **allTrips** viene de la API
    const allTrips = apiRoutes;

    // Unique cities
    const uniqueCities = useMemo(
        () => Array.from(new Set(allTrips.flatMap(t => [t.origen, t.destino]))).sort(),
        [allTrips]
    );

    // Contadores
    const counts = useMemo(() => ({
        Planificado: allTrips.filter(t => t.estado === "Planificado").length,
        EnCurso: allTrips.filter(t => t.estado === "EnCurso").length,
        Finalizado: allTrips.filter(t => t.estado === "Finalizado").length,
    }), [allTrips]);

    // ------------------------
    // FILTRADO LOCAL
    // ------------------------
    const filteredTrips = useMemo(() => {
        const q = filters.city.trim().toLowerCase();
        const nowTs = Date.now();

        return allTrips.filter((t) => {
            if (q && !(t.origen.toLowerCase().includes(q) || t.destino.toLowerCase().includes(q)))
                return false;

            if (filters.status.length && !filters.status.includes(t.estado as TripStatus))
                return false;

            if (filters.onlyNext24h) {
                const ts = t.programadoAt ?? t.inicioAt ?? null;
                if (!ts) return false;
                if (!(ts >= nowTs && ts <= nowTs + ONE_DAY)) return false;
            }

            return true;
        });
    }, [allTrips, filters]);

    // --- Paginación ---
    const [page, setPage] = useState(1);

    useEffect(() => setPage(1), [filters]);

    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(filteredTrips.length / PER_PAGE));
        if (page > totalPages) setPage(totalPages);
    }, [filteredTrips.length, page]);

    const { pageData, total } = useMemo(() => {
        const total = filteredTrips.length;
        const start = (page - 1) * PER_PAGE;
        return {
            pageData: filteredTrips.slice(start, start + PER_PAGE),
            total,
        };
    }, [filteredTrips, page]);

    // --- Modales ---
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [fuelTrip, setFuelTrip] = useState<Trip | null>(null);

    const handleFuelSubmit = (_litros: number, tripId?: string) => {
        if (tripId) onAskFuel?.(tripId);
        setFuelTrip(null);
    };

    // -----------------------------
    // 🟦 RENDER
    // -----------------------------
    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                    Mis Viajes
                </h1>
                <p className="text-slate-400">Gestiona tus viajes y observaciones</p>
            </div>

            {isLoading && (
                <div className="text-center text-slate-400">Cargando viajes...</div>
            )}

            {error && (
                <div className="text-center text-red-400">{error}</div>
            )}

            {!isLoading && !error && (
                <>
                    <TripFilters
                        value={filters}
                        onChange={setFilters}
                        counts={counts}
                        suggestions={uniqueCities}
                    />

                    {/* Lista */}
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {pageData.map(trip => (
                            <div
                                key={trip.id}
                                className="fuel-card flex items-center justify-between p-4 hover:shadow-lg transition-all"
                            >
                                <div className="min-w-0">
                                    <div className="font-semibold text-white text-lg truncate">
                                        {trip.origen} → {trip.destino}
                                    </div>
                                    <div className="text-sm text-slate-400">ID: {trip.id}</div>

                                    <span
                                        className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                                            trip.estado === "Finalizado"
                                                ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30"
                                                : trip.estado === "EnCurso"
                                                ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                                                : "bg-amber-600/20 text-amber-400 border border-amber-600/30"
                                        }`}
                                    >
                                        {trip.estado}
                                    </span>
                                </div>

                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    <button
                                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all"
                                        title="Ver Detalle"
                                        onClick={() => setSelectedTrip(trip)}
                                    >
                                        <Eye className="w-5 h-5 text-slate-200" />
                                    </button>

                                    {trip.estado === "Planificado" && (
                                        <button
                                            className="fuel-button-secondary flex items-center gap-2 px-3 py-1 text-xs"
                                            onClick={() => onStart?.(trip.id)}
                                        >
                                            <Play className="w-4 h-4" /> Iniciar
                                        </button>
                                    )}

                                    {trip.estado === "EnCurso" && (
                                        <button
                                            className="fuel-button flex items-center gap-2 px-3 py-1 text-xs"
                                            onClick={() => onFinish?.(trip.id)}
                                        >
                                            <CheckCircle className="w-4 h-4" /> Finalizar
                                        </button>
                                    )}

                                    <button
                                        className="fuel-button-secondary flex items-center gap-2 px-3 py-1 text-xs"
                                        onClick={() => setFuelTrip(trip)}
                                    >
                                        <Fuel className="w-4 h-4" /> Gasolina
                                    </button>
                                </div>
                            </div>
                        ))}

                        {total === 0 && (
                            <div className="col-span-full">
                                <EmptyState
                                    asCard
                                    icon={Filter}
                                    title="No hay viajes que coincidan con tus filtros"
                                    description="Ajusta la ciudad, el estado o la ventana de 24 h."
                                />
                            </div>
                        )}
                    </div>

                    <Pagination
                        page={page}
                        perPage={PER_PAGE}
                        total={total}
                        onPageChange={setPage}
                        window={2}
                        compact
                        className="mt-2"
                    />
                </>
            )}

            {/* Modales */}
            {selectedTrip && (
                <TripModal
                    trip={selectedTrip}
                    onClose={() => setSelectedTrip(null)}
                    onAddObs={onAddObs}
                />
            )}

            {fuelTrip && (
                <FuelRequestModal
                    currentLevel={30}
                    tripId={fuelTrip.id}
                    tripEstado={fuelTrip.estado}
                    onClose={() => setFuelTrip(null)}
                    onSubmit={handleFuelSubmit}
                />
            )}
        </div>
    );
};

export default DriverTrips;
