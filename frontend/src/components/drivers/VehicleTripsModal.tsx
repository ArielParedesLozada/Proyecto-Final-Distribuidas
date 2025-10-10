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
                <div className="w-full max-w-5xl h-[600px] bg-[#0b1a2f] border border-slate-800 rounded-2xl shadow-xl text-white overflow-hidden">
                    {/* Header fijo */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 border border-emerald-500/30">
                                <Car className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{vehicle.modelo ?? "Vehículo"}</h1>
                                <p className="text-slate-300">{vehicle.placa}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Contenido principal con scroll forzado */}
                    <div 
                        className="p-6"
                        style={{ 
                            height: 'calc(600px - 100px)', 
                            overflowY: 'auto',
                            overflowX: 'hidden'
                        }}
                    >
                        <div className="grid grid-cols-12 gap-6">
                            {/* Columna izquierda - Información del vehículo */}
                            <div className="col-span-5 space-y-4">
                                {/* Card principal del vehículo */}
                                <div className="fuel-card p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
                                            <Car className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold">Información General</h3>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                                            <Calendar className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                                            <div className="text-slate-400 text-sm">Año</div>
                                            <div className="font-bold text-white text-lg">{vehicle.year ?? "—"}</div>
                                        </div>
                                        <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                                            <Settings className="w-5 h-5 text-green-400 mx-auto mb-2" />
                                            <div className="text-slate-400 text-sm">Tipo</div>
                                            <div className="font-bold text-white text-lg">{vehicle.tipo ?? "—"}</div>
                                        </div>
                                        <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                                            <MapPin className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                                            <div className="text-slate-400 text-sm">Kilometraje</div>
                                            <div className="font-bold text-white text-base">
                                                {vehicle.odometer_km ? `${vehicle.odometer_km.toLocaleString()}` : "—"}
                                            </div>
                                            <div className="text-slate-400 text-sm">km</div>
                                        </div>
                                        <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                                            <Activity className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                                            <div className="text-slate-400 text-sm">Estado</div>
                                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                                vehicle.estado === "Activo" 
                                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                                    : vehicle.estado === "Mantenimiento"
                                                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                                            }`}>
                                                {vehicle.estado ?? "—"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card de combustible */}
                                <div className="fuel-card p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 rounded-lg bg-emerald-600/20 border border-emerald-600/30">
                                            <Fuel className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold">Estado del Combustible</h3>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-white mb-3">{level}%</div>
                                            <div className="w-full bg-slate-800 rounded-full h-5">
                                                <div className={`h-5 rounded-full ${barColor} transition-all duration-500`} style={{ width: `${level}%` }} />
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-slate-400 text-base">Capacidad del Tanque</div>
                                            <div className="text-xl font-bold text-white">{vehicle.capacity_liters ?? "—"}</div>
                                            <div className="text-slate-400 text-base">Litros</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Columna derecha - Viajes */}
                            <div className="col-span-7">
                                <div className="fuel-card p-5">
                                    <div className="flex items-center gap-3 mb-4 border-b border-slate-700 pb-4">
                                        <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
                                            <Route className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold">Viajes Asignados</h3>
                                        {trips.length > 0 && (
                                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full border border-blue-500/30">
                                                {trips.length} viajes
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        {trips.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                                <Route className="w-12 h-12 mb-3 text-slate-500" />
                                                <p className="text-base font-medium">No hay viajes asignados</p>
                                                <p className="text-sm">Los viajes aparecerán aquí cuando se asignen</p>
                                            </div>
                                        ) : (
                                            trips.map((trip) => (
                                                <div key={trip.id} className="fuel-card p-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3 flex-1">
                                                            {getStatusIcon(trip.estado)}
                                                            <div>
                                                                <div className="font-semibold text-white text-base">
                                                                    {trip.origen} → {trip.destino}
                                                                </div>
                                                                <div className="text-slate-400 text-sm">ID: {trip.id}</div>
                                                                {trip.estimado && (
                                                                    <div className="text-slate-300 text-sm">
                                                                        Distancia: {trip.estimado} km
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(trip.estado)}`}>
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
                        <div className="space-y-4">
                            {/* Información del vehículo */}
                            <div className="fuel-card p-4">
                                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                                    <Car className="w-4 h-4 text-blue-400" />
                                    Información General
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                                        <Calendar className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                                        <div className="text-slate-400 text-sm">Año</div>
                                        <div className="font-bold text-white text-base">{vehicle.year ?? "—"}</div>
                                    </div>
                                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                                        <Settings className="w-5 h-5 text-green-400 mx-auto mb-2" />
                                        <div className="text-slate-400 text-sm">Tipo</div>
                                        <div className="font-bold text-white text-base">{vehicle.tipo ?? "—"}</div>
                                    </div>
                                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                                        <MapPin className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                                        <div className="text-slate-400 text-sm">Kilometraje</div>
                                        <div className="font-bold text-white text-sm">
                                            {vehicle.odometer_km ? `${vehicle.odometer_km.toLocaleString()}` : "—"}
                                        </div>
                                        <div className="text-slate-400 text-xs">km</div>
                                    </div>
                                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                                        <Activity className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                                        <div className="text-slate-400 text-sm">Estado</div>
                                        <span className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${
                                            vehicle.estado === "Activo" 
                                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                                : vehicle.estado === "Mantenimiento"
                                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                                        }`}>
                                            {vehicle.estado ?? "—"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Combustible */}
                            <div className="fuel-card p-4">
                                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                                    <Fuel className="w-4 h-4 text-emerald-400" />
                                    Estado del Combustible
                                </h3>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-white mb-3">{level}%</div>
                                    <div className="w-full bg-slate-800 rounded-full h-5 mb-3">
                                        <div className={`h-5 rounded-full ${barColor} transition-all duration-500`} style={{ width: `${level}%` }} />
                                    </div>
                                    <div className="text-slate-400 text-base">Capacidad: {vehicle.capacity_liters ?? "—"} Litros</div>
                                </div>
                            </div>

                            {/* Viajes */}
                            <div className="fuel-card p-4">
                                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                                    <Route className="w-4 h-4 text-blue-400" />
                                    Viajes Asignados
                                    {trips.length > 0 && (
                                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                                            {trips.length}
                                        </span>
                                    )}
                                </h3>
                                
                                {trips.length === 0 ? (
                                    <div className="text-center text-slate-400 py-6">
                                        <Route className="w-10 h-10 mx-auto mb-2 text-slate-500" />
                                        <p className="text-sm">No hay viajes asignados</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {trips.map((trip) => (
                                            <div key={trip.id} className="fuel-card p-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        {getStatusIcon(trip.estado)}
                                                        <div>
                                                            <div className="font-semibold text-white text-base">
                                                                {trip.origen} → {trip.destino}
                                                            </div>
                                                            <div className="text-slate-400 text-sm">ID: {trip.id}</div>
                                                            {trip.estimado && (
                                                                <div className="text-slate-300 text-sm">
                                                                    {trip.estimado} km
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(trip.estado)}`}>
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