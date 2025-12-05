import React, { useState, useEffect } from "react";
import { CheckCircle, Route, Fuel, Info, AlertCircle } from "lucide-react";
import ScrollableContainer from "../../shared/ScrollableContainer";
import { formatErrorMessage } from "../../utils/errorTranslations";

type Props = {
    tripId: string;
    origen: string;
    destino: string;
    distanciaEstimada?: number;
    consumoEstimado?: number;
    onClose: () => void;
    onSubmit: (realDistanceKm: number, realFuelConsumptionLiters: number) => Promise<void>;
};

const FinishTripModal: React.FC<Props> = ({
    tripId,
    origen,
    destino,
    distanciaEstimada = 0,
    consumoEstimado = 0,
    onClose,
    onSubmit,
}) => {
    const [realDistanceKm, setRealDistanceKm] = useState<string>(distanciaEstimada.toString());
    const [realFuelLiters, setRealFuelLiters] = useState<string>(consumoEstimado > 0 ? consumoEstimado.toString() : "");
    const [errors, setErrors] = useState<{ distance?: string; fuel?: string; server?: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Validar valores cuando cambian (solo para mostrar errores visuales, no sobrescribir errores del servidor)
    useEffect(() => {
        const newErrors: { distance?: string; fuel?: string; server?: string } = {};
        
        const distance = parseFloat(realDistanceKm);
        if (isNaN(distance) || distance <= 0) {
            newErrors.distance = "Los kilómetros deben ser un número mayor a 0";
        }
        
        const fuel = parseFloat(realFuelLiters);
        if (isNaN(fuel) || fuel <= 0) {
            newErrors.fuel = "Los litros deben ser un número mayor a 0";
        }
        
        // Preservar errores del servidor si existen
        setErrors(prev => ({
            ...newErrors,
            server: prev.server // Mantener error del servidor si existe
        }));
    }, [realDistanceKm, realFuelLiters]);

    const handleSubmit = async (e?: React.FormEvent) => {
        // Prevenir comportamiento por defecto si es un evento
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Evitar múltiples envíos
        if (isSubmitting) {
            return;
        }

        // Limpiar errores previos del servidor
        setErrors(prev => ({ ...prev, server: undefined }));
        
        const distance = parseFloat(realDistanceKm);
        const fuel = parseFloat(realFuelLiters);

        // Validación final
        if (isNaN(distance) || distance <= 0) {
            setErrors(prev => ({ ...prev, distance: "Los kilómetros deben ser un número mayor a 0" }));
            return;
        }

        if (isNaN(fuel) || fuel <= 0) {
            setErrors(prev => ({ ...prev, fuel: "Los litros deben ser un número mayor a 0" }));
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(distance, fuel);
        } catch (error: any) {
            // Capturar error del servidor y mostrarlo
            const errorMessage = error instanceof Error ? error.message : String(error);
            const formattedError = formatErrorMessage(errorMessage);
            
            // Si es un error de distancia, extraer la distancia mínima requerida
            if (errorMessage.includes('INVALID_DISTANCE')) {
                // Intentar extraer la distancia mínima del mensaje
                // Formato: "la distancia X debe ser mayor a Y" o "INVALID_DISTANCE: la distancia X debe ser mayor a Y"
                const match = errorMessage.match(/debe ser mayor a ([\d,\.]+)/i);
                if (match) {
                    // Reemplazar coma por punto si es necesario
                    const minDistanceStr = match[1].replace(',', '.');
                    const minDistance = parseFloat(minDistanceStr);
                    if (!isNaN(minDistance)) {
                        setErrors(prev => ({
                            ...prev,
                            server: formattedError,
                            distance: `⚠️ La distancia mínima requerida es ${minDistance.toFixed(2)} km (distancia calculada entre las coordenadas)`
                        }));
                        // Pre-llenar el campo con la distancia mínima como sugerencia
                        setRealDistanceKm(minDistance.toFixed(2));
                    } else {
                        setErrors(prev => ({ ...prev, server: formattedError }));
                    }
                } else {
                    setErrors(prev => ({ ...prev, server: formattedError }));
                }
            } else {
                setErrors(prev => ({ ...prev, server: formattedError }));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const isValid = !errors.distance && !errors.fuel && 
                    parseFloat(realDistanceKm) > 0 && 
                    parseFloat(realFuelLiters) > 0 && 
                    !isSubmitting;

    const Content = (
        <div
            className="
        w-full max-w-lg
        flex flex-col p-4 sm:p-6 relative rounded-2xl shadow-xl
        bg-[#0b1a2f] border border-slate-800 text-white
        max-h-[90vh] md:max-h-[85vh]
      "
        >
            {/* Cerrar */}
            <button
                type="button"
                className="absolute right-3 top-3 sm:right-4 sm:top-4 text-slate-400 hover:text-white transition-colors z-10 shrink-0"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isSubmitting) {
                        onClose();
                    }
                }}
                aria-label="Cerrar"
                title="Cerrar"
                disabled={isSubmitting}
            >
                ✕
            </button>

            {/* Header - Siempre visible */}
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 pr-8 shrink-0">
                <div className="p-2 rounded-lg bg-emerald-600/20 border border-emerald-600/30 shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold truncate">Finalizar Viaje</h2>
            </div>

            {/* Contenido scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4 mb-4">
                {/* Ruta */}
                <div className="fuel-card p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Route className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="text-slate-400 text-sm">Ruta</span>
                    </div>
                    <div className="font-semibold text-white text-sm sm:text-base break-words">
                        {origen} → {destino}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 break-all">ID: {tripId.substring(0, 8)}...</div>
                </div>

                {/* Información de referencia (si hay estimados) */}
                {(distanciaEstimada > 0 || consumoEstimado > 0) && (
                    <div className="fuel-card p-3 sm:p-4 bg-blue-900/20 border-blue-700/30">
                        <div className="flex items-start gap-2 mb-2">
                            <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                            <span className="text-slate-300 text-sm font-medium">Valores estimados</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                            {distanciaEstimada > 0 && (
                                <div>
                                    <span className="text-slate-400">Distancia:</span>
                                    <span className="text-blue-400 font-medium ml-2">{distanciaEstimada.toFixed(2)} km</span>
                                </div>
                            )}
                            {consumoEstimado > 0 && (
                                <div>
                                    <span className="text-slate-400">Combustible:</span>
                                    <span className="text-blue-400 font-medium ml-2">{consumoEstimado.toFixed(2)} L</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Error del servidor */}
                {errors.server && (
                    <div className="fuel-card p-3 sm:p-4 bg-red-900/20 border-red-700/30">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="text-red-300 text-xs sm:text-sm font-medium mb-1">Error al finalizar el viaje</div>
                                <div className="text-red-400 text-xs sm:text-sm break-words">{errors.server}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Inputs */}
                <div className="space-y-4">
                    {/* Kilómetros reales */}
                    <div className="space-y-2">
                        <label className="text-slate-300 text-xs sm:text-sm flex items-center gap-2">
                            <Route className="w-4 h-4 shrink-0" />
                            <span>Kilómetros reales recorridos</span>
                            <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={realDistanceKm}
                            onChange={(e) => setRealDistanceKm(e.target.value)}
                            disabled={isSubmitting}
                            className={`fuel-input w-full text-sm sm:text-base ${errors.distance ? 'border-red-500 focus:border-red-500' : ''} disabled:opacity-50`}
                            placeholder="Ej: 125.5"
                        />
                        {errors.distance && (
                            <p className="text-xs text-red-400 flex items-start gap-1 break-words">
                                <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                                <span>{errors.distance}</span>
                            </p>
                        )}
                        <p className="text-xs text-slate-500">
                            Ingresa la distancia real que recorriste durante el viaje.
                        </p>
                        {distanciaEstimada > 0 && (
                            <div className="text-xs text-blue-400 bg-blue-900/20 p-2 sm:p-3 rounded border border-blue-700/30 break-words">
                                <span className="font-medium">💡 Importante:</span> La distancia mínima permitida es <strong>{distanciaEstimada.toFixed(2)} km</strong> (distancia calculada en línea recta entre origen y destino). Si recorriste menos, es posible que haya un error en las coordenadas o en la medición.
                            </div>
                        )}
                    </div>

                    {/* Litros reales */}
                    <div className="space-y-2">
                        <label className="text-slate-300 text-xs sm:text-sm flex items-center gap-2">
                            <Fuel className="w-4 h-4 shrink-0" />
                            <span>Litros de gasolina consumidos</span>
                            <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={realFuelLiters}
                            onChange={(e) => setRealFuelLiters(e.target.value)}
                            disabled={isSubmitting}
                            className={`fuel-input w-full text-sm sm:text-base ${errors.fuel ? 'border-red-500 focus:border-red-500' : ''} disabled:opacity-50`}
                            placeholder="Ej: 15.5"
                        />
                        {errors.fuel && (
                            <p className="text-xs text-red-400 flex items-start gap-1 break-words">
                                <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                                <span>{errors.fuel}</span>
                            </p>
                        )}
                        <p className="text-xs text-slate-500">
                            Ingresa los litros de combustible que realmente consumiste.
                        </p>
                    </div>
                </div>
            </div>

            {/* Botones - Siempre visible en la parte inferior */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 shrink-0 pt-4 border-t border-slate-700/50">
                <button
                    type="button"
                    className="flex-1 px-4 py-2.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onClose();
                    }}
                    disabled={isSubmitting}
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    className="flex-1 fuel-button px-4 py-2.5 sm:py-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSubmit(e);
                    }}
                    disabled={!isValid || isSubmitting}
                >
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{isSubmitting ? "Finalizando..." : "Finalizar Viaje"}</span>
                </button>
            </div>
        </div>
    );

    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
            onClick={(e) => {
                // Cerrar al hacer clic en el fondo solo si no está guardando
                if (e.target === e.currentTarget && !isSubmitting) {
                    onClose();
                }
            }}
        >
            {/* Desktop/tablet */}
            <div className="hidden md:flex md:items-center md:justify-center md:w-full md:max-w-2xl">
                <div onClick={(e) => e.stopPropagation()}>
                    {Content}
                </div>
            </div>

            {/* Móvil */}
            <div className="block md:hidden w-full h-full flex items-center justify-center">
                <div className="w-full max-h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    {Content}
                </div>
            </div>
        </div>
    );
};

export default FinishTripModal;

