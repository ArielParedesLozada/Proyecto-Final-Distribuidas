import { LayoutDashboard, Route, Truck, User } from "lucide-react";
import type { INavItem } from "../interfaces/INavItem";

export const driverNavItems: INavItem[] = [
    { key: "dashboard", label: "Dashboard", to: "/driver", exact: true, icon: <LayoutDashboard className="w-5 h-5" /> },
    { key: "viajes", label: "Viajes", to: "/driver/viajes", icon: <Route className="w-5 h-5" /> },
    { key: "vehiculo", label: "Vehiculo", to: "/driver/vehiculo", icon: <Truck className="w-5 h-5" /> },
    { key: "perfil", label: "Perfil", to: "/driver/perfil", icon: <User className="w-5 h-5" /> },
];
