import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../../shared/Sidebar";
import ScrollableContainer from "../../shared/ScrollableContainer";
import { driverNavItems } from "../../utils/driverNav";
import { useAuth } from "../../hooks/useAuth";
import BackgroundEffects from "../../components/auth/BackgroundEffects";
import { User } from "lucide-react";

const DriverPage: React.FC = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const displayName = user?.name || "Chofer";

    return (
        <div className="flex h-screen text-white relative overflow-hidden">
            <BackgroundEffects />
            <div className="relative z-10 h-full">
                <Sidebar
                    brand={{ full: "Fuel Manager", short: "FM", onClickBrand: () => navigate("/driver") }}
                    items={driverNavItems}
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
                    <div className="w-full flex items-center justify-end gap-3">
                        <div className="text-right">
                            <div className="text-slate-400 text-sm leading-none">Bienvenido</div>
                            <div className="font-semibold text-white leading-none">
                                {displayName}
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center border border-cyan-400/40">
                            <User className="w-5 h-5 text-white" />
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

export default DriverPage;
