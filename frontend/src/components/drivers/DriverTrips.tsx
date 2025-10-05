import React, { useMemo, useState } from "react";
import { Eye, CheckCircle, Play, Fuel } from "lucide-react";
import TripModal from "./TripModal";
import FuelRequestModal from "./FuelRequestModal";

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

type Props = {
    trips?: Trip[]; 
    onStart?: (id: string) => void;
    onFinish?: (id: string) => void;
    onAddObs?: (tripId: string, text: string) => void;
    onAskFuel?: (tripId: string) => void;
};

const now = Date.now();
const DEMO_TRIPS: Trip[] = [
    {
        id: "VIA-001",
        origen: "Ambato",
        destino: "Quito",
        estado: "Planificado",
        estimado: 35,
        inicioAt: null,
        finAt: null,
        observations: [
            { id: "o1", text: "Revisar neumáticos antes de salir.", ts: now - 1000 * 60 * 60 * 5 },
        ],
    },
    {
        id: "VIA-002",
        origen: "Latacunga",
        destino: "Ambato",
        estado: "EnCurso",
        estimado: 20,
        inicioAt: now - 1000 * 60 * 45,
        finAt: null,
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
        inicioAt: null,
        finAt: null,
        observations: [],
    },
    {
        id: "VIA-005",
        origen: "Ambato",
        destino: "Guaranda",
        estado: "EnCurso",
        estimado: 22,
        inicioAt: now - 1000 * 60 * 20,
        finAt: null,
        observations: [{ id: "o5", text: "Parada breve para verificar carga.", ts: now - 1000 * 60 * 12 }],
    },
    {
        id: "VIA-006",
        origen: "Tena",
        destino: "Ambato",
        estado: "Planificado",
        estimado: 40,
        inicioAt: null,
        finAt: null,
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
    const data = useMemo(() => (trips && trips.length ? trips : DEMO_TRIPS), [trips]);

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

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.map((trip) => (
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

                {data.length === 0 && (
                    <div className="text-center text-slate-400 col-span-full py-12">
                        No hay viajes asignados actualmente.
                    </div>
                )}
            </div>

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
