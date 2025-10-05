using AdminService.Clients;
using UserServices;

namespace AdminService.Configs;

public static class GRPCConfig
{
    public static IServiceCollection AddGrpcWithClients(this IServiceCollection services, string userServiceAddress)
    {
        services.AddGrpc().AddJsonTranscoding();
        services.AddGrpcClient<UserProtoService.UserProtoServiceClient>(o =>
        {
            o.Address = new Uri(userServiceAddress);
        });
        services.AddScoped<UserClient>();

        return services;
    }
}