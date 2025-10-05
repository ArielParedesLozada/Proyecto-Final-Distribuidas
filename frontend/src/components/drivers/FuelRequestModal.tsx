import React, { useMemo, useState } from "react";
import { Fuel, Droplets, Gauge, Info } from "lucide-react";
import ScrollableContainer from "../../shared/ScrollableContainer";

type Estado = "Planificado" | "EnCurso" | "Finalizado";

type Props = {
    currentLevel: number;
    tripId?: string;
    tripEstado: Estado;
    onClose: () => void;
    onSubmit?: (litros: number, tripId?: string) => void;
};

const clamp = (n: number, min = 0, max = 1000) => Math.max(min, Math.min(max, n));

const FuelRequestModal: React.FC<Props> = ({
    currentLevel,
    tripId,
    tripEstado,
    onClose,
    onSubmit,
}) => {
    const [litros, setLitros] = useState<number>(10);
    const level = useMemo(() => clamp(Math.round(currentLevel), 0, 100), [currentLevel]);

    const barColor =
        level > 70 ? "bg-emerald-500" : level > 30 ? "bg-amber-500" : "bg-red-500";

    const handleSubmit = () => {
        const v = clamp(litros, 1, 1000);
        onSubmit?.(v, tripId);
        onClose();
    };

    const isEnCurso = tripEstado === "EnCurso";

    const Content = (
        <div
            className="
        w-full max-w-md max-h-[80vh]
        flex flex-col p-6 relative rounded-2xl shadow-xl
        bg-[#0b1a2f] border border-slate-800 text-white
      "
        >
            {/* Cerrar */}
            <button
                className="absolute right-4 top-4 text-slate-400 hover:text-white"
                onClick={onClose}
                aria-label="Cerrar"
                title="Cerrar"
            >
                ✕
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg bg-cyan-600/20 border border-cyan-600/30">
                    <Fuel className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-lg font-semibold">Solicitud de combustible</h2>
            </div>

            {/* Nivel actual */}
            <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                        <Gauge className="w-4 h-4" />
                        Nivel actual
                    </div>
                    <span className="font-medium">{level}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3">
                    <div className={`h-3 rounded-full ${barColor}`} style={{ width: `${level}%` }} />
                </div>
            </div>

            {/* Si NO está en curso, solo informativo */}
            {!isEnCurso && (
                <div className="fuel-card p-4 bg-slate-800/40 border border-slate-700/50 mb-2">
                    <div className="flex items-start gap-2 text-slate-300 text-sm">
                        <Info className="w-4 h-4 mt-0.5" />
                        <span>
                            Solo puedes solicitar combustible mientras el viaje está <b>EnCurso</b>.
                        </span>
                    </div>
                </div>
            )}

            {/* Input y CTA SOLO cuando está EnCurso */}
            {isEnCurso && (
                <>
                    <div className="space-y-2 mb-4">
                        <label className="text-slate-300 text-sm flex items-center gap-2">
                            <Droplets className="w-4 h-4" />
                            Litros a solicitar
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min={1}
                                step={1}
                                value={litros}
                                onChange={(e) => setLitros(clamp(Number(e.target.value) || 0, 0, 1000))}
                                className="fuel-input flex-1"
                                placeholder="Cantidad en litros"
                            />
                            {/* Accesos rápidos */}
                            <div className="flex gap-2">
                                {[5, 10, 20].map((q) => (
                                    <button
                                        key={q}
                                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm border border-slate-700"
                                        onClick={() => setLitros(q)}
                                    >
                                        {q}L
                                    </button>
                                ))}
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">
                            En Ecuador, el suministro se maneja en <b>litros</b>.
                        </p>
                    </div>

                    <div className="mt-auto flex justify-end">
                        <button
                            className="fuel-button px-5 py-2 flex items-center gap-2"
                            onClick={handleSubmit}
                            disabled={litros < 1}
                        >
                            <Fuel className="w-4 h-4" />
                            Solicitar combustible
                        </button>
                    </div>
                </>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            {/* Desktop/tablet */}
            <div className="hidden md:block">{Content}</div>

            {/* Móvil */}
            <div className="block md:hidden w-full h-[90vh]">
                <ScrollableContainer className="h-full p-2">{Content}</ScrollableContainer>
            </div>
        </div>
    );
};

export default FuelRequestModal;
