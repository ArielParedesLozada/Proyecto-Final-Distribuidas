import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../../shared/Sidebar";
import ScrollableContainer from "../../shared/ScrollableContainer";
import { useAuth } from "../../hooks/useAuth";
import BackgroundEffects from "../../components/auth/BackgroundEffects";
import { User, Loader2, Settings, Users, BarChart3, Shield, Truck } from "lucide-react";

// Items de navegación para admin
const adminNavItems = [
  {
    key: "dashboard",
    label: "Dashboard",
    to: "/admin/dashboard",
    icon: <BarChart3 className="w-5 h-5" />,
    exact: true
  },
  {
    key: "users",
    label: "Usuarios",
    to: "/admin/dashboard/users",
    icon: <Users className="w-5 h-5" />
  },
  {
    key: "drivers",
    label: "Conductores",
    to: "/admin/drivers",
    icon: <Truck className="w-5 h-5" />
  },
  {
    key: "settings",
    label: "Configuración",
    to: "/admin/dashboard/settings",
    icon: <Settings className="w-5 h-5" />
  }
];

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Simular carga de datos del admin
  useEffect(() => {
    const loadAdminData = async () => {
      try {
        // Aquí podrías cargar datos específicos del admin
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error loading admin data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminData();
  }, []);

  // Mostrar loading mientras se cargan los datos
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  const displayName = user?.email || "Administrador";

  return (
    <div className="flex h-screen text-white relative overflow-hidden">
      <BackgroundEffects />
      <div className="relative z-10 h-full">
        <Sidebar
          brand={{ full: "Fuel Manager", short: "FM", onClickBrand: () => navigate("/admin/dashboard") }}
          items={adminNavItems}
          onSignOut={logout}
        />
      </div>

      <main className="flex-1 flex flex-col relative z-10">
        <header
          className="sticky top-0 z-20 border-b border-slate-800/60 px-6 py-3 shadow-lg"
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.95)", 
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-600/20 border border-red-600/30">
                <Shield className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Panel de Administración</h1>
                <p className="text-sm text-slate-400">Sistema de Gestión</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-slate-400 text-sm leading-none">Administrador</div>
                <div className="font-semibold text-white leading-none">
                  {displayName}
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center border border-red-400/40">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </header>

        <ScrollableContainer className="flex-1 p-6">
          <Outlet />
        </ScrollableContainer>
      </main>
    </div>
  );
};

export default AdminPage;
