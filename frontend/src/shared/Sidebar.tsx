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
                <div className="sidebar-brand-logo h-12 w-12 rounded-xl grid place-content-center shadow-lg transition-all duration-300 shrink-0">
                    {brand.logo ?? (
                        <span className="text-blue-300 font-bold text-xl group-hover:text-blue-200 transition-colors">
                            ⛽
                        </span>
                    )}
                </div>

                {/* Sólo texto cuando está expandido */}
                {!collapsed && (
                    <div className="leading-tight min-w-0">
                        <div className="sidebar-brand-text text-lg font-bold truncate">
                            {brand.full}
                        </div>
                        <div className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors truncate">
                            Sistema de Combustible
                        </div>
                    </div>
                )}
            </div>
        ),
        [brand, collapsed]
    );

    return (
        <aside
            className={[
                "sidebar-container relative z-50 h-screen flex flex-col transition-all duration-300 shrink-0",
                collapsed ? "w-20" : "w-64", // ancho más cómodo en modo compacto
                className,
            ].join(" ")}
        >
            {/* Botón de colapsar SIEMPRE visible */}
            <button
                className="sidebar-toggle-btn absolute top-3 right-3 p-2 rounded-xl transition-all duration-300 z-50"
                onClick={() => setCollapsed((v) => !v)}
                aria-label="toggle sidebar"
                title={collapsed ? "Expandir" : "Contraer"}
            >
                {collapsed ? (
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                ) : (
                    <ChevronLeft className="w-5 h-5 text-slate-300" />
                )}
            </button>

            {/* Encabezado/Logo */}
            <div className="px-4 pt-4 pb-2">{Brand}</div>

            {/* Navegación (con scroll si se llena) */}
            <nav className="mt-4 flex-1 px-3 overflow-y-auto overflow-x-hidden">
                <div className="space-y-2">
                    {items.map((it) => {
                        const active = isActive(it.to, it.exact);
                        return (
                            <Link
                                key={it.key}
                                to={it.to}
                                title={collapsed ? it.label : undefined}
                                className={[
                                    "no-underline focus:outline-none group flex items-center rounded-xl px-4 py-3 text-sm transition-all duration-300 relative",
                                    active ? "sidebar-nav-active" : "sidebar-nav-inactive",
                                    collapsed ? "justify-center" : "gap-3",
                                ].join(" ")}
                            >
                                <span className="w-6 h-6 shrink-0 transition-colors duration-300">
                                    {it.icon}
                                </span>

                                {/* Etiqueta sólo cuando está expandido */}
                                {!collapsed && (
                                    <span className="font-medium text-base">{it.label}</span>
                                )}

                                {/* Barra de estado activa */}
                                {active && !collapsed && (
                                    <div
                                        className="absolute right-2 w-1 h-8 rounded-full"
                                        style={{
                                            background:
                                                "linear-gradient(180deg, #60a5fa 0%, #06b6d4 100%)",
                                        }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Footer siempre visible (icono centrado si está colapsado) */}
            <div
                className="mt-auto px-3 py-4"
                style={{ borderTop: "1px solid rgba(51, 65, 85, 0.5)" }}
            >
                <button
                    onClick={onSignOut}
                    title={collapsed ? "Cerrar Sesión" : undefined}
                    className={[
                        "sidebar-logout-btn w-full flex items-center rounded-xl px-4 py-3 text-sm transition-all duration-300 group",
                        collapsed ? "justify-center" : "gap-3",
                    ].join(" ")}
                >
                    <LogOut className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                    {!collapsed && <span className="font-medium text-base">Cerrar Sesión</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
