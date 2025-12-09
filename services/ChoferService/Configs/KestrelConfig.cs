using Microsoft.AspNetCore.Server.Kestrel.Core;

namespace ChoferService.Configs;

public static class KestrelConfig
{
    public static void ConfigureKestrelPorts(this ConfigureWebHostBuilder webHostBuilder, int http2Port)
    {
        webHostBuilder.ConfigureKestrel(options =>
        {
            options.ListenAnyIP(http2Port, listenOptions =>
            {
                listenOptions.Protocols = HttpProtocols.Http2;
            });
        });
    }
}