using Grpc.Core;
using ChoferService.Proto;

namespace ChoferService.Services;

public class DriversServiceImpl : DriversService.DriversServiceBase
{
    private readonly ILogger<DriversServiceImpl> _logger;
    
    public DriversServiceImpl(ILogger<DriversServiceImpl> logger)
    {
        _logger = logger;
    }

    public override Task<DriverResponse> CreateDriver(CreateDriverRequest request, ServerCallContext context)
    {
        _logger.LogInformation("Creating driver for user {UserId}", request.UserId);
        
        // TODO: Implementar lógica de creación de conductor
        var driver = new Driver
        {
            Id = Guid.NewGuid().ToString(),
            UserId = request.UserId,
            FullName = request.FullName,
            LicenseNumber = request.LicenseNumber,
            Capabilities = request.Capabilities,
            Availability = request.Availability,
            CreatedAt = Google.Protobuf.WellKnownTypes.Timestamp.FromDateTime(DateTime.UtcNow),
            UpdatedAt = Google.Protobuf.WellKnownTypes.Timestamp.FromDateTime(DateTime.UtcNow)
        };

        return Task.FromResult(new DriverResponse { Driver = driver });
    }

    public override Task<DriverResponse> GetDriver(GetDriverRequest request, ServerCallContext context)
    {
        _logger.LogInformation("Getting driver {DriverId}", request.Id);
        
        // TODO: Implementar lógica de obtención de conductor
        throw new RpcException(new Status(StatusCode.Unimplemented, "GetDriver not implemented"));
    }

    public override Task<DriverResponse> GetDriverByUserId(GetDriverByUserIdRequest request, ServerCallContext context)
    {
        _logger.LogInformation("Getting driver by user ID {UserId}", request.UserId);
        
        // TODO: Implementar lógica de obtención de conductor por user ID
        throw new RpcException(new Status(StatusCode.Unimplemented, "GetDriverByUserId not implemented"));
    }

    public override Task<ListDriversResponse> ListDrivers(ListDriversRequest request, ServerCallContext context)
    {
        _logger.LogInformation("Listing drivers with page {Page}, page size {PageSize}, availability {Availability}", 
            request.Page, request.PageSize, request.Availability);
        
        // TODO: Implementar lógica de listado de conductores
        throw new RpcException(new Status(StatusCode.Unimplemented, "ListDrivers not implemented"));
    }

    public override Task<DriverResponse> UpdateAvailability(UpdateAvailabilityRequest request, ServerCallContext context)
    {
        _logger.LogInformation("Updating availability for driver {DriverId} to {Availability}", 
            request.Id, request.Availability);
        
        // TODO: Implementar lógica de actualización de disponibilidad
        throw new RpcException(new Status(StatusCode.Unimplemented, "UpdateAvailability not implemented"));
    }
}
