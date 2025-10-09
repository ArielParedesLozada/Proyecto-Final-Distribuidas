// Tipos para datos de vehículo
export interface Vehicle {
  id: string;
  plate: string;
  type: string;
  brand: string;
  model: string;
  year: number;
  capacity_liters: number;
  odometer_km: number;
  status: number; // 1=Disponible, 2=En uso, 3=Mantenimiento, 4=Fuera de servicio
  driver_id?: string; // ID del conductor asignado (opcional)
  created_at: string;
  updated_at: string;
}

export interface VehicleResponse {
  vehicle: Vehicle;
}

export interface VehiclesListResponse {
  vehicles: Vehicle[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface VehicleFormData {
  plate: string;
  type: string;
  brand: string;
  model: string;
  year: number;
  capacity_liters: number;
  odometer_km: number;
  status: number;
  driver_id?: string;
}

// Tipos para el conductor asignado
export interface AssignedDriver {
  id: string;
  full_name: string;
  license_number: string;
}

export interface VehicleWithDriver extends Vehicle {
  driver?: AssignedDriver;
}
