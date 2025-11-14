using Grpc.Core;
using VehiclesService.Proto;
using VehicleServiceClient = VehiclesService.Proto.VehiclesService.VehiclesServiceClient;
namespace RouteService.Clients;

public class VehicleClient
{
    private readonly Lazy<VehicleServiceClient> _hiddenVehicleClient;
    private VehicleServiceClient _vehicleClient => _hiddenVehicleClient.Value;
    public VehicleClient(Lazy<VehicleServiceClient> client)
    {
        _hiddenVehicleClient = client;
    }
    private static CallOptions MakeCallOptions(string? bearer)
    {
        var md = new Metadata();
        if (!string.IsNullOrWhiteSpace(bearer)) md.Add("Authorization", bearer);
        return new CallOptions(md, deadline: DateTime.UtcNow.AddSeconds(5));
    }
    public async Task<bool> VehicleExists(string vehicleId, string? bearer)
    {
        var req = new GetVehicleRequest { Id = vehicleId };
        try
        {
            var response = await _vehicleClient.GetVehicleAsync(req, MakeCallOptions(bearer));
            return response.Vehicle != null;
        }
        catch (Exception)
        {
            return false;
        }
    }
    public async Task<bool> IsVehicleAvailable(string vehicleId, string? bearer)
    {
        var req = new GetVehicleRequest { Id = vehicleId };
        try
        {
            var response = await _vehicleClient.GetVehicleAsync(req, MakeCallOptions(bearer));
            if (response.Vehicle == null)
            {
                return false;
            }
            return response.Vehicle.Status == 1;
        }
        catch (Exception)
        {
            return false;
        }
    }
    public async Task<Vehicle> UpdateVehicleStatus(string vehicleId, int status, string? bearer)
    {
        var req = new SetStatusRequest { Id = vehicleId, Status = status };
        try
        {
            var response = await _vehicleClient.SetStatusAsync(req, MakeCallOptions(bearer));
            return response.Vehicle;
        }
        catch (RpcException ex) when (ex.StatusCode == StatusCode.InvalidArgument)
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, ex.Status.Detail));
        }
        catch (RpcException ex) when (ex.StatusCode == StatusCode.NotFound)
        {
            throw new RpcException(new Status(StatusCode.NotFound, "VEHICLE_NOT_FOUND"));
        }
        catch (RpcException ex) when (ex.StatusCode == StatusCode.Unauthenticated)
        {
            throw new RpcException(new Status(StatusCode.Unauthenticated, "Invalid credentials"));
        }
        catch (RpcException ex) when (ex.StatusCode == StatusCode.Internal)
        {
            throw new RpcException(new Status(StatusCode.Internal, "Internal server error"));
        }
        catch (RpcException ex)
        {
            throw new RpcException(new Status(StatusCode.Unavailable, $"VehicleService unavailable: {ex.Message}"));
        }
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
    public async Task<AssignmentRow> GetAssignmentRow(string assignmentRow, string? bearer)
    {
        var request = new GetAssignmentRequest { AssignmentId = assignmentRow };
        var response = await _vehicleClient.GetAssignmentAsync(request, MakeCallOptions(bearer));
        if (response == null)
        {
            throw new RpcException(new Status(StatusCode.NotFound, "ASSIGNMENT_NOT_FOUND"));
        }
        return response;
    }
}