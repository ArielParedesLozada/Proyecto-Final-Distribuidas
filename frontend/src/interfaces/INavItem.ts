import type { ReactNode } from "react";

export interface INavItem {
    key: string;           
    label: string;         
    to: string;            
    icon?: ReactNode;      
    exact?: boolean;       
}
