using Microsoft.Extensions.DependencyInjection;
using Steeltoe.Common.Discovery;
using System;
using System.Linq;

namespace AdminService.Configs;

public static class GrpcConfig
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
            int usablePort = 6666;
            try
            {
                usablePort = int.Parse(instance.Metadata["grpcPort"]!);
            }
            catch (System.Exception)
            {
                var http2Port = instance.Port;
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
}
