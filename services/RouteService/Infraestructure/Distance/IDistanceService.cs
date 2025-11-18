using RouteService.Domain;

namespace RouteService.Infraestructure.Distance;

public interface IDistanceService
{
    public Task<double> CalculateDistanceKmAsync(Coordinate start, Coordinate finish);
}