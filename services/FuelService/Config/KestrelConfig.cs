using Microsoft.AspNetCore.Server.Kestrel.Core;

namespace FuelService.Config;

public static class KestrelConfig
{
    public static void ConfigureKestrelPorts(this ConfigureWebHostBuilder webHostBuilder, int http1Port)
    {
        webHostBuilder.ConfigureKestrel(options =>
        {
            options.ListenAnyIP(http1Port, listenOptions =>
            {
                listenOptions.Protocols = HttpProtocols.Http1;
            });
        });
    }
}