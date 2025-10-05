// using AdminService.Services;

using AdminService.Clients;
using AdminService.Services.Admin;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using UserServices;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
DotNetEnv.Env.Load();
var IP_USER_SERVICE = Environment.GetEnvironmentVariable("IP_USER_SERVICE")!;
var AUTH_AUTHORITY = Environment.GetEnvironmentVariable("AUTH_AUTHORITY")!;
var HTTP1_PORT = int.Parse(Environment.GetEnvironmentVariable("HTTP1_PORT")!);
var HTTP2_PORT = int.Parse(Environment.GetEnvironmentVariable("HTTP2_PORT")!);

builder.Services.AddGrpc().AddJsonTranscoding();
builder.Services.AddGrpcClient<UserProtoService.UserProtoServiceClient>(o =>
{
    o.Address = new Uri(IP_USER_SERVICE);
});
builder.Services.AddScoped<UserClient>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = AUTH_AUTHORITY;
        options.RequireHttpsMetadata = false;
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateAudience = false
        };
    });

builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenLocalhost(HTTP1_PORT, listenOptions =>
    {
        listenOptions.Protocols = HttpProtocols.Http1;
    });
    options.ListenLocalhost(HTTP2_PORT, listenOptions =>
    {
        listenOptions.Protocols = HttpProtocols.Http2;
    });
});

builder.Services.AddAuthorization();
var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();

// Configure the HTTP request pipeline.
app.MapGrpcService<UserService>();
app.MapGet("/", () => "Communication with gRPC endpoints must be made through a gRPC client. To learn how to create a client, visit: https://go.microsoft.com/fwlink/?linkid=2086909");

app.Run();
