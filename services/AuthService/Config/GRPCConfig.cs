using AuthService.Services;

namespace AuthService.Config;

public static class GRPCConfig
{
    public static IServiceCollection AddGrpcServices(this IServiceCollection services)
    {
        services.AddGrpc().AddJsonTranscoding();
        services.AddScoped<UserService>();

        return services;
    }
}