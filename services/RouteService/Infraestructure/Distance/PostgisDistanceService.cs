using Microsoft.EntityFrameworkCore;
using RouteService.Data.Databases;
using RouteService.Domain;
namespace RouteService.Infraestructure.Distance;

public class PostgisDistanceService : IDistanceService
{
    private readonly AppDatabase _db;

    public PostgisDistanceService(AppDatabase db)
    {
        _db = db;
    }

    public async Task<double> CalculateDistanceKmAsync(Coordinate start, Coordinate finish)
    {
        var sql = @"
            SELECT ST_DistanceSphere(
                        ST_SetSRID(ST_MakePoint({0}, {1}), 4326),
                        ST_SetSRID(ST_MakePoint({2}, {3}), 4326)
                   ) / 1000 AS distanceKm;
        ";

        var distanceKm = await _db.Database
            .SqlQueryRaw<double>(sql,
                start.Longitude,
                start.Latitude,
                finish.Longitude,
                finish.Latitude)
            .FirstAsync();

        return distanceKm;
    }
}