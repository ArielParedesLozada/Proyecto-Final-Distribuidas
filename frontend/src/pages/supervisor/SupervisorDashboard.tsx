import React from "react";
import { Users, Car, MapPin, Clock, TrendingUp, AlertCircle, CheckCircle, Eye } from "lucide-react";

const SupervisorDashboard: React.FC = () => {
  const stats = [
    { title: "Conductores Activos", value: "18", icon: <Users className="w-6 h-6" />, color: "blue" },
    { title: "Viajes en Curso", value: "12", icon: <Car className="w-6 h-6" />, color: "green" },
    { title: "Viajes Completados Hoy", value: "45", icon: <CheckCircle className="w-6 h-6" />, color: "purple" },
    { title: "Alertas Pendientes", value: "3", icon: <AlertCircle className="w-6 h-6" />, color: "red" }
  ];

  const activeDrivers = [
    { id: 1, name: "Juan Pérez", status: "En Viaje", location: "Zona Norte", eta: "15 min" },
    { id: 2, name: "María García", status: "Disponible", location: "Centro", eta: "-" },
    { id: 3, name: "Carlos López", status: "En Viaje", location: "Zona Sur", eta: "8 min" },
    { id: 4, name: "Ana Martínez", status: "Descanso", location: "Base", eta: "30 min" }
  ];

  const recentTrips = [
    { id: 1, driver: "Juan Pérez", route: "Centro → Norte", duration: "45 min", status: "Completado" },
    { id: 2, driver: "María García", route: "Sur → Centro", duration: "32 min", status: "Completado" },
    { id: 3, driver: "Carlos López", route: "Norte → Sur", duration: "En curso", status: "Activo" },
    { id: 4, driver: "Ana Martínez", route: "Centro → Este", duration: "28 min", status: "Completado" }
  ];

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
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">+8% vs ayer</span>
            </div>
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
          
          <div className="space-y-4">
            {activeDrivers.map((driver) => (
              <div key={driver.id} className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {driver.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">{driver.name}</div>
                  <div className="text-sm text-slate-400 flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    {driver.location}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                    {driver.status}
                  </div>
                  {driver.eta !== "-" && (
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {driver.eta}
                    </div>
                  )}
                </div>
              </div>
            ))}
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
          
          <div className="space-y-4">
            {recentTrips.map((trip) => (
              <div key={trip.id} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-white">{trip.driver}</div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                    {trip.status}
                  </div>
                </div>
                <div className="text-sm text-slate-400 mb-2">{trip.route}</div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  {trip.duration}
                </div>
              </div>
            ))}
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
            <p className="text-sm text-slate-400">18 de 20 conductores activos</p>
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
            <p className="text-sm text-slate-400">3 alertas pendientes de revisión</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;
