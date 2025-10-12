using ChoferService.Proto;
using Grpc.Core;

namespace VehicleService.Clients;

public class DriverClient
{
    private readonly DriversService.DriversServiceClient _drivers;

    public DriverClient(DriversService.DriversServiceClient client)
    {
        _drivers = client;
    }
    private static CallOptions MakeCallOptions(string? bearer)
    {
        var md = new Metadata();
        if (!string.IsNullOrWhiteSpace(bearer)) md.Add("Authorization", bearer);
        return new CallOptions(md, deadline: DateTime.UtcNow.AddSeconds(5));
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
}