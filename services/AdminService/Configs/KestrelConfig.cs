using Microsoft.AspNetCore.Server.Kestrel.Core;

namespace AdminService.Configs;

public static class KestrelConfig
{
    public static void ConfigureKestrelPorts(this ConfigureWebHostBuilder webHostBuilder, int http1Port, int http2Port)
    {
        webHostBuilder.ConfigureKestrel(options =>
        {
            options.ListenLocalhost(http1Port, listenOptions =>
            {
                listenOptions.Protocols = HttpProtocols.Http1;
            });
            options.ListenLocalhost(http2Port, listenOptions =>
            {
                listenOptions.Protocols = HttpProtocols.Http2;
            });
        });
    }
}