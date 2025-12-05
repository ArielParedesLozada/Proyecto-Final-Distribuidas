import React, { useMemo, useState, useEffect } from "react";
import { Eye, CheckCircle, Play, Filter, Route } from "lucide-react";
import TripModal from "./TripModal";
import FinishTripModal from "./FinishTripModal";
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
};

type Props = {
    trips?: Trip[];
    onStart?: (id: string) => void;
    onFinish?: (id: string) => void;
};

const ONE_DAY = 24 * 60 * 60 * 1000;
const PER_PAGE = 6;

// ----------------------
// MAP ROUTEPROTO → TRIP
// ----------------------
const mapRoutesToDisplay = (r: RouteProto): Trip => {
    // Mapear campos desde snake_case o camelCase
    const id = r.id || "";
    const originName = r.originName || r.origin_name || "Origen desconocido";
    const destinationName = r.destinationName || r.destination_name || "Destino desconocido";
    const status = r.status || 0;
    const distanceKm = r.distanceKm || r.distance_km || 0;
    const startedAt = r.startedAt || r.started_at;
    const completedAt = r.completedAt || r.completed_at;
    const assignedAt = r.assignedAt || r.assigned_at;
    const createdAt = r.createdAt || r.created_at;

    // Mapear status (puede venir como número o string)
    const statusMap: Record<string | number, Trip["estado"]> = {
        "ROUTE_STATE_UNASSIGNED": "Planificado",
        "ROUTE_STATE_ASSIGNED": "Planificado",
        "ROUTE_STATE_STARTED": "EnCurso",
        "ROUTE_STATE_COMPLETED": "Finalizado",
        0: "Planificado", // UNASSIGNED
        1: "Planificado", // ASSIGNED
        2: "EnCurso",     // STARTED
        3: "Finalizado",  // COMPLETED
    };

    // Manejar campos opcionales y fechas
    const parseDate = (dateStr: string | null | undefined): number | null => {
        if (!dateStr) return null;
        try {
            // Si viene como objeto Timestamp de protobuf
            if (typeof dateStr === 'object' && dateStr !== null && 'seconds' in dateStr) {
                const ts = dateStr as any;
                return ts.seconds * 1000 + (ts.nanos || 0) / 1000000;
            }
            // Si viene como string ISO
            return Date.parse(dateStr);
        } catch {
            return null;
        }
    };

    const estado = statusMap[status] || "Planificado";

    return {
        id,
        origen: originName,
        destino: destinationName,
        estado,
        estimado: distanceKm,
        inicioAt: parseDate(startedAt),
        finAt: parseDate(completedAt),
        programadoAt: parseDate(assignedAt) || parseDate(createdAt) || null,
    };
};

const DriverTrips: React.FC<Props> = ({
    onStart,
    onFinish,
}) => {
    // --- Estado para rutas reales ---
    const [apiRoutes, setApiRoutes] = useState<Trip[]>([]);
    const [apiRoutesData, setApiRoutesData] = useState<RouteProto[]>([]); // Guardar datos completos de la API
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

                console.log("🔄 Cargando rutas del conductor desde /routes/my");
                const response = await api<ListRoutesResponse>("/routes/my");
                if (cancelled) return;

                console.log("📦 Respuesta recibida:", response);
                console.log("📋 Rutas recibidas:", response.routes?.length || 0);

                // Verificar que response.routes existe y es un array
                if (!response || !response.routes || !Array.isArray(response.routes)) {
                    console.warn("⚠️ Respuesta inválida o sin rutas:", response);
                    setApiRoutes([]);
                    return;
                }

                const mapped = response.routes.map(mapRoutesToDisplay);
                console.log("✅ Rutas mapeadas:", mapped.length);
                setApiRoutes(mapped);
                setApiRoutesData(response.routes); // Guardar datos completos para acceder a estimatedFuelConsumptionLiters

            } catch (err: any) {
                if (cancelled) return;
                const msg = err instanceof Error ? err.message : String(err);
                console.error("❌ Error al cargar rutas:", msg);
                setError(msg || "Error al cargar rutas");
                setApiRoutes([]); // Asegurar que no haya datos residuales
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
    const [tripToFinish, setTripToFinish] = useState<Trip | null>(null);
    const [isStarting, setIsStarting] = useState<string | null>(null);
    const [isFinishing, setIsFinishing] = useState<string | null>(null);

    // Función para iniciar un viaje
    const handleStart = async (tripId: string) => {
        if (isStarting) return; // Evitar múltiples clics

        try {
            setIsStarting(tripId);
            console.log("🚀 Iniciando viaje:", tripId);

            // Llamar al endpoint para iniciar la ruta
            // El backend espera el id tanto en la URL como en el body (body: "*" en el proto)
            await api(`/routes/start/${tripId}`, {
                method: "PATCH",
                body: JSON.stringify({
                    id: tripId,
                }),
            });

            console.log("✅ Viaje iniciado correctamente");

            // Recargar la lista de rutas
            const response = await api<ListRoutesResponse>("/routes/my");
            if (response && response.routes && Array.isArray(response.routes)) {
                const mapped = response.routes.map(mapRoutesToDisplay);
                setApiRoutes(mapped);
            }

            // Llamar al callback si existe
            onStart?.(tripId);
        } catch (err: any) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error("❌ Error al iniciar viaje:", msg);
            setError(msg || "Error al iniciar el viaje");
            // Mostrar error temporalmente
            setTimeout(() => setError(""), 5000);
        } finally {
            setIsStarting(null);
        }
    };

    // Función para abrir el modal de finalización
    const handleFinishClick = (tripId: string) => {
        const trip = allTrips.find(t => t.id === tripId);
        if (trip) {
            setTripToFinish(trip);
        }
    };

    // Función para finalizar un viaje (llamada desde el modal)
    const handleFinish = async (realDistanceKm: number, realFuelConsumptionLiters: number) => {
        if (!tripToFinish || isFinishing) return;

        const tripId = tripToFinish.id;

        setIsFinishing(tripId);
        console.log("🏁 Finalizando viaje:", tripId, "Distancia:", realDistanceKm, "Combustible:", realFuelConsumptionLiters);

        try {
            // Llamar al endpoint para finalizar la ruta
            await api(`/routes/end/${tripId}`, {
                method: "PATCH",
                body: JSON.stringify({
                    id: tripId,
                    real_distance_km: realDistanceKm,
                    real_fuel_consumption_liters: realFuelConsumptionLiters,
                }),
            });

            console.log("✅ Viaje finalizado correctamente");

            // Recargar la lista de rutas
            const response = await api<ListRoutesResponse>("/routes/my");
            if (response && response.routes && Array.isArray(response.routes)) {
                const mapped = response.routes.map(mapRoutesToDisplay);
                setApiRoutes(mapped);
                setApiRoutesData(response.routes);
            }

            // Cerrar el modal
            setTripToFinish(null);

            // Llamar al callback si existe
            onFinish?.(tripId);
        } catch (err: any) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error("❌ Error al finalizar viaje:", msg);
            // Re-lanzar el error para que el modal lo capture y muestre
            throw err;
        } finally {
            setIsFinishing(null);
        }
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

            {!isLoading && !error && allTrips.length === 0 && (
                <div className="col-span-full">
                    <EmptyState
                        asCard
                        icon={Route}
                        title="Aún no tienes viajes asignados"
                        description="Cuando te asignen una ruta, aparecerá aquí. Contacta con tu supervisor si necesitas más información."
                    />
                </div>
            )}

            {!isLoading && !error && allTrips.length > 0 && (
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
                                            className="fuel-button-secondary flex items-center gap-2 px-3 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={() => handleStart(trip.id)}
                                            disabled={isStarting === trip.id}
                                        >
                                            <Play className="w-4 h-4" /> 
                                            {isStarting === trip.id ? "Iniciando..." : "Iniciar"}
                                        </button>
                                    )}

                                    {trip.estado === "EnCurso" && (
                                        <button
                                            type="button"
                                            className="fuel-button flex items-center gap-2 px-3 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleFinishClick(trip.id);
                                            }}
                                            disabled={isFinishing === trip.id || tripToFinish !== null}
                                        >
                                            <CheckCircle className="w-4 h-4" /> 
                                            {isFinishing === trip.id ? "Finalizando..." : "Finalizar"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {total === 0 && allTrips.length > 0 && (
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
                />
            )}

            {tripToFinish && (() => {
                const routeData = apiRoutesData.find(r => (r.id || "") === tripToFinish.id);
                const distanciaEstimada = tripToFinish.estimado || 0;
                const consumoEstimado = routeData?.estimatedFuelConsumptionLiters || 
                                       routeData?.estimated_fuel_consumption_liters || 0;
                
                return (
                    <FinishTripModal
                        key={tripToFinish.id} // Usar key para evitar problemas de re-renderizado
                        tripId={tripToFinish.id}
                        origen={tripToFinish.origen}
                        destino={tripToFinish.destino}
                        distanciaEstimada={distanciaEstimada}
                        consumoEstimado={consumoEstimado}
                        onClose={() => {
                            // Solo cerrar si no está guardando
                            if (!isFinishing) {
                                setTripToFinish(null);
                            }
                        }}
                        onSubmit={handleFinish}
                    />
                );
            })()}
        </div>
    );
};

export default DriverTrips;
