import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../../shared/Sidebar";
import ScrollableContainer from "../../shared/ScrollableContainer";
import { driverNavItems } from "../../utils/driverNav";
import { useAuth } from "../../hooks/useAuth";
import BackgroundEffects from "../../components/auth/BackgroundEffects";

const DriverPage: React.FC = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    return (
        // Layout a pantalla completa. El scroll NO está aquí.
        <div className="flex h-screen text-white relative overflow-hidden">
            {/* Fondo animado (detrás de todo) */}
            <BackgroundEffects />

            {/* Sidebar fijo (no scrollea) */}
            <div className="relative z-10 h-full">
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

            {/* Panel derecho: header fijo + contenido con scroll independiente */}
            <main className="flex-1 flex flex-col relative z-10">
                {/* Header pegajoso dentro del panel derecho */}
                <header className="fuel-card border-b border-slate-800/60 px-6 py-4 mx-6 mt-4 mb-2 backdrop-blur flex justify-between items-center sticky top-0 z-20">
                    <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        Panel del Chofer
                    </div>
                    <div className="text-sm text-slate-300">
                        Bienvenido,{" "}
                        <span className="text-white font-semibold">
                            {user?.name || "Usuario"}
                        </span>
                    </div>
                </header>

                {/* Contenido scrollable (solo esta área se desplaza) */}
                <ScrollableContainer className="flex-1 px-6 pb-6">
                    <Outlet />
                </ScrollableContainer>
            </main>
        </div>
    );
};

export default DriverPage;
