//

using RouteService.Config;
using Steeltoe.Discovery.Eureka;

var builder = WebApplication.CreateBuilder(args);

DotNetEnv.Env.Load();
//Variables de entorno
var CONNECTION_STRING = Environment.GetEnvironmentVariable("CONNECTION_STRING")!;
var JWT_SECRET = Environment.GetEnvironmentVariable("JWT_SECRET")!;
var JWT_ISSUER = Environment.GetEnvironmentVariable("JET_ISSUER")!;
var HTTP1 = int.Parse(Environment.GetEnvironmentVariable("HTTP1_PORT")!);
var HTTP2 = int.Parse(Environment.GetEnvironmentVariable("HTTP2_PORT")!);
// Add services to the container.
builder.WebHost.ConfigureKestrelPorts(HTTP1, HTTP2);
builder.Services.AddDatabase(CONNECTION_STRING)
    .AddEurekaDiscoveryClient()
    .AddJwtAuth(JWT_SECRET, 2, JWT_ISSUER)
    .AddAuthorization();

// builder.Services.AddGrpcClientDiscovered<>("driver-service");
// builder.Services.AddGrpcClientDiscovered<>("vehicle-service");
var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();
// Configure the HTTP request pipeline.
// app.MapGrpcService<GreeterService>();
app.MapGet("/", () => "Communication with gRPC endpoints must be made through a gRPC client. To learn how to create a client, visit: https://go.microsoft.com/fwlink/?linkid=2086909");

app.Run();
