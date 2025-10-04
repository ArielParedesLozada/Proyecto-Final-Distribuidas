import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import type { INavItem } from "../interfaces/INavItem"; 

type Props = {
    brand?: {
        full?: string;
        short?: string;
        onClickBrand?: () => void;
        logo?: React.ReactNode;
    };
    items: INavItem[];
    onSignOut?: () => void;
    collapsedDefault?: boolean;
    className?: string;
};

const Sidebar: React.FC<Props> = ({
    brand = { full: "Fuel Manager", short: "FM" },
    items,
    onSignOut,
    collapsedDefault = false,
    className = "",
}) => {
    const { pathname } = useLocation();
    const [collapsed, setCollapsed] = useState(collapsedDefault);

    const isActive = (to: string, exact?: boolean) =>
        exact ? pathname === to : pathname.startsWith(to);

    const Brand = useMemo(
        () => (
            <div
                className="flex items-center gap-4 cursor-pointer select-none group"
                onClick={brand.onClickBrand}
                title={brand.full}
            >
                <div className="sidebar-brand-logo h-12 w-12 rounded-xl grid place-content-center shadow-lg transition-all duration-300">
                    {brand.logo ?? <span className="text-blue-300 font-bold text-xl group-hover:text-blue-200 transition-colors">⛽</span>}
                </div>
                {!collapsed && (
                    <div className="leading-tight">
                        <div className="sidebar-brand-text text-lg font-bold transition-all duration-300">
                            {brand.full}
                        </div>
                        <div className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Sistema de Combustible</div>
                    </div>
                )}
            </div>
        ),
        [brand, collapsed]
    );

    return (
        <aside
            className={[
                "sidebar-container flex h-screen flex-col transition-all duration-300 relative z-50",
                collapsed ? "w-[68px]" : "w-64",
                className,
            ].join(" ")}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4">
                {Brand}
                <button
                    className="sidebar-toggle-btn p-3 rounded-xl transition-all duration-300 group"
                    onClick={() => setCollapsed((v) => !v)}
                    aria-label="toggle sidebar"
                >
                    {collapsed ? (
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                    ) : (
                        <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                    )}
                </button>
            </div>

            {/* Nav */}
            <nav className="mt-8 flex-1 space-y-3 px-4">
                {items.map((it) => (
                    <Link
                        key={it.key}
                        to={it.to}
                        className={[
                            "no-underline focus:outline-none group flex items-center gap-4 rounded-xl px-5 py-4 text-sm transition-all duration-300 relative",
                            isActive(it.to, it.exact) ? "sidebar-nav-active" : "sidebar-nav-inactive"
                        ].join(" ")}
                    >
                        <span className="w-6 h-6 shrink-0 transition-colors duration-300">{it.icon}</span>
                        {!collapsed && <span className="font-medium transition-all duration-300 text-base">{it.label}</span>}
                        {isActive(it.to, it.exact) && (
                            <div 
                                className="absolute right-3 w-1 h-8 rounded-full"
                                style={{
                                    background: 'linear-gradient(180deg, #60a5fa 0%, #06b6d4 100%)'
                                }}
                            ></div>
                        )}
                    </Link>
                ))}
            </nav>

            {/* Footer: Sign out */}
            <div className="p-6 pt-4" style={{ borderTop: '1px solid rgba(51, 65, 85, 0.5)' }}>
                <button
                    onClick={onSignOut}
                    className="sidebar-logout-btn w-full flex items-center gap-4 rounded-xl px-5 py-4 text-sm transition-all duration-300 group"
                >
                    <LogOut className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                    <span className={collapsed ? "hidden" : "inline font-medium text-base"}>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
