using AdminService.Clients;
using AdminService.Configs;
using AdminService.Services.Admin;
using ChoferService.Proto;
using Steeltoe.Discovery.Eureka;
using UserServices;
using Serilog;
using Serilog.Events;

// ====== 1️⃣ Cargar variables de entorno antes del builder ======
DotNetEnv.Env.Load();

// ====== 2️⃣ Configurar Serilog global ======
var serviceName = Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "ADMIN-SERVICE";
var seqUrl = Environment.GetEnvironmentVariable("SEQ_URL") ?? "http://localhost:5341";

Log.Logger = new LoggerConfiguration()
    .Enrich.WithProperty("ServiceName", serviceName)
    .Enrich.WithEnvironmentName()
    .Enrich.WithThreadId()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Information()
    .WriteTo.Console()
    .WriteTo.Seq(seqUrl)
    .CreateLogger();

try
{
    Log.Information("🚀 Starting {ServiceName}", serviceName);

    var builder = WebApplication.CreateBuilder(args);

    // ====== 3️⃣ Integrar Serilog al host ======
    builder.Host.UseSerilog();

    // ====== 4️⃣ Cargar variables de entorno ======
    var IP_USER_SERVICE = Environment.GetEnvironmentVariable("IP_USER_SERVICE")!;
    var IP_DRIVER_SERVICE = Environment.GetEnvironmentVariable("IP_DRIVER_SERVICE")!;
    var AUTH_AUTHORITY = Environment.GetEnvironmentVariable("AUTH_AUTHORITY")!;
    var HTTP1_PORT = int.Parse(Environment.GetEnvironmentVariable("HTTP1_PORT")!);
    var HTTP2_PORT = int.Parse(Environment.GetEnvironmentVariable("HTTP2_PORT")!);

    // ====== 5️⃣ Registrar dependencias ======
    builder.Services.AddEurekaDiscoveryClient();
    builder.Services
        .AddGrpcClientDiscovered<UserProtoService.UserProtoServiceClient, UserClient>("auth-service")
        .AddGrpcClientDiscovered<DriversService.DriversServiceClient, DriverClient>("driver-service")
        .AddJwtAuthentication(AUTH_AUTHORITY)
        .AddAuthorization();

    builder.WebHost.ConfigureKestrelPorts(HTTP1_PORT, HTTP2_PORT);

    var app = builder.Build();

    // ====== 6️⃣ Middlewares ======
    app.UseAuthentication();
    app.UseAuthorization();

    // ====== 7️⃣ Endpoints ======
    app.MapGrpcService<UserService>();
    app.MapGet("/", () =>
        "Communication with gRPC endpoints must be made through a gRPC client. Visit: https://go.microsoft.com/fwlink/?linkid=2086909");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "❌ {ServiceName} terminated unexpectedly", Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "AdminService");
}
finally
{
    Log.Information("🧹 Shutting down {ServiceName}", Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "AdminService");
    Log.CloseAndFlush();
}
