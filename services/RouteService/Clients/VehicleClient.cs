using Grpc.Core;
using VehiclesService.Proto;
using VehicleServiceClient = VehiclesService.Proto.VehiclesService.VehiclesServiceClient;
namespace RouteService.Clients;

public class VehicleClient
{
    private readonly VehicleServiceClient _vehicleClient;

    public VehicleClient(VehicleServiceClient client)
    {
        _vehicleClient = client;
    }
    private static CallOptions MakeCallOptions(string? bearer)
    {
        var md = new Metadata();
        if (!string.IsNullOrWhiteSpace(bearer)) md.Add("Authorization", bearer);
        return new CallOptions(md, deadline: DateTime.UtcNow.AddSeconds(5));
    }
    public async Task<bool> GetDriverVehicleExists(string driverVehicleId, string? bearer)
    {
        var req = new DriverVehicleIdExistsRequest { DriverVechicleId = driverVehicleId };
        try
        {
            await _vehicleClient.GetDriverVehicleExistsAsync(req, MakeCallOptions(bearer));
            return true;
        }
        catch (Exception)
        {
            return false;
        }
    }
    public async Task<ListAssignmentsByDriverResponse> GetDriverAssignmentRows(string driverId, string? bearer)
    {
        var request = new ListAssignmentsByDriverRequest
        {
            DriverId = driverId
        };
        var response = await _vehicleClient.ListAssignmentsByDriverAsync(request, MakeCallOptions(bearer));
        return response;
    }
}