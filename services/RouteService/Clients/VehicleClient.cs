using Grpc.Core;
using VehiclesService.Proto;
using VehicleServiceClient = VehiclesService.Proto.VehiclesService.VehiclesServiceClient;
using RouteDomain = RouteService.Domain.Route;
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
        return new CallOptions(md, deadline: DateTime.UtcNow.AddSeconds(1000));
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
    public async Task<AssignmentRow> GetDriverVehicleExists(string driverVehicleId, string? bearer)
    {
        var req = new DriverVehicleIdExistsRequest { DriverVechicleId = driverVehicleId };
        var result = await _vehicleClient.GetDriverVehicleExistsAsync(req, MakeCallOptions(bearer));
        return result;
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
        var response = await _vehicleClient.GetAssignmentAsync(request, MakeCallOptions(bearer)) ?? throw new RpcException(new Status(StatusCode.NotFound, "ASSIGNMENT_NOT_FOUND"));
        return response;
    }
    public async Task<Vehicle> GetVehicle(string vehicleId, string? bearer)
    {
        var request = new GetVehicleRequest { Id = vehicleId };
        var vehicle = await _vehicleClient.GetVehicleAsync(request, MakeCallOptions(bearer));
        var response = vehicle.Vehicle ?? throw new RpcException(new Status(StatusCode.NotFound, "VEHICLE_NOT_FOUND"));
        return response;
    }
    public async Task<Vehicle> UpdateVehicleRouteEnded(string vehicleId, RouteDomain route, string? bearer)
    {
        var realDistanceKm = (double)(route.RealDistanceKm.HasValue && route.RealDistanceKm.Value > 0 ? route.RealDistanceKm : route.EstimatedDistanceKm);
        var request = new UpdateVehicleRouteEndingRequest { VehicleId = vehicleId, DistanceRouteKm = realDistanceKm };
        var response = await _vehicleClient.UpdateVehicleRouteEndingAsync(request, MakeCallOptions(bearer));
        return response;
    }
    public async Task<ListAssignmentsByVehicleResponse> GetAssignmentRowsByVehicleId(string vehicleId, string? bearer)
    {
        var request = new GetAssignmentsByVehicleRequest { VehicleId = vehicleId };
        var response = await _vehicleClient.GetAssignmentRowsByVehicleIdAsync(request, MakeCallOptions(bearer));
        return response;
    }
}