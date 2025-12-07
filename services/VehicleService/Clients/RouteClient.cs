using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using RoutesProto;
using RouteServiceProto = RoutesProto.RoutesService.RoutesServiceClient;

namespace VehicleService.Clients;

public class RouteClient
{
    private readonly Lazy<RouteServiceProto> _hiddenRoutes;
    private RouteServiceProto _routes => _hiddenRoutes.Value;
    public RouteClient(Lazy<RouteServiceProto> client)
    {
        _hiddenRoutes = client;
    }
    private static CallOptions MakeCallOptions(string? bearer)
    {
        var md = new Metadata();
        if (!string.IsNullOrWhiteSpace(bearer)) md.Add("Authorization", bearer);
        return new CallOptions(md, deadline: DateTime.UtcNow.AddSeconds(1000));
    }
    public async Task<Empty> DeleteRoutesByVehicleCascade(string vehicleId, string? bearer)
    {
        var req = new DeleteRouteByVehicleCascadeRequest { VehicleId = vehicleId };
        return await _routes.DeleteRoutesByVehicleCascadeAsync(req, MakeCallOptions(bearer));
    }
    public async Task<Empty> DeleteRoutesByDriverVehicleCascade(string driverVehicleAssignmentId, string? bearer)
    {
        var req = new DeleteRouteByDriverVehicleCascadeRequest { DriverVehicle = driverVehicleAssignmentId };
        return await _routes.DeleteRoutesByDriverVehicleCascadeAsync(req, MakeCallOptions(bearer));
    }
    public async Task<Empty> DeleteRoutesByDriverCascade(string driverId, string? bearer)
    {
        var req = new DeleteRoutesByDriverCascadeRequest { DriverId = driverId };
        return await _routes.DeleteRoutesByDriverCascadeAsync(req, MakeCallOptions(bearer));
    }
    
    /// <summary>
    /// Obtiene las rutas activas (Assigned o Started) para una asignación de vehículo-conductor
    /// </summary>
    public async Task<ListRoutesResponse> GetRoutesByDriverVehicle(string driverVehicleId, string? bearer)
    {
        var req = new ListRoutesByDriverVehicleRequest 
        { 
            DriverVehicleId = driverVehicleId,
            Page = 1,
            PageSize = 100 // Obtener todas las rutas activas
        };
        return await _routes.GetRoutesByDriverVehicleAsync(req, MakeCallOptions(bearer));
    }
    
    /// <summary>
    /// Obtiene las rutas para un vehículo por su ID
    /// </summary>
    public async Task<ListRoutesResponse> GetRoutesByVehicle(string vehicleId, string? bearer)
    {
        var req = new ListRoutesByVehicleRequest 
        { 
            VehicleId = vehicleId,
            Page = 1,
            PageSize = 100 // Obtener todas las rutas
        };
        return await _routes.GetRoutesByVehicleAsync(req, MakeCallOptions(bearer));
    }
}