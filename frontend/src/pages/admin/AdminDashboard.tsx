import React from "react";
import { Users, Car, BarChart3, Settings, Shield, TrendingUp, AlertTriangle } from "lucide-react";

const AdminDashboard: React.FC = () => {
  const stats = [
    { title: "Total Usuarios", value: "24", icon: <Users className="w-6 h-6" />, color: "blue" },
    { title: "Conductores Activos", value: "18", icon: <Car className="w-6 h-6" />, color: "green" },
    { title: "Viajes Completados", value: "156", icon: <BarChart3 className="w-6 h-6" />, color: "purple" },
    { title: "Alertas", value: "3", icon: <AlertTriangle className="w-6 h-6" />, color: "red" }
  ];

  const recentActivities = [
    { id: 1, user: "Juan Pérez", action: "Creó nuevo conductor", time: "Hace 2 horas", type: "success" },
    { id: 2, user: "María García", action: "Actualizó configuración", time: "Hace 4 horas", type: "info" },
    { id: 3, user: "Carlos López", action: "Eliminó usuario inactivo", time: "Hace 6 horas", type: "warning" },
    { id: 4, user: "Ana Martínez", action: "Generó reporte mensual", time: "Hace 1 día", type: "success" }
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

  const getActivityColor = (type: string) => {
    const colors = {
      success: "bg-green-600/20 text-green-400",
      info: "bg-blue-600/20 text-blue-400",
      warning: "bg-yellow-600/20 text-yellow-400",
      error: "bg-red-600/20 text-red-400"
    };
    return colors[type as keyof typeof colors] || colors.info;
  };

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
              <span className="text-sm text-green-400">+12% este mes</span>
            </div>
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
          
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getActivityColor(activity.type)}`}>
                  {activity.action}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">{activity.user}</div>
                  <div className="text-sm text-slate-400">{activity.time}</div>
                </div>
              </div>
            ))}
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
            <button className="fuel-button-secondary p-4 text-left flex items-center gap-3">
              <Users className="w-5 h-5" />
              <div>
                <div className="font-medium">Gestionar Usuarios</div>
                <div className="text-sm text-slate-400">Agregar, editar o eliminar usuarios</div>
              </div>
            </button>
            
            <button className="fuel-button-secondary p-4 text-left flex items-center gap-3">
              <Car className="w-5 h-5" />
              <div>
                <div className="font-medium">Gestionar Conductores</div>
                <div className="text-sm text-slate-400">Administrar información de conductores</div>
              </div>
            </button>
            
            <button className="fuel-button-secondary p-4 text-left flex items-center gap-3">
              <BarChart3 className="w-5 h-5" />
              <div>
                <div className="font-medium">Ver Reportes</div>
                <div className="text-sm text-slate-400">Generar reportes del sistema</div>
              </div>
            </button>
            
            <button className="fuel-button-secondary p-4 text-left flex items-center gap-3">
              <Shield className="w-5 h-5" />
              <div>
                <div className="font-medium">Configuración</div>
                <div className="text-sm text-slate-400">Ajustes del sistema</div>
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
