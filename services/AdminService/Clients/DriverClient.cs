using ChoferService.Proto;
using Grpc.Core;

namespace AdminService.Clients;

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
    public async Task<DriverResponse> CreateDriverAsync(CreateDriverRequest request, string? bearer)
    {
        return await _drivers.CreateDriverAsync(request, MakeCallOptions(bearer));
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
    public async Task<ListDriversResponse> ListDriversAsync(int? availability, int page, int pageSize, string? bearer)
    {
        var req = new ListDriversRequest
        {
            Page = page,
            PageSize = pageSize
        };

        if (availability.HasValue)
            req.Availability = availability.Value;

        return await _drivers.ListDriversAsync(req, MakeCallOptions(bearer));
    }
    public async Task<DriverResponse> UpdateAvailabilityAsync(string id, int availability, string? bearer)
    {
        var req = new UpdateAvailabilityRequest
        {
            Id = id,
            Availability = availability
        };

        return await _drivers.UpdateAvailabilityAsync(req, MakeCallOptions(bearer));
    }
    public async Task<DriverResponse> UpdateDriverAsync(UpdateDriverRequest request, string? bearer)
    {
        return await _drivers.UpdateDriverAsync(request, MakeCallOptions(bearer));
    }
    public async Task DeleteDriverAsync(string id, string? bearer)
    {
        var req = new DeleteDriverRequest { Id = id };
        await _drivers.DeleteDriverAsync(req, MakeCallOptions(bearer));
    }
    public async Task DeleteDriverByUserIdAsync(string userId, string? bearer)
    {
        try
        {
            var userRequest = new GetDriverByUserIdRequest { UserId = userId };
            var response = await _drivers.GetDriverByUserIdAsync(userRequest, MakeCallOptions(bearer));
            if (response?.Driver == null)
            {
                return;
            }
            var driverRequest = new DeleteDriverRequest { Id = response.Driver.Id };
            await _drivers.DeleteDriverAsync(driverRequest, MakeCallOptions(bearer));
        }
        catch (RpcException ex) when (ex.StatusCode == StatusCode.NotFound)
        {
            return;
        }
    }
}