using AuthService.Config;
using AuthService.Services;
using AuthService.Clients;
using Steeltoe.Discovery.Eureka;
using ChoferService.Proto;
using Serilog;
using Serilog.Events;

DotNetEnv.Env.Load();

var JWT_SECRET = Environment.GetEnvironmentVariable("JWT_SECRET")!;
var JWT_TIME = double.Parse(Environment.GetEnvironmentVariable("JWT_TIME")!);
var JWT_ISSUER = Environment.GetEnvironmentVariable("JWT_ISSUER")!;
var CONNECTION_STRING = Environment.GetEnvironmentVariable("CONNECTION_STRING")!;
var HTTP1_PORT = int.Parse(Environment.GetEnvironmentVariable("HTTP1_PORT")!);
var HTTP2_PORT = int.Parse(Environment.GetEnvironmentVariable("HTTP2_PORT")!);
var SEQ_URL = Environment.GetEnvironmentVariable("SEQ_URL") ?? "http://localhost:5341";

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .MinimumLevel.Override("Grpc", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.Seq(SEQ_URL)
    .CreateLogger();


var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog(Log.Logger);

builder.WebHost.ConfigureKestrelPorts(HTTP1_PORT, HTTP2_PORT);
builder.Services
    .AddGrpcServices()
    .AddDatabase(CONNECTION_STRING)
    .AddJwtAuth(JWT_SECRET, JWT_TIME, JWT_ISSUER)
    .AddAuthorization();
builder.Services.AddEurekaDiscoveryClient();

// ====== Cliente gRPC descubierto ======
builder.Services.AddLazyGrpcClient<DriversService.DriversServiceClient, DriverClient>("driver-service");

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