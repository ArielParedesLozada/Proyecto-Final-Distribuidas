export type RouteProto = {
    id: string;
    driverVehicleId: string;
    driverId: string;
    vehicleId: string;
    assignedAt: string;
    originName: string;
    destinationName: string;
    status: "ROUTE_STATE_UNASSIGNED" | "ROUTE_STATE_ASSIGNED" | "ROUTE_STATE_STARTED" | "ROUTE_STATE_COMPLETED";
    createdAt: string;
    startedAt?: string | null;
    completedAt?: string | null;
    coordinateStart: CoordinateProto;
    coordinateStop: CoordinateProto;
    distanceKm: number;
    realDistanceKm: number;
    estimatedFuelConsumptionLiters: number;
    realFuelConsumptionLiters: number;
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