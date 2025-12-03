using FuelService.Data.Databases;
using FuelService.Data.Repository;
using FuelService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FuelService.Config;

public static class DatabaseConfig
{
    public static IServiceCollection AddDatabase(this IServiceCollection services, string connectionString)
    {
        services.AddDbContext<AppDatabase>(options =>
            options.UseNpgsql(connectionString)
        );

        services.AddScoped<IRepository<FuelRegister, Guid>, Repository<FuelRegister, Guid>>();

        return services;
    }
}
