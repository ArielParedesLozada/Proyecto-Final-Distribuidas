import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../../shared/Sidebar";
import { driverNavItems } from "../../utils/driverNav";
import { useAuth } from "../../hooks/useAuth";
import BackgroundEffects from "../../components/auth/BackgroundEffects";

const DriverPage: React.FC = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    return (
        <div className="flex min-h-screen text-white relative overflow-hidden">
            {/* Efectos de fondo como en el login */}
            <BackgroundEffects />
            
            {/* Sidebar reutilizable */}
            <div className="relative z-10">
                <Sidebar
                    brand={{
                        full: "Fuel Manager",
                        short: "FM",
                        onClickBrand: () => navigate("/driver"),
                    }}
                    items={driverNavItems}
                    onSignOut={logout}
                />
            </div>

            {/* Contenido principal */}
            <main className="flex-1 grid grid-rows-[auto,1fr] relative z-10">
                {/* Encabezado con glassmorphism */}
                <header className="fuel-card border-b border-slate-800/60 px-6 py-4 mx-6 mt-4 mb-2 backdrop-blur flex justify-between items-center">
                    <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        Panel del Chofer
                    </div>
                    <div className="text-sm text-slate-300">
                        Bienvenido, <span className="text-white font-semibold">{user?.name || "Usuario"}</span>
                    </div>
                </header>

                {/* Secciones (Dashboard, Viajes, etc.) */}
                <section className="p-6 overflow-auto">
                    <Outlet />
                </section>
            </main>
        </div>
    );
};

export default DriverPage;
