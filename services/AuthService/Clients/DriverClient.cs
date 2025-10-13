using ChoferService.Proto;
using Grpc.Core;

namespace AuthService.Clients;

public class DriverClient
{
    private readonly DriversService.DriversServiceClient _drivers;

    public DriverClient(DriversService.DriversServiceClient drivers)
    {
        _drivers = drivers;
    }
    private static CallOptions MakeCallOptions(ServerCallContext ctx)
    {
        string? bearer = ctx.GetHttpContext()?.Request.Headers["Authorization"].ToString();
        var md = new Metadata();
        if (!string.IsNullOrWhiteSpace(bearer)) md.Add("Authorization", bearer);
        return new CallOptions(md, deadline: DateTime.UtcNow.AddSeconds(5));
    }

    public async Task<bool> UpdateDriverNameAsync(string userId, string newName, ServerCallContext ctx)
    {
        try
        {
            var headers = MakeCallOptions(ctx);
            var getRequest = new GetDriverByUserIdRequest { UserId = userId };
            DriverResponse driverResponse;
            try
            {
                driverResponse = await _drivers.GetDriverByUserIdAsync(getRequest, headers);
            }
            catch (RpcException ex) when (ex.StatusCode == StatusCode.NotFound)
            {
                return true; // No es un error, simplemente no hay conductor
            }
            var driver = driverResponse.Driver;

            // Actualizar solo el nombre del conductor
            var updateRequest = new UpdateDriverRequest
            {
                Id = driver.Id,
                FullName = newName,
                LicenseNumber = driver.LicenseNumber,
                Capabilities = driver.Capabilities,
                Availability = driver.Availability
            };
            await _drivers.UpdateDriverAsync(updateRequest, headers);
            return true;
        }
        catch (RpcException ex)
        {
            System.Console.WriteLine($"Error: {ex.Status} {ex.Status.Detail} {ex.StatusCode}");
            return false;
        }
        catch (Exception ex)
        {
            System.Console.WriteLine($"Error inesperado {ex.Message} {ex.StackTrace}");
            return false;
        }
    }
}