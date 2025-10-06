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

export type Trip = {
    id: string;
    origen: string;
    destino: string;
    estado: "Planificado" | "EnCurso" | "Finalizado";
    estimado?: number;
    inicioAt?: number | null;
    finAt?: number | null;
    programadoAt?: number | null; // para Próximas 24 h
    observations: Array<{ id: string; text: string; ts: number }>;
};

type Props = {
    trips?: Trip[];
    onStart?: (id: string) => void;
    onFinish?: (id: string) => void;
    onAddObs?: (tripId: string, text: string) => void;
    onAskFuel?: (tripId: string) => void;
};

const now = Date.now();
const ONE_DAY = 24 * 60 * 60 * 1000;
const PER_PAGE = 6;

const DEMO_TRIPS: Trip[] = [
    {
        id: "VIA-001",
        origen: "Ambato",
        destino: "Quito",
        estado: "Planificado",
        estimado: 35,
        programadoAt: now + 2 * 60 * 60 * 1000,
        observations: [{ id: "o1", text: "Revisar neumáticos antes de salir.", ts: now - 1000 * 60 * 60 * 5 }],
    },
    {
        id: "VIA-002",
        origen: "Latacunga",
        destino: "Ambato",
        estado: "EnCurso",
        estimado: 20,
        inicioAt: now - 1000 * 60 * 45,
        programadoAt: now - 1000 * 60 * 60,
        observations: [
            { id: "o2", text: "Tráfico moderado en Panamericana.", ts: now - 1000 * 60 * 30 },
            { id: "o3", text: "Clima lluvioso, conducir con precaución.", ts: now - 1000 * 60 * 10 },
        ],
    },
    {
        id: "VIA-003",
        origen: "Riobamba",
        destino: "Baños",
        estado: "Finalizado",
        estimado: 18,
        inicioAt: now - 1000 * 60 * 60 * 3,
        finAt: now - 1000 * 60 * 60 * 2,
        observations: [{ id: "o4", text: "Viaje sin novedades.", ts: now - 1000 * 60 * 60 * 2 }],
    },
    {
        id: "VIA-004",
        origen: "Pelileo",
        destino: "Puyo",
        estado: "Planificado",
        estimado: 28,
        programadoAt: now + 26 * 60 * 60 * 1000,
        observations: [],
    },
    {
        id: "VIA-005",
        origen: "Ambato",
        destino: "Guaranda",
        estado: "EnCurso",
        estimado: 22,
        inicioAt: now - 1000 * 60 * 20,
        programadoAt: now - 1000 * 60 * 40,
        observations: [{ id: "o5", text: "Parada breve para verificar carga.", ts: now - 1000 * 60 * 12 }],
    },
    {
        id: "VIA-006",
        origen: "Tena",
        destino: "Ambato",
        estado: "Planificado",
        estimado: 40,
        programadoAt: now + 5 * 60 * 60 * 1000,
        observations: [],
    },
];

const DriverTrips: React.FC<Props> = ({
    trips,
    onStart,
    onFinish,
    onAddObs,
    onAskFuel,
}) => {
    // Fuente
    const allTrips = useMemo<Trip[]>(
        () => (trips && trips.length ? trips : DEMO_TRIPS),
        [trips]
    );

    // Filtros (controlados)
    const [filters, setFilters] = useState<TripFiltersValue>({ ...DEFAULT_TRIP_FILTERS });

    const uniqueCities = useMemo(
        () => Array.from(new Set(allTrips.flatMap((t) => [t.origen, t.destino]))).sort(),
        [allTrips]
    );

    const counts = useMemo(
        () => ({
            Planificado: allTrips.filter((t) => t.estado === "Planificado").length,
            EnCurso: allTrips.filter((t) => t.estado === "EnCurso").length,
            Finalizado: allTrips.filter((t) => t.estado === "Finalizado").length,
        }),
        [allTrips]
    );

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

    // Paginación
    const [page, setPage] = useState(1);

    // Si cambian los filtros, vuelve a la página 1
    useEffect(() => {
        setPage(1);
    }, [filters]);

    // Clamp si el total cambia y la página queda fuera de rango
    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(filteredTrips.length / PER_PAGE));
        if (page > totalPages) setPage(totalPages);
    }, [filteredTrips.length, page]);

    const { pageData, total } = useMemo(() => {
        const total = filteredTrips.length;
        const start = (page - 1) * PER_PAGE;
        const end = start + PER_PAGE;
        return { pageData: filteredTrips.slice(start, end), total };
    }, [filteredTrips, page]);

    // Modales
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [fuelTrip, setFuelTrip] = useState<Trip | null>(null);

    const handleFuelSubmit = (_litros: number, tripId?: string) => {
        if (tripId) onAskFuel?.(tripId);
        setFuelTrip(null);
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                    Mis Viajes
                </h1>
                <p className="text-slate-400">Gestiona tus viajes y observaciones</p>
            </div>

            {/* Filtros reutilizables */}
            <TripFilters
                value={filters}
                onChange={setFilters}
                counts={counts}
                suggestions={uniqueCities}
            />

            {/* Lista (paginada) */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {pageData.map((trip) => (
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
                                className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${trip.estado === "Finalizado"
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

            <div>
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
