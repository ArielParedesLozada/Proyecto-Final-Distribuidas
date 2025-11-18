namespace ChoferService.Clients;

using ChoferService.Proto;
using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using VehiclesService.Proto;
using VehiclesService = VehiclesService.Proto.VehiclesService;
public class VehicleClient
{
    private readonly Lazy<VehiclesService.VehiclesServiceClient> _hiddenClient;

    private VehiclesService.VehiclesServiceClient _client => _hiddenClient.Value;

    public VehicleClient(Lazy<VehiclesService.VehiclesServiceClient> client)
    {
        _hiddenClient = client;
    }
    private static string? GetAuthorization(ServerCallContext ctx)
    {
        return ctx.GetHttpContext()?.Request.Headers["Authorization"].ToString();

    }
    private static CallOptions MakeCallOptions(string? bearer)
    {
        var md = new Metadata();
        if (!string.IsNullOrWhiteSpace(bearer)) md.Add("Authorization", bearer);
        return new CallOptions(md, deadline: DateTime.UtcNow.AddSeconds(1000));
    }
    public async Task<Empty> DeleteDriverVehiclesCascade(string driverId, ServerCallContext context)
    {
        var request = new DeleteVehiclesByDriverRequest { DriverId = driverId };
        await _client.DeleteVehiclesByDriverCascadeAsync(request, MakeCallOptions(GetAuthorization(context)));
        return new Empty();
    }
}