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
}