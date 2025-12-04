using FuelService.Config;
using FuelService.Data.Databases;
using FuelService.Data.Repository;
using FuelService.Services;
using FuelService.Queue.Consumer;
using FuelService.Domain.UseCases;
using FuelService.Domain.Events;
using Steeltoe.Discovery.Eureka;
using Serilog;
using Serilog.Events;
using Microsoft.AspNetCore.Authorization;
using Grpc.HealthCheck;
using Grpc.Health.V1;
using Microsoft.EntityFrameworkCore;

// Cargar variables de entorno
DotNetEnv.Env.Load();

// ====== Configuración de Serilog ======
var serviceName = Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "FUEL-SERVICE";
var seqUrl = Environment.GetEnvironmentVariable("SEQ_URL") ?? "http://localhost:5341";

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .MinimumLevel.Override("Grpc", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("ServiceName", serviceName)
    .Enrich.WithThreadId()
    .WriteTo.Console()
    .WriteTo.Seq(seqUrl)
    .CreateLogger();

Log.Information("🚀 Iniciando FuelService... enviando logs a {SeqUrl}", seqUrl);

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog();

// ====== Configuración de variables ======
var CONNECTION_STRING = Environment.GetEnvironmentVariable("CONNECTION_STRING") 
    ?? throw new InvalidOperationException("CONNECTION_STRING no configurado");
var JWT_SECRET = Environment.GetEnvironmentVariable("JWT_SECRET") 
    ?? throw new InvalidOperationException("JWT_SECRET no configurado");
var JWT_ISSUER = Environment.GetEnvironmentVariable("JWT_ISSUER") 
    ?? throw new InvalidOperationException("JWT_ISSUER no configurado");
var HTTP1_PORT = int.Parse(Environment.GetEnvironmentVariable("HTTP1_PORT") ?? "5126");
var HTTP2_PORT = int.Parse(Environment.GetEnvironmentVariable("HTTP2_PORT") ?? "5127");
var JWT_TIME = double.Parse(Environment.GetEnvironmentVariable("JWT_TIME") ?? "2");
var RABBITMQ_HOST = Environment.GetEnvironmentVariable("RABBITMQ_HOST") ?? "localhost";
var RABBITMQ_PORT = int.Parse(Environment.GetEnvironmentVariable("RABBITMQ_PORT") ?? "5672");

// ====== Configuración de Kestrel ======
builder.WebHost.ConfigureKestrelPorts(HTTP1_PORT, HTTP2_PORT);

// ====== Servicios ======
builder.Services
    .AddDatabase(CONNECTION_STRING)
    .AddEurekaDiscoveryClient()
    .AddJwtAuth(JWT_SECRET, JWT_TIME, JWT_ISSUER)
    .AddGrpc();

builder.Services.AddSingleton<HealthServiceImpl>();
builder.Services.AddHttpContextAccessor();

// ====== RabbitMQ Consumer para consumo de combustible ======
builder.Services.AddScoped<RegisterFuelConsumptionAction>();
builder.Services.AddHostedService(provider =>
{
    var action = provider.CreateScope().ServiceProvider.GetRequiredService<RegisterFuelConsumptionAction>();
    return new EventConsumer<FuelConsumptionMessage>(
        RABBITMQ_HOST,
        RABBITMQ_PORT,
        "fuel.consumption.queue", // Queue name
        "fuel.events", // Exchange/Topic name
        action
    );
});

// ====== Health Check ======
var app = builder.Build();

// ====== Migración automática ======
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDatabase>();
    try
    {
        // EnsureCreated crea la base de datos si no existe, pero no aplica migraciones
        // Migrate() crea la base de datos si no existe Y aplica todas las migraciones pendientes
        db.Database.Migrate();
        Log.Information("📦 Base de datos migrada correctamente.");
    }
    catch (Exception ex)
    {
        Log.Error(ex, "❌ Error al migrar la base de datos.");
        throw; // Re-lanzar para que el servicio no inicie con DB incorrecta
    }
}

// ====== Middleware ======
app.UseAuthentication();
app.UseAuthorization();

// ====== Health Check ======
var health = app.Services.GetRequiredService<HealthServiceImpl>();
health.SetStatus("", HealthCheckResponse.Types.ServingStatus.Serving);
health.SetStatus("fuel.v1.FuelService", HealthCheckResponse.Types.ServingStatus.Serving);

// ====== Endpoints gRPC ======
app.MapGrpcService<FuelReportsService>();
app.MapGrpcService<HealthServiceImpl>();

// Reflection service se habilita automáticamente en desarrollo si está configurado

app.MapGet("/", [AllowAnonymous] () => "FuelService gRPC up");
app.MapGet("/healthz", [AllowAnonymous] () => "ok");

try
{
    Log.Information("✅ FuelService iniciado correctamente en puerto HTTP1={Http1Port}, HTTP2={Http2Port}", HTTP1_PORT, HTTP2_PORT);
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "❌ FuelService no pudo iniciarse correctamente.");
}
finally
{
    Log.CloseAndFlush();
}
