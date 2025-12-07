import React, { useState, useEffect, useMemo } from "react";
import { Users, Car, MapPin, Clock, TrendingUp, AlertCircle, CheckCircle, Eye, Loader2 } from "lucide-react";
import { api } from "../../api/api";
import { useToast } from "../../shared/ToastNotification";
import type { Driver, DriversListResponse } from "../../types/driver";
import type { RouteProto, ListRoutesResponse } from "../../types/trip";

interface ActiveDriver {
  id: string;
  name: string;
  status: "En Viaje" | "Disponible" | "Descanso";
  location: string;
  eta: string;
}

interface RecentTrip {
  id: string;
  driver: string;
  route: string;
  duration: string;
  status: "Completado" | "Activo";
}

const SupervisorDashboard: React.FC = () => {
  const { addToast } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<RouteProto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Cargar conductores
        const driversResponse = await api<DriversListResponse>('/drivers');
        setDrivers(driversResponse.drivers || []);

        // Cargar rutas
        const routesResponse = await api<ListRoutesResponse>('/routes/?page=1&page_size=1000');
        setRoutes(routesResponse.routes || []);
      } catch (err: any) {
        console.error('Error al cargar datos:', err);
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg || "Error al cargar datos");
        addToast('Error al cargar datos del dashboard', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [addToast]);

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

  // Funciones auxiliares (declaradas antes de los useMemo que las usan)
  const getDateFromRoute = (route: RouteProto): Date => {
    const completedAt = route.completedAt || route.completed_at;
    const startedAt = route.startedAt || route.started_at;
    const assignedAt = route.assignedAt || route.assigned_at;
    const createdAt = route.createdAt || route.created_at;

    const dateStr = completedAt || startedAt || assignedAt || createdAt;
    if (!dateStr) return new Date(0);

    if (typeof dateStr === 'string') {
      return new Date(dateStr);
    } else if (typeof dateStr === 'object' && dateStr !== null && 'seconds' in dateStr) {
      const ts = dateStr as any;
      return new Date(ts.seconds * 1000);
    }

    return new Date(0);
  };

  const calculateETA = (startedAt: string | { seconds?: number; nanos?: number } | null | undefined): string => {
    if (!startedAt) return "-";

    let startDate: Date | null = null;
    if (typeof startedAt === 'string') {
      startDate = new Date(startedAt);
    } else if (typeof startedAt === 'object' && startedAt !== null && 'seconds' in startedAt) {
      const ts = startedAt as any;
      startDate = new Date(ts.seconds * 1000);
    }

    if (!startDate || isNaN(startDate.getTime())) return "-";

    const now = new Date();
    const diffMs = now.getTime() - startDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}min`;
    }
  };

  const calculateDuration = (
    startedAt: string | { seconds?: number; nanos?: number } | null | undefined,
    completedAt: string | { seconds?: number; nanos?: number } | null | undefined
  ): string => {
    if (!startedAt || !completedAt) return "-";

    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (typeof startedAt === 'string') {
      startDate = new Date(startedAt);
    } else if (typeof startedAt === 'object' && startedAt !== null && 'seconds' in startedAt) {
      const ts = startedAt as any;
      startDate = new Date(ts.seconds * 1000);
    }

    if (typeof completedAt === 'string') {
      endDate = new Date(completedAt);
    } else if (typeof completedAt === 'object' && completedAt !== null && 'seconds' in completedAt) {
      const ts = completedAt as any;
      endDate = new Date(ts.seconds * 1000);
    }

    if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return "-";

    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}min`;
    }
  };

  // Calcular estadísticas
  const stats = useMemo(() => {
    const activeDriversCount = drivers.filter(d => d.availability === 1).length;
    const tripsInProgress = routes.filter(r => {
      const status = getRouteStatus(r.status);
      return status === "EnCurso";
    }).length;

    // Viajes completados hoy
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const completedToday = routes.filter(r => {
      const status = getRouteStatus(r.status);
      if (status !== "Finalizado") return false;

      const completedAt = r.completedAt || r.completed_at;
      if (!completedAt) return false;

      let completedDate: Date | null = null;
      if (typeof completedAt === 'string') {
        completedDate = new Date(completedAt);
      } else if (typeof completedAt === 'object' && completedAt !== null && 'seconds' in completedAt) {
        const ts = completedAt as any;
        completedDate = new Date(ts.seconds * 1000);
      }

      if (!completedDate || isNaN(completedDate.getTime())) return false;
      return completedDate >= todayStart && completedDate <= todayEnd;
    }).length;

    // Alertas: rutas sin asignar o con problemas (por ahora, rutas sin asignar)
    const alertsCount = routes.filter(r => {
      const status = getRouteStatus(r.status);
      return status === "Planificado" && (!r.driverId && !r.driver_id);
    }).length;

    return [
      { title: "Conductores Activos", value: activeDriversCount.toString(), icon: <Users className="w-6 h-6" />, color: "blue" },
      { title: "Viajes en Curso", value: tripsInProgress.toString(), icon: <Car className="w-6 h-6" />, color: "green" },
      { title: "Viajes Completados Hoy", value: completedToday.toString(), icon: <CheckCircle className="w-6 h-6" />, color: "purple" },
      { title: "Alertas Pendientes", value: alertsCount.toString(), icon: <AlertCircle className="w-6 h-6" />, color: "red" }
    ];
  }, [drivers, routes]);

  // Obtener conductores activos
  const activeDrivers = useMemo((): ActiveDriver[] => {
    const availableDrivers = drivers.filter(d => d.availability === 1);
    
    return availableDrivers.map(driver => {
      // Buscar rutas activas del conductor
      const activeRoute = routes.find(r => {
        const driverId = r.driverId || r.driver_id;
        const status = getRouteStatus(r.status);
        return driverId === driver.id && status === "EnCurso";
      });

      if (activeRoute) {
        const origin = activeRoute.originName || activeRoute.origin_name || "Origen";
        return {
          id: driver.id,
          name: driver.full_name,
          status: "En Viaje" as const,
          location: origin,
          eta: calculateETA(activeRoute.startedAt || activeRoute.started_at)
        };
      }

      // Si no tiene ruta activa, está disponible
      return {
        id: driver.id,
        name: driver.full_name,
        status: "Disponible" as const,
        location: "Base",
        eta: "-"
      };
    }).slice(0, 10); // Limitar a 10 conductores
  }, [drivers, routes]);

  // Obtener viajes recientes
  const recentTrips = useMemo((): RecentTrip[] => {
    const sortedRoutes = [...routes]
      .sort((a, b) => {
        const dateA = getDateFromRoute(a);
        const dateB = getDateFromRoute(b);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 10); // Limitar a 10 viajes

    return sortedRoutes.map(route => {
      const driverId = route.driverId || route.driver_id;
      const driver = driverId ? drivers.find(d => d.id === driverId) : null;
      const driverName = driver ? driver.full_name : "Sin asignar";
      
      const origin = route.originName || route.origin_name || "Origen";
      const destination = route.destinationName || route.destination_name || "Destino";
      const routeText = `${origin} → ${destination}`;

      const status = getRouteStatus(route.status);
      const isCompleted = status === "Finalizado";
      const isActive = status === "EnCurso";

      let duration = "";
      if (isCompleted) {
        duration = calculateDuration(route.startedAt || route.started_at, route.completedAt || route.completed_at);
      } else if (isActive) {
        duration = "En curso";
      } else {
        duration = "Pendiente";
      }

      return {
        id: route.id || "",
        driver: driverName,
        route: routeText,
        duration,
        status: isCompleted ? "Completado" as const : "Activo" as const
      };
    });
  }, [routes, drivers]);

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-600/20 border-blue-600/30 text-blue-400",
      green: "bg-green-600/20 border-green-600/30 text-green-400",
      purple: "bg-purple-600/20 border-purple-600/30 text-purple-400",
      red: "bg-red-600/20 border-red-600/30 text-red-400"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      "En Viaje": "bg-green-600/20 text-green-400",
      "Disponible": "bg-blue-600/20 text-blue-400",
      "Descanso": "bg-yellow-600/20 text-yellow-400",
      "Completado": "bg-green-600/20 text-green-400",
      "Activo": "bg-blue-600/20 text-blue-400"
    };
    return colors[status as keyof typeof colors] || "bg-gray-600/20 text-gray-400";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-2">
            Panel de Supervisión
          </h1>
          <p className="text-slate-400">Monitoreo y gestión de operaciones</p>
        </div>
        <div className="fuel-card p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-4" />
          <p className="text-slate-400">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-2">
            Panel de Supervisión
          </h1>
          <p className="text-slate-400">Monitoreo y gestión de operaciones</p>
        </div>
        <div className="fuel-card p-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título con gradiente */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-2">
          Panel de Supervisión
        </h1>
        <p className="text-slate-400">Monitoreo y gestión de operaciones</p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="fuel-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                {stat.icon}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.title}</div>
              </div>
            </div>
            {/* Removido el indicador de tendencia por ahora */}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conductores activos */}
        <div className="fuel-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Conductores Activos</h2>
          </div>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {activeDrivers.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay conductores activos</p>
              </div>
            ) : (
              activeDrivers.map((driver) => (
                <div key={driver.id} className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:border-slate-600/70 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {driver.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{driver.name}</div>
                    <div className="text-sm text-slate-400 flex items-center gap-2">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{driver.location}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                      {driver.status}
                    </div>
                    {driver.eta !== "-" && (
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {driver.eta}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Viajes recientes */}
        <div className="fuel-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-green-600/20 border border-green-600/30">
              <Car className="w-6 h-6 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Viajes Recientes</h2>
          </div>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {recentTrips.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay viajes recientes</p>
              </div>
            ) : (
              recentTrips.map((trip) => (
                <div key={trip.id} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:border-slate-600/70 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-white truncate flex-1 mr-2">{trip.driver}</div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(trip.status)}`}>
                      {trip.status}
                    </div>
                  </div>
                  <div className="text-sm text-slate-400 mb-2 truncate">{trip.route}</div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span>{trip.duration}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="fuel-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-amber-600/20 border border-amber-600/30">
            <Eye className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Acciones de Supervisión</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="fuel-button-secondary p-4 text-left flex items-center gap-3">
            <Users className="w-5 h-5" />
            <div>
              <div className="font-medium">Ver Todos los Conductores</div>
              <div className="text-sm text-slate-400">Lista completa y estados</div>
            </div>
          </button>
          
          <button className="fuel-button-secondary p-4 text-left flex items-center gap-3">
            <MapPin className="w-5 h-5" />
            <div>
              <div className="font-medium">Mapa en Tiempo Real</div>
              <div className="text-sm text-slate-400">Seguimiento de vehículos</div>
            </div>
          </button>
          
          <button className="fuel-button-secondary p-4 text-left flex items-center gap-3">
            <TrendingUp className="w-5 h-5" />
            <div>
              <div className="font-medium">Reportes de Rendimiento</div>
              <div className="text-sm text-slate-400">Métricas y estadísticas</div>
            </div>
          </button>
        </div>
      </div>

      {/* Estado del sistema */}
      <div className="fuel-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-slate-600/20 border border-slate-600/30">
            <Eye className="w-6 h-6 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Estado de Supervisión</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-green-600/10 border border-green-600/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-green-400 font-medium">Conductores Online</span>
            </div>
            <p className="text-sm text-slate-400">{drivers.filter(d => d.availability === 1).length} de {drivers.length} conductores activos</p>
          </div>
          
          <div className="p-4 rounded-lg bg-blue-600/10 border border-blue-600/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span className="text-blue-400 font-medium">GPS Tracking</span>
            </div>
            <p className="text-sm text-slate-400">Seguimiento en tiempo real activo</p>
          </div>
          
          <div className="p-4 rounded-lg bg-amber-600/10 border border-amber-600/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-amber-400"></div>
              <span className="text-amber-400 font-medium">Alertas</span>
            </div>
            <p className="text-sm text-slate-400">{stats.find(s => s.title === "Alertas Pendientes")?.value || "0"} alertas pendientes de revisión</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;
