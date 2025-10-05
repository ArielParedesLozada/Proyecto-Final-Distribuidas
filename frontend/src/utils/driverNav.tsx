import { LayoutDashboard, Route, Truck, User } from "lucide-react";
import type { INavItem } from "../interfaces/INavItem";

export const driverNavItems: INavItem[] = [
    { key: "dashboard", label: "Dashboard", to: "/driver", exact: true, icon: <LayoutDashboard className="w-5 h-5" /> },
    { key: "viajes", label: "Viajes", to: "/driver/trips", icon: <Route className="w-5 h-5" /> },
    { key: "vehiculo", label: "Vehiculos", to: "/driver/vehicle", icon: <Truck className="w-5 h-5" /> },
    { key: "perfil", label: "Perfil", to: "/driver/profile", icon: <User className="w-5 h-5" /> },
];
