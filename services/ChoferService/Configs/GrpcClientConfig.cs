namespace ChoferService.Configs;

public static class GRPCConfig
{
    public static IServiceCollection AddGrpcClient<TGrpcClient, TScopedClient>(
                this IServiceCollection services,
                string address)
                where TGrpcClient : class
                where TScopedClient : class
    {
        services.AddGrpcClient<TGrpcClient>(o =>
        {
            o.Address = new Uri(address);
        });

        services.AddScoped<TScopedClient>();

        return services;
    }
}