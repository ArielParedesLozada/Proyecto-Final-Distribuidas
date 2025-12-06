import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Car, BarChart3, Settings, Shield, Loader2, AlertCircle, Truck, Route } from "lucide-react";
import { api } from "../../api/api";
import { useToast } from "../../shared/ToastNotification";
import type { Driver, DriversListResponse } from "../../types/driver";
import type { RouteProto, ListRoutesResponse } from "../../types/trip";

interface User {
  id: string;
  email: string;
  nombre: string;
  roles: 'ADMIN' | 'CONDUCTOR' | 'SUPERVISOR';
}

interface RecentActivity {
  id: string;
  user: string;
  action: string;
  time: string;
  type: "success" | "info" | "warning" | "error";
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
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

        // Cargar usuarios
        const usersResponse = await api<{ users: User[] }>('/admin/users');
        setUsers(usersResponse.users || []);

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

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return "Hace un momento";
    } else if (diffMins < 60) {
      return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    } else if (diffDays === 1) {
      return "Hace 1 día";
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }
  };

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeDriversCount = drivers.filter(d => d.availability === 1).length;
    const completedTrips = routes.filter(r => {
      const status = getRouteStatus(r.status);
      return status === "Finalizado";
    }).length;
    
    return [
      { title: "Total Usuarios", value: totalUsers.toString(), icon: <Users className="w-6 h-6" />, color: "blue" },
      { title: "Conductores Activos", value: activeDriversCount.toString(), icon: <Car className="w-6 h-6" />, color: "green" },
      { title: "Viajes Completados", value: completedTrips.toString(), icon: <BarChart3 className="w-6 h-6" />, color: "purple" }
    ];
  }, [users, drivers, routes]);

  // Obtener actividades recientes (basadas en rutas recientes)
  const recentActivities = useMemo((): RecentActivity[] => {
    const sortedRoutes = [...routes]
      .sort((a, b) => {
        const dateA = getDateFromRoute(a);
        const dateB = getDateFromRoute(b);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5); // Limitar a 5 actividades

    return sortedRoutes.map((route, index) => {
      const driverId = route.driverId || route.driver_id;
      const driver = driverId ? drivers.find(d => d.id === driverId) : null;
      const driverName = driver ? driver.full_name : "Sistema";
      
      const status = getRouteStatus(route.status);
      let action = "";
      let type: "success" | "info" | "warning" | "error" = "info";
      
      if (status === "Finalizado") {
        action = "Completó ruta";
        type = "success";
      } else if (status === "EnCurso") {
        action = "Inició ruta";
        type = "info";
      } else if (status === "Planificado" && !driverId) {
        action = "Ruta sin asignar";
        type = "warning";
      } else {
        action = "Ruta planificada";
        type = "info";
      }

      const routeDate = getDateFromRoute(route);
      const time = formatRelativeTime(routeDate);

      return {
        id: route.id || `activity-${index}`,
        user: driverName,
        action,
        time,
        type
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

  const getActivityColor = (type: string) => {
    const colors = {
      success: "bg-green-600/20 text-green-400",
      info: "bg-blue-600/20 text-blue-400",
      warning: "bg-yellow-600/20 text-yellow-400",
      error: "bg-red-600/20 text-red-400"
    };
    return colors[type as keyof typeof colors] || colors.info;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-2">
            Panel de Administración
          </h1>
          <p className="text-slate-400">Gestión completa del sistema</p>
        </div>
        <div className="fuel-card p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-400 mx-auto mb-4" />
          <p className="text-slate-400">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-2">
            Panel de Administración
          </h1>
          <p className="text-slate-400">Gestión completa del sistema</p>
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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-2">
          Panel de Administración
        </h1>
        <p className="text-slate-400">Gestión completa del sistema</p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        {/* Actividades recientes */}
        <div className="fuel-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
              <BarChart3 className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Actividades Recientes</h2>
          </div>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay actividades recientes</p>
              </div>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:border-slate-600/70 transition-colors">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getActivityColor(activity.type)}`}>
                    {activity.action}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{activity.user}</div>
                    <div className="text-sm text-slate-400">{activity.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="fuel-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-green-600/20 border border-green-600/30">
              <Settings className="w-6 h-6 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Acciones Rápidas</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={() => navigate('/admin/dashboard/users')}
              className="fuel-button-secondary p-4 text-left flex items-center gap-3 hover:bg-slate-800/50 transition-colors"
            >
              <Users className="w-5 h-5" />
              <div>
                <div className="font-medium">Gestionar Usuarios</div>
                <div className="text-sm text-slate-400">Agregar, editar o eliminar usuarios</div>
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/admin/dashboard/drivers')}
              className="fuel-button-secondary p-4 text-left flex items-center gap-3 hover:bg-slate-800/50 transition-colors"
            >
              <Truck className="w-5 h-5" />
              <div>
                <div className="font-medium">Gestionar Conductores</div>
                <div className="text-sm text-slate-400">Administrar información de conductores</div>
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/admin/dashboard/vehicles')}
              className="fuel-button-secondary p-4 text-left flex items-center gap-3 hover:bg-slate-800/50 transition-colors"
            >
              <Car className="w-5 h-5" />
              <div>
                <div className="font-medium">Gestionar Vehículos</div>
                <div className="text-sm text-slate-400">Administrar flota de vehículos</div>
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/admin/dashboard/reports')}
              className="fuel-button-secondary p-4 text-left flex items-center gap-3 hover:bg-slate-800/50 transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              <div>
                <div className="font-medium">Ver Reportes</div>
                <div className="text-sm text-slate-400">Generar reportes del sistema</div>
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/admin/dashboard/routes')}
              className="fuel-button-secondary p-4 text-left flex items-center gap-3 hover:bg-slate-800/50 transition-colors"
            >
              <Route className="w-5 h-5" />
              <div>
                <div className="font-medium">Gestionar Rutas</div>
                <div className="text-sm text-slate-400">Crear y administrar rutas</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Información del sistema */}
      <div className="fuel-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-slate-600/20 border border-slate-600/30">
            <Shield className="w-6 h-6 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Estado del Sistema</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-green-600/10 border border-green-600/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-green-400 font-medium">Servicios Online</span>
            </div>
            <p className="text-sm text-slate-400">Todos los servicios funcionando correctamente</p>
          </div>
          
          <div className="p-4 rounded-lg bg-blue-600/10 border border-blue-600/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span className="text-blue-400 font-medium">Base de Datos</span>
            </div>
            <p className="text-sm text-slate-400">Conexión estable y sincronizada</p>
          </div>
          
          <div className="p-4 rounded-lg bg-purple-600/10 border border-purple-600/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-purple-400"></div>
              <span className="text-purple-400 font-medium">Seguridad</span>
            </div>
            <p className="text-sm text-slate-400">Sistema de autenticación activo</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
