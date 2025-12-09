//
using VehicleService = VehiclesService.Proto.VehiclesService.VehiclesServiceClient;
using DriverService = ChoferService.Proto.DriversService.DriversServiceClient;
using RouteService.Clients;
using RouteService.Config;
using RouteService.Services;
using Steeltoe.Discovery.Eureka;
using Serilog;
using Serilog.Events;
using RouteService.Infraestructure.Distance;
using RabbitMQ.Client;
using RouteService.Queue.Publishers;
using RouteService.Data.Databases;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Cargar variables de entorno
DotNetEnv.Env.Load();

var CONNECTION_STRING = Environment.GetEnvironmentVariable("CONNECTION_STRING")!;
var JWT_SECRET = Environment.GetEnvironmentVariable("JWT_SECRET")!;
var JWT_TIME= double.Parse(Environment.GetEnvironmentVariable("JWT_TIME") ?? "2");
var JWT_ISSUER = Environment.GetEnvironmentVariable("JWT_ISSUER")!;
var HTTP1 = int.Parse(Environment.GetEnvironmentVariable("HTTP1_PORT")!);
var HTTP2 = int.Parse(Environment.GetEnvironmentVariable("HTTP2_PORT")!);
var RABBITMQ_HOST = Environment.GetEnvironmentVariable("RABBITMQ_HOST") ?? "localhost";
var RABBITMQ_PORT = int.Parse(Environment.GetEnvironmentVariable("RABBITMQ_PORT") ?? "5672");
var RABBITMQ_USER = Environment.GetEnvironmentVariable("RABBITMQ_USER") ?? "guest";
var RABBITMQ_PASSWORD = Environment.GetEnvironmentVariable("RABBITMQ_PASSWORD") ?? "guest";

var SEQ_URL = Environment.GetEnvironmentVariable("SEQ_URL") ?? "http://localhost:5341";
// Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .MinimumLevel.Override("Grpc", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.Seq(SEQ_URL)
    .CreateLogger();

// Reemplaza logging nativo por Serilog
builder.Host.UseSerilog(Log.Logger);

// Configuración de Kestrel
builder.WebHost.ConfigureKestrelPorts(HTTP1, HTTP2);

// --------- SERVICIOS DE LA APLICACIÓN ---------
builder.Services
    .AddDatabase(CONNECTION_STRING)
    .AddEurekaDiscoveryClient()
    .AddJwtAuth(JWT_SECRET, JWT_TIME, JWT_ISSUER)
    .AddGrpc()
    .AddJsonTranscoding();
builder.Services.AddLazyGrpcClient<VehicleService, VehicleClient>("vehicle-service");
builder.Services.AddLazyGrpcClient<DriverService, DriverClient>("driver-service");

builder.Services.AddScoped<IDistanceService, PostgisDistanceService>();
builder.Services.AddScoped<DistanceValidator>();
//
builder.Services.AddSingleton<ConnectionFactory>(sp =>
    new ConnectionFactory
    {
        HostName = RABBITMQ_HOST,
        Port = RABBITMQ_PORT,
        UserName = RABBITMQ_USER,
        Password = RABBITMQ_PASSWORD,
    });

builder.Services.AddSingleton<IRouteEventPublisher>(sp =>
{
    var factory = sp.GetRequiredService<ConnectionFactory>();
    return new RabbitRouteEventPublisher(factory, exchangeName: "fuel_events");
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDatabase>();
    await db.Database.MigrateAsync();
}

app.UseAuthentication();
app.UseAuthorization();

// Logs de request HTTP (muy útil para depurar API Gateway)
app.UseSerilogRequestLogging();

// Mapear gRPC
app.MapGrpcService<RoutesService>();

app.Run();

