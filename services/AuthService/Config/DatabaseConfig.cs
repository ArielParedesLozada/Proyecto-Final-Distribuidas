using AuthService.Data.Databases;
using AuthService.Data.Repository;
using AuthService.Domain;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Config;

public static class DatabaseConfig
{
    public static IServiceCollection AddDatabase(this IServiceCollection services, string connectionString)
    {
        services.AddDbContext<AppDatabase>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IRepository<User, Guid>, Repository<User, Guid>>();

        return services;
    }
}