using Grpc.Core.Interceptors;
using Grpc.Net.Client;
using Microsoft.Extensions.DependencyInjection;
using Steeltoe.Common.Discovery;

namespace VehicleService.Configs;

public static class GrpcConfig
{
    public static IHttpClientBuilder AddGrpcClientDiscovered<TGrpcClient, TScopedClient>(
        this IServiceCollection services,
        string serviceName)
        where TGrpcClient : class
        where TScopedClient : class
    {
        services.AddGrpc();

        var clientBuilder = services.AddGrpcClient<TGrpcClient>((sp, options) =>
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
            System.Console.WriteLine($"PORT {usablePort}");
            options.Address = grpcUri;
        });

        services.AddScoped<TScopedClient>();
        return clientBuilder;
    }
    public static IHttpClientBuilder AddLazyGrpcClient<TGrpcClient, TScopedClient>(
        this IServiceCollection services,
        string serviceName)
        where TGrpcClient : class
        where TScopedClient : class
    {
        services.AddGrpc();

        var httpClientBuilder = services.AddHttpClient(typeof(TGrpcClient).Name);

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

                // Cliente base
                var baseClient =
                    (TGrpcClient)Activator.CreateInstance(typeof(TGrpcClient), channel)!;

                // Interceptor manual (aquí se aplica)
                var interceptor = provider.GetService<Interceptor>();

                if (interceptor != null)
                {
                    var invoker = channel.Intercept(interceptor);
                    return (TGrpcClient)Activator.CreateInstance(typeof(TGrpcClient), invoker)!;
                }

                return baseClient;
            });
        });

        services.AddScoped<TScopedClient>();

        return httpClientBuilder;
    }
}
