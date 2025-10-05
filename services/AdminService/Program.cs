// using AdminService.Services;

using AdminService.Clients;
using AdminService.Services.Admin;
using UserServices;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
DotNetEnv.Env.Load();
var IP_USER_SERVICE = Environment.GetEnvironmentVariable("IP_USER_SERVICE")!;
var AUTH_AUTHORITY = Environment.GetEnvironmentVariable("AUTH_AUTHORITY")!;
builder.Services.AddGrpc().AddJsonTranscoding();
builder.Services.AddGrpcClient<UserProtoService.UserProtoServiceClient>(o =>
{
    o.Address = new Uri(IP_USER_SERVICE);
});
builder.Services.AddScoped<UserClient>();
builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        options.Authority = AUTH_AUTHORITY;
        options.RequireHttpsMetadata = false;
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateAudience = false
        };
    });

builder.Services.AddAuthorization();
var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();

// Configure the HTTP request pipeline.
app.MapGrpcService<UserService>();
app.MapGet("/", () => "Communication with gRPC endpoints must be made through a gRPC client. To learn how to create a client, visit: https://go.microsoft.com/fwlink/?linkid=2086909");

app.Run();
