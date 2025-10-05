import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../../shared/Sidebar";
import { driverNavItems } from "../../utils/driverNav";
import { useAuth } from "../../hooks/useAuth";

const DriverLayout: React.FC = () => {
    const nav = useNavigate();
    const { logout } = useAuth();

    return (
        <div className="flex min-h-screen bg-slate-950 text-white">
            <Sidebar
                brand={{ full: "Fuel Manager", short: "FM", onClickBrand: () => nav("/driver") }}
                items={driverNavItems}
                onSignOut={logout}
            />
            <main className="flex-1 grid grid-rows-[auto,1fr]">
                <header className="border-b border-slate-800/60 px-6 py-3 bg-slate-950/60 backdrop-blur">
                    <div className="text-lg font-semibold">Panel del Chofer</div>
                </header>
                <section className="p-6 overflow-auto">
                    <Outlet />
                </section>
            </main>
        </div>
    );
};
export default DriverLayout;
