import React from "react";
import { Calendar, Clock, Route } from "lucide-react";

type Props = {
    stats?: { plan: number; run: number; done: number; total: number };
    today?: Array<{ id: string; origen: string; destino: string; estado: string }>;
    onOpenTrip?: (id: string) => void;
};

const DriverDashboard: React.FC<Props> = ({
    stats = { plan: 0, run: 0, done: 0, total: 0 },
    today = [],
    onOpenTrip,
}) => (
    <div className="space-y-6">
        {/* Título con gradiente */}
        <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Dashboard del Chofer
            </h1>
            <p className="text-slate-400">Resumen de tus actividades y viajes</p>
        </div>

        {/* ===================== RESUMEN (RESPONSIVO) ===================== */}
        <section className="fuel-card p-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
                    <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Resumen</h3>
            </div>

            {/* XS: 2x2  |  MD+: 1x4 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 min-w-0">
                <div className="fuel-card p-4 text-center min-w-0">
                    <div className="text-slate-400 text-sm mb-1">Planificados</div>
                    <div className="text-2xl font-bold text-amber-400">{stats.plan}</div>
                </div>

                <div className="fuel-card p-4 text-center min-w-0">
                    <div className="text-slate-400 text-sm mb-1">En curso</div>
                    <div className="text-2xl font-bold text-blue-400">{stats.run}</div>
                </div>

                <div className="fuel-card p-4 text-center min-w-0">
                    <div className="text-slate-400 text-sm mb-1">Finalizados</div>
                    <div className="text-2xl font-bold text-emerald-400">{stats.done}</div>
                </div>

                <div className="fuel-card p-4 text-center min-w-0">
                    <div className="text-slate-400 text-sm mb-1">Total</div>
                    <div className="text-2xl font-bold text-white">{stats.total}</div>
                </div>
            </div>
        </section>

        {/* ===================== VIAJES DE HOY (DEBAJO) ===================== */}
        <section className="fuel-card p-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-emerald-600/20 border border-emerald-600/30">
                    <Route className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Viajes de hoy</h3>
            </div>

            {today.length === 0 ? (
                <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-400">No tienes viajes programados para hoy</p>
                    <p className="text-slate-500 text-sm mt-1">Disfruta tu día libre</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {today.map((t) => (
                        <div
                            key={t.id}
                            className="fuel-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:shadow-lg transition-all duration-300"
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="p-2 rounded-lg bg-slate-800/50 shrink-0">
                                    <Route className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="min-w-0">
                                    <div className="font-semibold text-white text-lg truncate">
                                        {t.origen} → {t.destino}
                                    </div>
                                    <div className="text-sm text-slate-400">ID: {t.id}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${t.estado === "Finalizado"
                                            ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30"
                                            : t.estado === "EnCurso"
                                                ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                                                : "bg-amber-600/20 text-amber-400 border border-amber-600/30"
                                        }`}
                                >
                                    {t.estado}
                                </span>

                                {onOpenTrip && (
                                    <button
                                        className="fuel-button-secondary px-4 py-2 text-sm"
                                        onClick={() => onOpenTrip(t.id)}
                                    >
                                        Abrir
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    </div>
);

export default DriverDashboard;
