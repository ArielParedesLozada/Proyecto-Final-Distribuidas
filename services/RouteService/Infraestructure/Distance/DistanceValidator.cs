using Grpc.Core;
using RouteService.Domain;

namespace RouteService.Infraestructure.Distance;

public class DistanceValidator
{
    private readonly IDistanceService _distanceService;

    public DistanceValidator(IDistanceService distanceService)
    {
        _distanceService = distanceService;
    }

    public async Task<double> ValidateDistanceAsync(double distanceKm, Coordinate start, Coordinate finish)
    {
        if (distanceKm <= 0)
            throw new RpcException(new Status(
                StatusCode.InvalidArgument,
                $"INVALID_DISTANCE: debe ser mayor a 0"
            ));
        double realDistance = await _distanceService.CalculateDistanceKmAsync(start, finish);

        if (distanceKm < realDistance)
            throw new RpcException(new Status(
                StatusCode.InvalidArgument,
                $"INVALID_DISTANCE: la distancia {distanceKm} debe ser mayor a {realDistance}"
            ));
        return distanceKm;
    }
}