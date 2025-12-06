import React, { useState, useEffect, useMemo } from "react";
import { Calendar, Clock, Route, Loader2 } from "lucide-react";
import EmptyState from "../../shared/EmptyState";
import { api } from "../../api/api";
import type { ListRoutesResponse, RouteProto } from "../../types/trip";

type Props = {
    onOpenTrip?: (id: string) => void;
};

const DriverDashboard: React.FC<Props> = ({
    onOpenTrip,
}) => {
    const [routes, setRoutes] = useState<RouteProto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>("");

    // Cargar rutas del conductor
    useEffect(() => {
        let cancelled = false;

        const fetchRoutes = async () => {
            try {
                setIsLoading(true);
                setError("");

                const response = await api<ListRoutesResponse>("/routes/my");
                if (cancelled) return;

                if (response && response.routes && Array.isArray(response.routes)) {
                    setRoutes(response.routes);
                } else {
                    setRoutes([]);
                }
            } catch (err: any) {
                if (cancelled) return;
                const msg = err instanceof Error ? err.message : String(err);
                console.error("❌ Error al cargar rutas:", msg);
                setError(msg || "Error al cargar rutas");
                setRoutes([]);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        fetchRoutes();
        return () => {
            cancelled = true;
        };
    }, []);

    // Mapear estado de la ruta
    const getRouteStatus = (status: number | string | undefined): "Planificado" | "EnCurso" | "Finalizado" => {
        const statusMap: Record<string | number, "Planificado" | "EnCurso" | "Finalizado"> = {
            "ROUTE_STATE_UNASSIGNED": "Planificado",
            "ROUTE_STATE_ASSIGNED": "Planificado",
            "ROUTE_STATE_STARTED": "EnCurso",
            "ROUTE_STATE_COMPLETED": "Finalizado",
            0: "Planificado",
            1: "Planificado",
            2: "EnCurso",
            3: "Finalizado",
        };
        return statusMap[status || 0] || "Planificado";
    };

    // Calcular estadísticas
    const stats = useMemo(() => {
        const plan = routes.filter(r => {
            const status = getRouteStatus(r.status);
            return status === "Planificado";
        }).length;
        const run = routes.filter(r => {
            const status = getRouteStatus(r.status);
            return status === "EnCurso";
        }).length;
        const done = routes.filter(r => {
            const status = getRouteStatus(r.status);
            return status === "Finalizado";
        }).length;
        return {
            plan,
            run,
            done,
            total: routes.length
        };
    }, [routes]);

    // Obtener viajes de hoy separados por estado
    const todayTrips = useMemo(() => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const allToday = routes
            .filter(r => {
                const assignedAt = r.assignedAt || r.assigned_at;
                if (!assignedAt) return false;

                let assignedDate: Date | null = null;
                if (typeof assignedAt === 'string') {
                    assignedDate = new Date(assignedAt);
                } else if (typeof assignedAt === 'object' && assignedAt !== null && 'seconds' in assignedAt) {
                    const ts = assignedAt as any;
                    assignedDate = new Date(ts.seconds * 1000);
                }

                if (!assignedDate || isNaN(assignedDate.getTime())) return false;

                return assignedDate >= todayStart && assignedDate <= todayEnd;
            })
            .map(r => ({
                id: r.id || "",
                origen: r.originName || r.origin_name || "Origen desconocido",
                destino: r.destinationName || r.destination_name || "Destino desconocido",
                estado: getRouteStatus(r.status)
            }));

        return {
            planificados: allToday.filter(t => t.estado === "Planificado"),
            enCurso: allToday.filter(t => t.estado === "EnCurso"),
            finalizados: allToday.filter(t => t.estado === "Finalizado")
        };
    }, [routes]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                        Dashboard del Chofer
                    </h1>
                    <p className="text-slate-400">Resumen de tus actividades y viajes</p>
                </div>
                <div className="fuel-card p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
                    <p className="text-slate-400">Cargando datos...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                        Dashboard del Chofer
                    </h1>
                    <p className="text-slate-400">Resumen de tus actividades y viajes</p>
                </div>
                <div className="fuel-card p-8 text-center">
                    <p className="text-red-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Título con gradiente */}
            <div className="text-center mb-6">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                    Dashboard del Chofer
                </h1>
                <p className="text-slate-400 text-sm md:text-base">Resumen de tus actividades y viajes</p>
            </div>

            {/* ===================== RESUMEN (RESPONSIVO) ===================== */}
            <section className="fuel-card p-5 md:p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 rounded-lg bg-blue-600/20 border border-blue-600/30">
                        <Calendar className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold text-white">Resumen</h3>
                </div>

                {/* XS: 2x2  |  MD+: 1x4 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <div className="fuel-card p-4 md:p-5 text-center min-w-0 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20">
                        <div className="text-slate-400 text-xs md:text-sm mb-2 font-medium">Planificados</div>
                        <div className="text-3xl md:text-4xl font-bold text-amber-400">{stats.plan}</div>
                    </div>

                    <div className="fuel-card p-4 md:p-5 text-center min-w-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                        <div className="text-slate-400 text-xs md:text-sm mb-2 font-medium">En curso</div>
                        <div className="text-3xl md:text-4xl font-bold text-blue-400">{stats.run}</div>
                    </div>

                    <div className="fuel-card p-4 md:p-5 text-center min-w-0 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20">
                        <div className="text-slate-400 text-xs md:text-sm mb-2 font-medium">Finalizados</div>
                        <div className="text-3xl md:text-4xl font-bold text-emerald-400">{stats.done}</div>
                    </div>

                    <div className="fuel-card p-4 md:p-5 text-center min-w-0 bg-gradient-to-br from-slate-700/50 to-slate-800/30 border border-slate-600/30">
                        <div className="text-slate-400 text-xs md:text-sm mb-2 font-medium">Total</div>
                        <div className="text-3xl md:text-4xl font-bold text-white">{stats.total}</div>
                    </div>
                </div>
            </section>

            {/* ===================== VIAJES DE HOY - DOS COLUMNAS ===================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* COLUMNA IZQUIERDA: PLANIFICADOS */}
                <section className="fuel-card p-5 md:p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 rounded-lg bg-amber-600/20 border border-amber-600/30">
                            <Calendar className="w-5 h-5 text-amber-400" />
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold text-white">Planificados</h3>
                        <span className="ml-auto px-2.5 py-1 rounded-full text-xs font-medium bg-amber-600/20 text-amber-400 border border-amber-600/30">
                            {todayTrips.planificados.length}
                        </span>
                    </div>

                    {todayTrips.planificados.length === 0 ? (
                        <EmptyState
                            icon={Clock}
                            title="No hay viajes planificados"
                            description="No tienes viajes programados para hoy"
                        />
                    ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {todayTrips.planificados.map((t) => (
                                <div
                                    key={t.id}
                                    className="fuel-card p-4 hover:shadow-lg hover:border-amber-500/30 transition-all duration-300 border border-slate-700/50 cursor-pointer"
                                    onClick={() => onOpenTrip?.(t.id)}
                                >
                                    <div className="font-semibold text-white text-base md:text-lg mb-2 line-clamp-2">
                                        {t.origen} → {t.destino}
                                    </div>
                                    <div className="text-xs md:text-sm text-slate-400 font-mono mb-2">ID: {t.id.substring(0, 8)}...</div>
                                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-amber-600/20 text-amber-400 border border-amber-600/30">
                                        {t.estado}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* COLUMNA DERECHA: EN CURSO */}
                <section className="fuel-card p-5 md:p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 rounded-lg bg-blue-600/20 border border-blue-600/30">
                            <Route className="w-5 h-5 text-blue-400" />
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold text-white">En Curso</h3>
                        <span className="ml-auto px-2.5 py-1 rounded-full text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-600/30">
                            {todayTrips.enCurso.length}
                        </span>
                    </div>

                    {todayTrips.enCurso.length === 0 ? (
                        <EmptyState
                            icon={Route}
                            title="No hay viajes en curso"
                            description="No tienes viajes activos en este momento"
                        />
                    ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {todayTrips.enCurso.map((t) => (
                                <div
                                    key={t.id}
                                    className="fuel-card p-4 hover:shadow-lg hover:border-blue-500/30 transition-all duration-300 border border-slate-700/50 cursor-pointer"
                                    onClick={() => onOpenTrip?.(t.id)}
                                >
                                    <div className="font-semibold text-white text-base md:text-lg mb-2 line-clamp-2">
                                        {t.origen} → {t.destino}
                                    </div>
                                    <div className="text-xs md:text-sm text-slate-400 font-mono mb-2">ID: {t.id.substring(0, 8)}...</div>
                                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-600/30">
                                        {t.estado}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default DriverDashboard;
