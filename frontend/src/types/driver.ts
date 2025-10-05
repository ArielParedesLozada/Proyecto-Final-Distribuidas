// Tipos para datos de conductor
export interface Driver {
  id: string;
  user_id: string;
  full_name: string;
  license_number: string;
  capabilities: number; // 1=Liviana, 2=Pesada, 3=Ambas
  availability: number; // 1=Disponible, 2=Ocupado, 3=FueraServicio
  created_at: string;
  updated_at: string;
}

export interface DriverResponse {
  driver: Driver;
}

export interface DriverProfile {
  fullName: string;
  role: string;
  email: string;
  licenseNumber: string;
  capabilities: string;
  availability: string;
}

export interface DriversListResponse {
  drivers: Driver[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}