using AuthService.Config;
using AuthService.Services;
using AuthService.Clients;
using Steeltoe.Discovery.Eureka;
using ChoferService.Proto;
using Serilog;
using Serilog.Events;

// ====== 1️⃣ Cargar variables de entorno antes de construir el host ======
DotNetEnv.Env.Load();

// ====== 2️⃣ Configurar Serilog global ======
var serviceName = Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "AuthService";
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

    // ====== Variables de entorno ======
    var JWT_SECRET = Environment.GetEnvironmentVariable("JWT_SECRET")!;
    var JWT_TIME = double.Parse(Environment.GetEnvironmentVariable("JWT_TIME")!);
    var JWT_ISSUER = Environment.GetEnvironmentVariable("JWT_ISSUER")!;
    var CONNECTION_STRING = Environment.GetEnvironmentVariable("CONNECTION_STRING")!;
    var HTTP1_PORT = int.Parse(Environment.GetEnvironmentVariable("HTTP1_PORT")!);
    var HTTP2_PORT = int.Parse(Environment.GetEnvironmentVariable("HTTP2_PORT")!);

    // ====== Configurar Kestrel y dependencias ======
    builder.WebHost.ConfigureKestrelPorts(HTTP1_PORT, HTTP2_PORT);
    builder.Services
        .AddGrpcServices()
        .AddDatabase(CONNECTION_STRING)
        .AddJwtAuth(JWT_SECRET, JWT_TIME, JWT_ISSUER)
        .AddAuthorization();
    builder.Services.AddEurekaDiscoveryClient();

    // ====== Cliente gRPC descubierto ======
    builder.Services.AddGrpcClientDiscovered<DriversService.DriversServiceClient, DriverClient>("driver-service");

    var app = builder.Build();

    // ====== Seed Database ======
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AuthService.Data.Databases.AppDatabase>();
        await AuthService.Data.Seed.UserSeeder.SeedAsync(db);
    }

    // ====== Middleware ======
    app.UseAuthentication();
    app.UseAuthorization();

    // ====== Endpoints gRPC ======
    app.MapGrpcService<JWTAuthService>();
    app.MapGrpcService<UserService>();
    app.MapGet("/", () =>
        "Communication with gRPC endpoints must be made through a gRPC client. See: https://go.microsoft.com/fwlink/?linkid=2086909");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "❌ {ServiceName} terminated unexpectedly", Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "AuthService");
}
finally
{
    Log.Information("🧹 Shutting down {ServiceName}", Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "AuthService");
    Log.CloseAndFlush();
}
