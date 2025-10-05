import { LayoutDashboard, Route, Truck, User } from "lucide-react";
import type { INavItem } from "../interfaces/INavItem";

export const driverNavItems: INavItem[] = [
    { key: "dashboard", label: "Dashboard", to: "/drivers/dashboard", exact: true, icon: <LayoutDashboard className="w-5 h-5" /> },
    { key: "viajes", label: "Viajes", to: "/drivers/dashboard/trips", icon: <Route className="w-5 h-5" /> },
    { key: "vehiculo", label: "Vehiculo", to: "/drivers/dashboard/vehicle", icon: <Truck className="w-5 h-5" /> },
    { key: "perfil", label: "Perfil", to: "/drivers/dashboard/profile", icon: <User className="w-5 h-5" /> },
];
