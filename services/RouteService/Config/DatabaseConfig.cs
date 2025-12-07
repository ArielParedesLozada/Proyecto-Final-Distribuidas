using Microsoft.EntityFrameworkCore;
using RouteService.Data.Databases;
using RouteService.Data.Repository;
using RouteObservationDomain = RouteService.Domain.RouteObservation;
using RouteService.Infraestructure.Coordinates;
using RouteDomain = RouteService.Domain.Route;

namespace RouteService.Config;

public static class DatabaseConfig
{
    public static IServiceCollection AddDatabase(this IServiceCollection services, string connectionString)
    {
        services.AddDbContext<AppDatabase>(options =>
            options.UseNpgsql(
                connectionString,
                npgsqlOptions => npgsqlOptions.UseNetTopologySuite()
            )
        );

        services.AddSingleton<CoordinatesConverterFactory>();

        services.AddScoped<IRepository<RouteDomain, Guid>, Repository<RouteDomain, Guid>>();
        services.AddScoped<IRepository<RouteObservationDomain, Guid>, Repository<RouteObservationDomain, Guid>>();

        return services;
    }
}
