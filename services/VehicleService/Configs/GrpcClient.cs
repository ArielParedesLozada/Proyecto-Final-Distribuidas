namespace VehicleService.Configs;


public static class GRPCConfig
{
    public static IHttpClientBuilder AddGrpcCustomClient<TGrpcClient, TScopedClient>(
        this IServiceCollection services,
        string address)
        where TGrpcClient : class
        where TScopedClient : class
    {
        // Devuelve el IHttpClientBuilder del cliente gRPC
        var clientBuilder = services.AddGrpcClient<TGrpcClient>(o =>
        {
            o.Address = new Uri(address);
        });

        // Agregas tu scoped client normal
        services.AddScoped<TScopedClient>();

        // Retornas el builder para poder encadenar .AddInterceptor()
        return clientBuilder;
    }
}