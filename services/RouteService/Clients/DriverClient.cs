using ChoferService.Proto;
using Grpc.Core;

namespace RouteService.Clients;

public class DriverClient
{
    private readonly Lazy<DriversService.DriversServiceClient> _hiddenDrivers;
    private DriversService.DriversServiceClient _drivers => _hiddenDrivers.Value;
    public DriverClient(Lazy<DriversService.DriversServiceClient> client)
    {
        _hiddenDrivers = client;
    }
    private static CallOptions MakeCallOptions(string? bearer)
    {
        var md = new Metadata();
        if (!string.IsNullOrWhiteSpace(bearer)) md.Add("Authorization", bearer);
        return new CallOptions(md, deadline: DateTime.UtcNow.AddSeconds(1000));
    }
    public async Task<DriverResponse> GetDriverAsync(string id, string? bearer)
    {
        var req = new GetDriverRequest { Id = id };
        return await _drivers.GetDriverAsync(req, MakeCallOptions(bearer));
    }
    public async Task<DriverResponse> GetDriverByUserIdAsync(string userId, string? bearer)
    {
        var req = new GetDriverByUserIdRequest { UserId = userId };
        return await _drivers.GetDriverByUserIdAsync(req, MakeCallOptions(bearer));
    }
    public async Task<bool> DriverExistsByUserIdAsync(string userId, string? bearer)
    {
        var req = new GetDriverByUserIdRequest { UserId = userId };
        try
        {
            var result = await _drivers.GetDriverByUserIdAsync(req, MakeCallOptions(bearer));
            return result?.Driver != null;
        }
        catch (Exception)
        {
            return false;
        }
    }
    public async Task<string?> FindDriverByUserIdAsync(string userId, string? bearer)
    {
        var req = new GetDriverByUserIdRequest { UserId = userId };
        try
        {
            var result = await _drivers.GetDriverByUserIdAsync(req, MakeCallOptions(bearer));
            return result.Driver.Id;
        }
        catch (Exception)
        {
            return null;
        }
    }
    public async Task<bool> DriverExists(string driverId, string? bearer)
    {
        try
        {
            var request = new GetDriverRequest { Id = driverId };
            var result = await _drivers.GetDriverAsync(request, MakeCallOptions(bearer));
            return result?.Driver != null;
        }
        catch (RpcException ex) when (ex.StatusCode == StatusCode.NotFound)
        {
            return false;
        }
        catch (RpcException ex) when (ex.StatusCode == StatusCode.Unauthenticated)
        {
            throw new RpcException(new Status(StatusCode.Unauthenticated, "Invalid credentials for user lookup"));
        }
        catch (RpcException ex)
        {
            throw new RpcException(new Status(StatusCode.Unavailable, $"UserService unavailable {ex.Message}"));
        }
    }
    public async Task<bool> DriverIsAvailable(string driverId, string? bearer)
    {
        try
        {
            var request = new GetDriverRequest { Id = driverId };
            var driver = await _drivers.GetDriverAsync(request, MakeCallOptions(bearer));
            if (driver?.Driver == null)
            {
                return false;
            }
            return driver.Driver.Availability == 1;
        }
        catch (RpcException ex) when (ex.StatusCode == StatusCode.NotFound)
        {
            return false;
        }
        catch (RpcException ex) when (ex.StatusCode == StatusCode.Unauthenticated)
        {
            throw new RpcException(new Status(StatusCode.Unauthenticated, "Invalid credentials for user lookup"));
        }
        catch (RpcException ex)
        {
            throw new RpcException(new Status(StatusCode.Unavailable, $"UserService unavailable {ex.Message}"));
        }
    }

    public async Task<Driver> SetDriverAvailability(string driverId, int availability, string? bearer)
    {
        try
        {
            var request = new UpdateAvailabilityRequest { Id = driverId, Availability = availability };
            var response = await _drivers.UpdateAvailabilityAsync(request, MakeCallOptions(bearer));
            return response.Driver;
        }
        catch (RpcException ex) when (ex.StatusCode == StatusCode.InvalidArgument)
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, ex.Status.Detail));
        }
        catch (RpcException ex) when (ex.StatusCode == StatusCode.NotFound)
        {
            throw new RpcException(new Status(StatusCode.NotFound, "Driver not found"));
        }
        catch (RpcException ex) when (ex.StatusCode == StatusCode.PermissionDenied)
        {
            throw new RpcException(new Status(StatusCode.PermissionDenied, $"FORBIDDEN {ex.Status.Detail}"));
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
            throw new RpcException(new Status(StatusCode.Unavailable, $"DriverService unavailable: {ex.Message}"));
        }
    }
}