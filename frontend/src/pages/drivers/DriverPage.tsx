import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../../shared/Sidebar";
import ScrollableContainer from "../../shared/ScrollableContainer";
import { driverNavItems } from "../../utils/driverNav";
import { useAuth } from "../../hooks/useAuth";
import BackgroundEffects from "../../components/auth/BackgroundEffects";
import { User, Menu, Loader2 } from "lucide-react";
import { api } from "../../api/api";
import type { DriverResponse } from "../../types/driver";

const DriverPage: React.FC = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    // Estado para datos del conductor (tu parte)
    const [driverData, setDriverData] = useState<DriverResponse["driver"] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>("");

    // Estado para menú móvil (parte de tu amigo)
    const [mobileOpen, setMobileOpen] = useState(false);

    // Obtener datos del conductor
    useEffect(() => {
        const fetchDriverData = async () => {
            try {
                setIsLoading(true);
                setError("");

                const response = await api<DriverResponse>("/me/driver");
                setDriverData(response.driver);
            } catch (err) {
                console.error("Error fetching driver data:", err);
                setError(
                    err instanceof Error ? err.message : "Error al cargar datos del conductor"
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchDriverData();
    }, []);

    const displayName =
        driverData?.full_name?.trim() ||
        user?.name?.trim() ||
        user?.email ||
        "Chofer";


    // Loading
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-900">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-slate-400">Cargando datos del conductor...</p>
                </div>
            </div>
        );
    }

    // Error
    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-900">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="text-red-500 mb-4">
                        <User className="w-16 h-16 mx-auto mb-2" />
                        <h2 className="text-xl font-semibold">Error al cargar datos</h2>
                    </div>
                    <p className="text-slate-400 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen text-white relative overflow-hidden">
            <BackgroundEffects />

            {/* Sidebar con soporte móvil */}
            <Sidebar
                brand={{
                    full: "Fuel Manager",
                    short: "FM",
                    onClickBrand: () => navigate("/drivers/dashboard"),
                }}
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
                            <div className="text-slate-400 text-xs md:text-sm leading-none">
                                Bienvenido
                            </div>
                            <div className="font-semibold text-white leading-none truncate max-w-[40vw] md:max-w-none">
                                {displayName}
                            </div>
                            {driverData && (
                                <div className="text-xs text-slate-500">
                                    {driverData.license_number}
                                </div>
                            )}
                        </div>
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center border border-cyan-400/40">
                            <User className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </header>

                {/* Contenido con scroll; pasamos driverData por context para tus rutas hijas */}
                <ScrollableContainer className="flex-1 p-4 md:p-6">
                    <Outlet context={{ driverData }} />
                </ScrollableContainer>
            </main>
        </div>
    );
};

export default DriverPage;
