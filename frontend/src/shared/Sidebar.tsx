import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, LogOut, Fuel } from "lucide-react";
import type { INavItem } from "../interfaces/INavItem";

type Props = {
    brand?: { full?: string; short?: string; onClickBrand?: () => void; logo?: React.ReactNode };
    items: INavItem[];
    onSignOut?: () => void;
    isMobileOpen?: boolean;
    onMobileToggle?: () => void;
    collapsedDefault?: boolean;
    className?: string;
    desktopTopOffset?: number;
};

const Sidebar: React.FC<Props> = ({
    brand = { full: "Fuel Manager", short: "FM" },
    items,
    onSignOut,
    isMobileOpen = false,
    onMobileToggle,
    collapsedDefault = false,
    className = "",
    desktopTopOffset = 15,
}) => {
    const { pathname } = useLocation();
    const [collapsed, setCollapsed] = useState(collapsedDefault);

    const isActive = (to: string, exact?: boolean) =>
        exact ? pathname === to : pathname.startsWith(to);

    const Brand = useMemo(
        () => (
            <div
                className="flex items-center gap-3 cursor-pointer select-none group min-w-0"
                onClick={brand.onClickBrand}
                title={brand.full}
            >
                {/* Logo más pequeño */}
                <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-gradient-to-tr from-sky-500 to-cyan-400 shadow-md shrink-0">
                    <Fuel style={{ width: "1.25rem", height: "1.25rem", color: "white" }} />
                </div>

                {/* Texto del brand (se oculta si está colapsado en desktop) */}
                <div className={["leading-tight min-w-0", collapsed ? "md:hidden" : "md:block"].join(" ")}>
                    <div className="sidebar-brand-text text-lg font-bold text-sky-100 truncate max-w-[9rem]">
                        {brand.full}
                    </div>
                    <div className="text-sm text-slate-400 whitespace-normal break-words">
                        Sistema de Combustible
                    </div>
                </div>
            </div>
        ),
        [brand, collapsed]
    );

    const desktopWidth = collapsed ? "md:w-24" : "md:w-64";

    return (
        <>
            {/* Overlay móvil */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-[1px] md:hidden z-40"
                    onClick={onMobileToggle}
                />
            )}

            <aside
                className={[
                    "fixed md:static inset-y-0 left-0 z-50 transition-transform duration-300 md:transition-none",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
                    "sidebar-container h-screen flex flex-col",
                    "w-72",
                    desktopWidth,
                    "md:overflow-hidden",
                    className,
                ].join(" ")}
            >
                {/* Ajuste para alinear con el topbar */}
                <div className="hidden md:block" style={{ height: desktopTopOffset }} />

                {/* Header del sidebar */}
                <div className="h-16 px-2 flex items-center justify-between">
                    <div className="pl-4 min-w-0">{Brand}</div>

                    {/* Botón expandir/contraer */}
                    <button
                        className="hidden md:inline-flex items-center justify-center h-9 w-9 mr-2 rounded-xl bg-slate-900/40 hover:bg-slate-800/60 transition-all focus:outline-none"
                        onClick={() => setCollapsed((v) => !v)}
                        aria-label={collapsed ? "Expandir" : "Contraer"}
                        title={collapsed ? "Expandir" : "Contraer"}
                    >
                        {collapsed ? (
                            <ChevronRight className="w-5 h-5 text-slate-300" />
                        ) : (
                            <ChevronLeft className="w-5 h-5 text-slate-300" />
                        )}
                    </button>
                </div>

                {/* Navegación */}
                <nav className="mt-2 flex-1 px-3 overflow-y-auto overflow-x-hidden">
                    <div className="space-y-2">
                        {items.map((it) => {
                            const active = isActive(it.to, it.exact);
                            return (
                                <Link
                                    key={it.key}
                                    to={it.to}
                                    title={collapsed ? it.label : undefined}
                                    className={[
                                        "no-underline focus:outline-none group flex items-center rounded-xl px-4 py-3 text-sm transition-all relative",
                                        active ? "sidebar-nav-active" : "sidebar-nav-inactive",
                                        collapsed ? "md:justify-center" : "gap-3",
                                    ].join(" ")}
                                    onClick={() => onMobileToggle?.()}
                                >
                                    <span className="w-6 h-6 shrink-0">{it.icon}</span>
                                    <span
                                        className={[
                                            "font-medium text-base",
                                            collapsed ? "md:hidden" : "md:inline",
                                            "inline",
                                        ].join(" ")}
                                    >
                                        {it.label}
                                    </span>
                                    {active && !collapsed && (
                                        <div
                                            className="absolute right-2 w-1 h-8 rounded-full hidden md:block"
                                            style={{
                                                background: "linear-gradient(180deg, #60a5fa 0%, #06b6d4 100%)",
                                            }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Footer */}
                <div
                    className="mt-auto px-3 py-4"
                    style={{ borderTop: "1px solid rgba(51, 65, 85, 0.5)" }}
                >
                    <button
                        onClick={onSignOut}
                        title="Cerrar Sesión"
                        className={[
                            "sidebar-logout-btn w-full flex items-center rounded-xl px-4 py-3 text-sm transition-all group",
                            collapsed ? "md:justify-center gap-0" : "gap-3",
                        ].join(" ")}
                    >
                        <LogOut className="w-6 h-6 text-rose-400" />
                        <span
                            className={[
                                "font-medium text-base text-rose-400",
                                collapsed ? "md:hidden" : "md:inline",
                                "inline",
                            ].join(" ")}
                        >
                            Cerrar Sesión
                        </span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
