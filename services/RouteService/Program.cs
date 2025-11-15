//
using VehicleService = VehiclesService.Proto.VehiclesService.VehiclesServiceClient;
using DriverService = ChoferService.Proto.DriversService.DriversServiceClient;
using RouteService.Clients;
using RouteService.Config;
using RouteService.Services;
using Steeltoe.Discovery.Eureka;
using Serilog;
using Serilog.Events;

var builder = WebApplication.CreateBuilder(args);

// Cargar variables de entorno
DotNetEnv.Env.Load();

var CONNECTION_STRING = Environment.GetEnvironmentVariable("CONNECTION_STRING")!;
var JWT_SECRET = Environment.GetEnvironmentVariable("JWT_SECRET")!;
var JWT_ISSUER = Environment.GetEnvironmentVariable("JWT_ISSUER")!;
var HTTP1 = int.Parse(Environment.GetEnvironmentVariable("HTTP1_PORT")!);
var HTTP2 = int.Parse(Environment.GetEnvironmentVariable("HTTP2_PORT")!);
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
    .AddJwtAuth(JWT_SECRET, 2, JWT_ISSUER)
    .AddGrpc()
    .AddJsonTranscoding();

builder.Services.AddLazyGrpcClient<VehicleService, VehicleClient>("vehicle-service");
builder.Services.AddLazyGrpcClient<DriverService, DriverClient>("driver-service");

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

// Logs de request HTTP (muy útil para depurar API Gateway)
app.UseSerilogRequestLogging();

// Mapear gRPC
app.MapGrpcService<RoutesService>();

app.Run();

