// using System.Text;
using AuthService.Config;
using AuthService.Services;
using AuthService.Clients;
using Steeltoe.Discovery.Eureka;
using ChoferService.Proto;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
DotNetEnv.Env.Load();
var JWT_SECRET = Environment.GetEnvironmentVariable("JWT_SECRET")!;
var JWT_TIME = double.Parse(Environment.GetEnvironmentVariable("JWT_TIME")!);
var JWT_ISSUER = Environment.GetEnvironmentVariable("JWT_ISSUER")!;
var CONNECTION_STRING = Environment.GetEnvironmentVariable("CONNECTION_STRING")!;
var HTTP1_PORT = int.Parse(Environment.GetEnvironmentVariable("HTTP1_PORT")!);
var HTTP2_PORT = int.Parse(Environment.GetEnvironmentVariable("HTTP2_PORT")!);

builder.WebHost.ConfigureKestrelPorts(HTTP1_PORT, HTTP2_PORT);
builder.Services
    .AddGrpcServices()
    .AddDatabase(CONNECTION_STRING)
    .AddJwtAuth(JWT_SECRET, JWT_TIME, JWT_ISSUER)
    .AddAuthorization();
builder.Services.AddEurekaDiscoveryClient();
// ====== Cliente gRPC para ChoferService ======
builder.Services.AddGrpcClientDiscovered<DriversService.DriversServiceClient, DriverClient>("driver-service");

var app = builder.Build();

// ====== Seed Database ======
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AuthService.Data.Databases.AppDatabase>();
    await AuthService.Data.Seed.UserSeeder.SeedAsync(db);
}

app.UseAuthentication();
app.UseAuthorization();

// Configure the HTTP request pipeline.
app.MapGrpcService<JWTAuthService>();
app.MapGrpcService<UserService>();
app.MapGet("/", () => "Communication with gRPC endpoints must be made through a gRPC client. To learn how to create a client, visit: https://go.microsoft.com/fwlink/?linkid=2086909");

app.Run();
