using Grpc.Net.Client;
using Steeltoe.Common.Discovery;

namespace RouteService.Config;

public static class EurekaClientConfig
{
    public static IServiceCollection AddGrpcClientDiscovered<TGrpcClient, TScopedClient>(
        this IServiceCollection services,
        string serviceName)
        where TGrpcClient : class
        where TScopedClient : class
    {
        services.AddGrpc().AddJsonTranscoding();

        services.AddGrpcClient<TGrpcClient>((sp, options) =>
        {
            var discovery = sp.GetRequiredService<IDiscoveryClient>();
            var instances = discovery.GetInstancesAsync(serviceName, CancellationToken.None).GetAwaiter().GetResult();
            var instance = (instances?.FirstOrDefault()) ?? throw new InvalidOperationException($"No se encontró instancia para '{serviceName}'");
            int usablePort;
            try
            {
                usablePort = int.Parse(instance.Metadata["grpcPort"]!);
            }
            catch (System.Exception)
            {
                usablePort = instance.Port;
            }
            var grpcUri = new UriBuilder(instance.Uri)
            {
                Port = usablePort
            }.Uri;
            options.Address = grpcUri;
        });

        services.AddScoped<TScopedClient>();
        return services;
    }
    public static IServiceCollection AddLazyGrpcClient<TGrpcClient, TScopedClient>(
    this IServiceCollection services,
    string serviceName)
    where TGrpcClient : class
    where TScopedClient : class
    {
        services.AddGrpc();
        services.AddScoped(provider =>
        {
            return new Lazy<TGrpcClient>(() =>
            {
                var discovery = provider.GetRequiredService<IDiscoveryClient>();
                var instances = discovery
                    .GetInstancesAsync(serviceName, CancellationToken.None)
                    .GetAwaiter()
                    .GetResult();

                var instance = instances?.FirstOrDefault()
                    ?? throw new InvalidOperationException(
                        $"No se encontró instancia para '{serviceName}'");

                int usablePort;
                try
                {
                    usablePort = int.Parse(instance.Metadata["grpcPort"]!);
                }
                catch
                {
                    usablePort = instance.Port;
                }

                var grpcUri = new UriBuilder(instance.Uri)
                {
                    Port = usablePort
                }.Uri;

                Console.WriteLine($"[LazyDI] GRPC URI = {grpcUri}");
                var channel = GrpcChannel.ForAddress(grpcUri);
                return (TGrpcClient)Activator.CreateInstance(
                    typeof(TGrpcClient), channel
                )!;
            });
        });
        services.AddScoped<TScopedClient>();
        return services;
    }
}
