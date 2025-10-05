import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../../shared/Sidebar";
import ScrollableContainer from "../../shared/ScrollableContainer";
import { driverNavItems } from "../../utils/driverNav";
import { useAuth } from "../../hooks/useAuth";
import BackgroundEffects from "../../components/auth/BackgroundEffects";
import { User, Menu } from "lucide-react";

const DriverPage: React.FC = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const displayName = user?.name || "Usuario";

    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="flex h-screen text-white relative overflow-hidden">
            <BackgroundEffects />

            <Sidebar
                brand={{ full: "Fuel Manager", short: "FM", onClickBrand: () => navigate("/driver") }}
                items={driverNavItems}
                onSignOut={logout}
                isMobileOpen={mobileOpen}
                onMobileToggle={() => setMobileOpen((v) => !v)}
            />

            <main className="flex-1 flex flex-col relative z-10">
                <header
                    className="sticky top-0 z-20 border-b border-slate-800/60 px-4 md:px-6 py-3 shadow-lg flex items-center justify-between"
                    style={{ backgroundColor: "rgba(15, 23, 42, 0.95)", backdropFilter: "blur(20px)" }}
                >
                    {/* Botón menú móvil */}
                    <button
                        className="md:hidden p-2 rounded-lg border border-slate-700/60 bg-slate-900/40 hover:bg-slate-800/60"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Abrir menú"
                    >
                        <Menu className="w-5 h-5 text-slate-200" />
                    </button>

                    {/* Separador para empujar el usuario a la derecha en mobile */}
                    <div className="flex-1" />

                    {/* Usuario a la derecha */}
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-slate-400 text-xs md:text-sm leading-none">Bienvenido</div>
                            <div className="font-semibold text-white leading-none truncate max-w-[40vw] md:max-w-none">
                                {displayName}
                            </div>
                        </div>
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center border border-cyan-400/40">
                            <User className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </header>

                {/* Contenido con scroll */}
                <ScrollableContainer className="flex-1 p-4 md:p-6">
                    <Outlet />
                </ScrollableContainer>
            </main>
        </div>
    );
};

export default DriverPage;
