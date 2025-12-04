export type ObservationProto = {
    id?: string;
    routeId?: string;
    text?: string;
    createdAt?: string;
    createdBy?: string;
    route_id?: string;
    created_at?: string;
    created_by?: string;
};

export type RouteProto = {
    id?: string;
    driverVehicleId?: string;
    driverId?: string;
    vehicleId?: string;
    assignedAt?: string | null;
    originName?: string;
    destinationName?: string;
    status?: "ROUTE_STATE_UNASSIGNED" | "ROUTE_STATE_ASSIGNED" | "ROUTE_STATE_STARTED" | "ROUTE_STATE_COMPLETED" | number;
    createdAt?: string;
    startedAt?: string | null;
    completedAt?: string | null;
    coordinateStart?: CoordinateProto;
    coordinateStop?: CoordinateProto;
    distanceKm?: number;
    realDistanceKm?: number;
    estimatedFuelConsumptionLiters?: number;
    realFuelConsumptionLiters?: number;
    observations?: ObservationProto[];
    // Campos en snake_case (respuesta de la API)
    driver_vehicle_id?: string;
    driver_id?: string;
    vehicle_id?: string;
    assigned_at?: string | null;
    origin_name?: string;
    destination_name?: string;
    created_at?: string;
    started_at?: string | null;
    completed_at?: string | null;
    coordinate_start?: CoordinateProto;
    coordinate_stop?: CoordinateProto;
    distance_km?: number;
    real_distance_km?: number;
    estimated_fuel_consumption_liters?: number;
    real_fuel_consumption_liters?: number;
};

export interface CoordinateProto {
    latitude: number
    longitude: number
}

export interface ListRoutesResponse {
    routes: RouteProto[]
    page: number
    pageSize: number
    totalPages: number
}