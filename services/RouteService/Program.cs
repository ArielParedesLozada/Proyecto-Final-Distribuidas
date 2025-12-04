//
using VehicleService = VehiclesService.Proto.VehiclesService.VehiclesServiceClient;
using DriverService = ChoferService.Proto.DriversService.DriversServiceClient;
using RouteService.Clients;
using RouteService.Config;
using RouteService.Services;
using RouteService.Queue.Publisher;
using Steeltoe.Discovery.Eureka;
using Serilog;
using Serilog.Events;
using RouteService.Infraestructure.Distance;

var builder = WebApplication.CreateBuilder(args);

// Cargar variables de entorno
DotNetEnv.Env.Load();

var CONNECTION_STRING = Environment.GetEnvironmentVariable("CONNECTION_STRING")!;
var JWT_SECRET = Environment.GetEnvironmentVariable("JWT_SECRET")!;
var JWT_ISSUER = Environment.GetEnvironmentVariable("JWT_ISSUER")!;
var HTTP1 = int.Parse(Environment.GetEnvironmentVariable("HTTP1_PORT")!);
var HTTP2 = int.Parse(Environment.GetEnvironmentVariable("HTTP2_PORT")!);
var SEQ_URL = Environment.GetEnvironmentVariable("SEQ_URL") ?? "http://localhost:5341";
var RABBITMQ_HOST = Environment.GetEnvironmentVariable("RABBITMQ_HOST") ?? "localhost";
var RABBITMQ_PORT = int.Parse(Environment.GetEnvironmentVariable("RABBITMQ_PORT") ?? "5672");
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
    .AddJwtAuth(JWT_SECRET, 2, JWT_ISSUER)
    .AddGrpc()
    .AddJsonTranscoding();
builder.Services.AddLazyGrpcClient<VehicleService, VehicleClient>("vehicle-service");
builder.Services.AddLazyGrpcClient<DriverService, DriverClient>("driver-service");

// RabbitMQ Publisher para FuelService
builder.Services.AddSingleton<FuelConsumptionPublisher>(sp =>
    new FuelConsumptionPublisher(
        RABBITMQ_HOST,
        RABBITMQ_PORT,
        "fuel.events", // Exchange
        "fuel.consumption.registered" // Routing key
    ));

// FuelClient ahora usa RabbitMQ en lugar de gRPC
builder.Services.AddScoped<FuelClient>(sp =>
{
    var publisher = sp.GetRequiredService<FuelConsumptionPublisher>();
    return new FuelClient(publisher);
});

builder.Services.AddScoped<IDistanceService, PostgisDistanceService>();
builder.Services.AddScoped<DistanceValidator>();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

// Logs de request HTTP (muy útil para depurar API Gateway)
app.UseSerilogRequestLogging();

// Mapear gRPC
app.MapGrpcService<RoutesService>();

app.Run();

