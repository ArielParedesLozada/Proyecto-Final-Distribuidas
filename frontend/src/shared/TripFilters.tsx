import React from "react";
import { Clock, Filter, MapPin, X } from "lucide-react";

export type TripStatus = "Planificado" | "EnCurso" | "Finalizado";

export type TripFiltersValue = {
    city: string;
    onlyNext24h: boolean;
    status: TripStatus[];
};

export const DEFAULT_TRIP_FILTERS: TripFiltersValue = {
    city: "",
    onlyNext24h: false,
    status: ["Planificado", "EnCurso", "Finalizado"],
};

type Props = {
    value: TripFiltersValue;
    onChange: (next: TripFiltersValue) => void;
    counts?: Partial<Record<TripStatus, number>>;
    suggestions?: string[];
    className?: string;
};

const TripFilters: React.FC<Props> = ({
    value,
    onChange,
    counts = {},
    suggestions = [],
    className = "",
}) => {
    const set = (patch: Partial<TripFiltersValue>) =>
        onChange({ ...value, ...patch });

    const toggleStatus = (s: TripStatus) => {
        const has = value.status.includes(s);
        const next = has ? value.status.filter((x) => x !== s) : [...value.status, s];
        onChange({ ...value, status: next });
    };

    const clear = () => onChange({ ...DEFAULT_TRIP_FILTERS });

    const chipBase =
        "px-3 py-1 rounded-full text-xs font-medium border transition-colors";
    const chipOff =
        "bg-slate-800/70 text-slate-300 border-slate-700 hover:bg-slate-700";
    const chipPlan = "bg-amber-600/20 text-amber-400 border-amber-600/30";
    const chipRun = "bg-blue-600/20 text-blue-400 border-blue-600/30";
    const chipDone = "bg-emerald-600/20 text-emerald-400 border-emerald-600/30";

    return (
        <section className={`fuel-card p-4 ${className}`}>
            <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
                    <Filter className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold">Filtros</h3>
                <button
                    className="ml-auto text-slate-300 hover:text-white flex items-center gap-2 text-sm"
                    onClick={clear}
                    title="Limpiar filtros"
                >
                    <X className="w-4 h-4" /> Limpiar
                </button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                {/* Ciudad */}
                <div>
                    <label className="block text-xs text-slate-400 mb-1">
                        Ciudad (origen o destino)
                    </label>
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                            <MapPin className="w-4 h-4 text-slate-400" />
                        </div>
                        <input
                            value={value.city}
                            onChange={(e) => set({ city: e.target.value })}
                            placeholder="Ambato, Quito, Riobamba…"
                            list="trip-cities"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-600"
                        />
                        {suggestions.length > 0 && (
                            <datalist id="trip-cities">
                                {suggestions.map((c) => (
                                    <option key={c} value={c} />
                                ))}
                            </datalist>
                        )}
                    </div>
                </div>

                {/* Próximas 24 h */}
                <div>
                    <label className="block text-xs text-slate-400 mb-1">
                        Ventana temporal
                    </label>
                    <label className="inline-flex items-center gap-3 cursor-pointer">
                        <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                            <Clock className="w-4 h-4 text-slate-400" />
                        </div>
                        <div
                            onClick={() => set({ onlyNext24h: !value.onlyNext24h })}
                            className={`relative w-10 h-6 rounded-full transition-colors ${value.onlyNext24h ? "bg-blue-600" : "bg-slate-700"
                                }`}
                            role="switch"
                            aria-checked={value.onlyNext24h}
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${value.onlyNext24h ? "translate-x-4" : ""
                                    }`}
                            />
                        </div>
                        <span className="text-sm text-slate-200">Próximas 24 h</span>
                    </label>
                </div>

                {/* Estado */}
                <div>
                    <label className="block text-xs text-slate-400 mb-1">Estado</label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            className={`${chipBase} ${value.status.includes("Planificado") ? chipPlan : chipOff
                                }`}
                            onClick={() => toggleStatus("Planificado")}
                            type="button"
                        >
                            Planificados ({counts.Planificado ?? 0})
                        </button>
                        <button
                            className={`${chipBase} ${value.status.includes("EnCurso") ? chipRun : chipOff
                                }`}
                            onClick={() => toggleStatus("EnCurso")}
                            type="button"
                        >
                            En curso ({counts.EnCurso ?? 0})
                        </button>
                        <button
                            className={`${chipBase} ${value.status.includes("Finalizado") ? chipDone : chipOff
                                }`}
                            onClick={() => toggleStatus("Finalizado")}
                            type="button"
                        >
                            Finalizados ({counts.Finalizado ?? 0})
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TripFilters;
