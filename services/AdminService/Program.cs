// using AdminService.Services;
using AdminService.Clients;
using AdminService.Configs;
using AdminService.Services.Admin;
using ChoferService.Proto;
using Steeltoe.Discovery.Eureka;
using UserServices;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
DotNetEnv.Env.Load();
var IP_USER_SERVICE = Environment.GetEnvironmentVariable("IP_USER_SERVICE")!;
var IP_DRIVER_SERVICE = Environment.GetEnvironmentVariable("IP_DRIVER_SERVICE")!;
var AUTH_AUTHORITY = Environment.GetEnvironmentVariable("AUTH_AUTHORITY")!;
var HTTP1_PORT = int.Parse(Environment.GetEnvironmentVariable("HTTP1_PORT")!);
var HTTP2_PORT = int.Parse(Environment.GetEnvironmentVariable("HTTP2_PORT")!);

builder.Services.AddEurekaDiscoveryClient();
builder.Services
    .AddGrpcClientDiscovered<UserProtoService.UserProtoServiceClient, UserClient>("auth-service")
    .AddGrpcClientDiscovered<DriversService.DriversServiceClient, DriverClient>("driver-service")
    .AddJwtAuthentication(AUTH_AUTHORITY)
    .AddAuthorization();

builder.WebHost.ConfigureKestrelPorts(HTTP1_PORT, HTTP2_PORT);

var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();

// Configure the HTTP request pipeline.
app.MapGrpcService<UserService>();
app.MapGet("/", () => "Communication with gRPC endpoints must be made through a gRPC client. To learn how to create a client, visit: https://go.microsoft.com/fwlink/?linkid=2086909");

app.Run();
