import React from "react";
import { Car, Route, Calendar, MapPin, Settings, X, Fuel, Activity, Clock, CheckCircle } from "lucide-react";

export type Trip = {
    id: string;
    origen: string;
    destino: string;
    estado: string;
    estimado?: number;
};

type Vehicle = {
    id: string;
    placa: string;
    tipo?: string;
    alias?: string;
    modelo?: string;
    estado?: string;
    nivel?: number;
    brand?: string;
    capacity_liters?: number;
    odometer_km?: number;
    year?: number;
};

type Props = {
    vehicle: Vehicle;
    trips: Trip[];
    onClose: () => void;
};

const VehicleTripsModal: React.FC<Props> = ({ vehicle, trips, onClose }) => {
    const level = Math.max(0, Math.min(100, Math.round(vehicle.nivel ?? 0)));
    const barColor = level > 70 ? "bg-emerald-500" : level > 30 ? "bg-amber-500" : "bg-red-500";

    const getStatusIcon = (estado: string) => {
        switch (estado) {
            case "Finalizado":
                return <CheckCircle className="w-4 h-4 text-emerald-400" />;
            case "EnCurso":
                return <Activity className="w-4 h-4 text-blue-400" />;
            default:
                return <Clock className="w-4 h-4 text-amber-400" />;
        }
    };

    const getStatusColor = (estado: string) => {
        switch (estado) {
            case "Finalizado":
                return "bg-emerald-600/20 text-emerald-400 border-emerald-600/30";
            case "EnCurso":
                return "bg-blue-600/20 text-blue-400 border-blue-600/30";
            default:
                return "bg-amber-600/20 text-amber-400 border-amber-600/30";
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            {/* Desktop */}
            <div className="hidden md:block">
                <div className="w-full max-w-4xl h-[500px] bg-[#0b1a2f] border border-slate-800 rounded-2xl shadow-xl text-white overflow-hidden">
                    {/* Header fijo */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 border border-emerald-500/30">
                                <Car className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">{vehicle.modelo ?? "Vehículo"}</h1>
                                <p className="text-slate-300 text-sm">{vehicle.placa}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Contenido principal con scroll forzado */}
                    <div 
                        className="p-4"
                        style={{ 
                            height: 'calc(500px - 80px)', 
                            overflowY: 'auto',
                            overflowX: 'hidden'
                        }}
                    >
                        <div className="grid grid-cols-12 gap-4">
                            {/* Columna izquierda - Información del vehículo */}
                            <div className="col-span-5 space-y-3">
                                {/* Card principal del vehículo */}
                                <div className="fuel-card p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1.5 rounded-lg bg-blue-600/20 border border-blue-600/30">
                                            <Car className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <h3 className="text-base font-semibold">Información General</h3>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                                            <Calendar className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                                            <div className="text-slate-400 text-xs">Año</div>
                                            <div className="font-bold text-white text-sm">{vehicle.year ?? "—"}</div>
                                        </div>
                                        <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                                            <Settings className="w-4 h-4 text-green-400 mx-auto mb-1" />
                                            <div className="text-slate-400 text-xs">Tipo</div>
                                            <div className="font-bold text-white text-sm">{vehicle.tipo ?? "—"}</div>
                                        </div>
                                        <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                                            <MapPin className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                                            <div className="text-slate-400 text-xs">Kilometraje</div>
                                            <div className="font-bold text-white text-xs">
                                                {vehicle.odometer_km ? `${vehicle.odometer_km.toLocaleString()}` : "—"}
                                            </div>
                                            <div className="text-slate-400 text-xs">km</div>
                                        </div>
                                        <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                                            <Activity className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                                            <div className="text-slate-400 text-xs">Estado</div>
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                                vehicle.estado === "Disponible" 
                                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                                    : vehicle.estado === "Ocupado"
                                                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                                    : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                                            }`}>
                                                {vehicle.estado ?? "—"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card de combustible */}
                                <div className="fuel-card p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1.5 rounded-lg bg-emerald-600/20 border border-emerald-600/30">
                                            <Fuel className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <h3 className="text-base font-semibold">Estado del Combustible</h3>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-white mb-2">{level}%</div>
                                            <div className="w-full bg-slate-800 rounded-full h-3">
                                                <div className={`h-3 rounded-full ${barColor} transition-all duration-500`} style={{ width: `${level}%` }} />
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-slate-400 text-xs">Capacidad</div>
                                            <div className="text-base font-bold text-white">{vehicle.capacity_liters ?? "—"} L</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Columna derecha - Viajes */}
                            <div className="col-span-7">
                                <div className="fuel-card p-4">
                                    <div className="flex items-center gap-2 mb-3 border-b border-slate-700 pb-3">
                                        <div className="p-1.5 rounded-lg bg-blue-600/20 border border-blue-600/30">
                                            <Route className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <h3 className="text-base font-semibold">Viajes Asignados</h3>
                                        {trips.length > 0 && (
                                            <span className="ml-auto px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                                                {trips.length} viajes
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                                        {trips.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                                                <Route className="w-8 h-8 mb-2 text-slate-500" />
                                                <p className="text-sm font-medium">No hay viajes asignados</p>
                                                <p className="text-xs">Los viajes aparecerán aquí cuando se asignen</p>
                                            </div>
                                        ) : (
                                            trips.map((trip) => (
                                                <div key={trip.id} className="fuel-card p-2.5 hover:bg-slate-800/50 transition-colors">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                                            <div className="mt-0.5 shrink-0">
                                                                {getStatusIcon(trip.estado)}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="font-medium text-white text-sm line-clamp-1 mb-0.5">
                                                                    {trip.origen} → {trip.destino}
                                                                </div>
                                                                <div className="text-slate-400 text-xs font-mono mb-0.5">ID: {trip.id.substring(0, 8)}...</div>
                                                                {trip.estimado && (
                                                                    <div className="text-slate-300 text-xs">
                                                                        {trip.estimado} km
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ${getStatusColor(trip.estado)}`}>
                                                            {trip.estado}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Móvil */}
            <div className="block md:hidden w-full h-[500px]">
                <div className="h-full bg-[#0b1a2f] border border-slate-800 rounded-2xl shadow-xl text-white overflow-hidden">
                    {/* Header móvil */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-600/20 border border-emerald-600/30">
                                <Car className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">{vehicle.modelo ?? "Vehículo"}</h2>
                                <p className="text-slate-300 text-sm">{vehicle.placa}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Contenido móvil con scroll forzado */}
                    <div 
                        className="p-4"
                        style={{ 
                            height: 'calc(500px - 80px)', 
                            overflowY: 'auto',
                            overflowX: 'hidden'
                        }}
                    >
                        <div className="space-y-3">
                            {/* Información del vehículo */}
                            <div className="fuel-card p-3">
                                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <Car className="w-3.5 h-3.5 text-blue-400" />
                                    Información General
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                                        <Calendar className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                                        <div className="text-slate-400 text-xs">Año</div>
                                        <div className="font-bold text-white text-sm">{vehicle.year ?? "—"}</div>
                                    </div>
                                    <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                                        <Settings className="w-4 h-4 text-green-400 mx-auto mb-1" />
                                        <div className="text-slate-400 text-xs">Tipo</div>
                                        <div className="font-bold text-white text-sm">{vehicle.tipo ?? "—"}</div>
                                    </div>
                                    <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                                        <MapPin className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                                        <div className="text-slate-400 text-xs">Kilometraje</div>
                                        <div className="font-bold text-white text-xs">
                                            {vehicle.odometer_km ? `${vehicle.odometer_km.toLocaleString()}` : "—"}
                                        </div>
                                        <div className="text-slate-400 text-xs">km</div>
                                    </div>
                                    <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                                        <Activity className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                                        <div className="text-slate-400 text-xs">Estado</div>
                                        <span className={`inline-block px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                            vehicle.estado === "Disponible" 
                                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                                : vehicle.estado === "Ocupado"
                                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                                : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                                        }`}>
                                            {vehicle.estado ?? "—"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Combustible */}
                            <div className="fuel-card p-3">
                                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <Fuel className="w-3.5 h-3.5 text-emerald-400" />
                                    Estado del Combustible
                                </h3>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-white mb-2">{level}%</div>
                                    <div className="w-full bg-slate-800 rounded-full h-3 mb-2">
                                        <div className={`h-3 rounded-full ${barColor} transition-all duration-500`} style={{ width: `${level}%` }} />
                                    </div>
                                    <div className="text-slate-400 text-xs">Capacidad: {vehicle.capacity_liters ?? "—"} L</div>
                                </div>
                            </div>

                            {/* Viajes */}
                            <div className="fuel-card p-3">
                                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <Route className="w-3.5 h-3.5 text-blue-400" />
                                    Viajes Asignados
                                    {trips.length > 0 && (
                                        <span className="ml-auto px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                                            {trips.length}
                                        </span>
                                    )}
                                </h3>
                                
                                {trips.length === 0 ? (
                                    <div className="text-center text-slate-400 py-4">
                                        <Route className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                                        <p className="text-xs">No hay viajes asignados</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                        {trips.map((trip) => (
                                            <div key={trip.id} className="fuel-card p-2 hover:bg-slate-800/50 transition-colors">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-start gap-2 flex-1 min-w-0">
                                                        <div className="mt-0.5 shrink-0">
                                                            {getStatusIcon(trip.estado)}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="font-medium text-white text-xs line-clamp-1 mb-0.5">
                                                                {trip.origen} → {trip.destino}
                                                            </div>
                                                            <div className="text-slate-400 text-xs font-mono mb-0.5">ID: {trip.id.substring(0, 8)}...</div>
                                                            {trip.estimado && (
                                                                <div className="text-slate-300 text-xs">
                                                                    {trip.estimado} km
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ${getStatusColor(trip.estado)}`}>
                                                        {trip.estado}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehicleTripsModal;