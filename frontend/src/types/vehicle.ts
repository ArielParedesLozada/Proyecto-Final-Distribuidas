// Tipos para vehículos

export interface Vehicle {
  id: string;
  plate: string;
  type: string;
  brand: string;
  model: string;
  year: number;
  capacity_liters: number;
  odometer_km: number;
  status: number; // 1=ACTIVO, 2=INACTIVO
  driver_id?: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleWithDriver extends Vehicle {
  driver?: {
    id: string;
    full_name: string;
    license_number: string;
  };
}

export interface VehicleResponse {
  vehicle: Vehicle;
}

export interface ListVehiclesByDriverResponse {
  vehicles: Vehicle[];
}

export interface ListVehiclesResponse {
  vehicles: Vehicle[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Mapeo de estados
export const VehicleStatus = {
  ACTIVO: 1,
  INACTIVO: 2,
} as const;

export const VehicleStatusLabels: Record<number, string> = {
  1: "Activo",
  2: "Inactivo",
};
