using System.Text;
using AuthService.Data.Databases;
using AuthService.Data.Repository;
using AuthService.Domain;
using AuthService.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
DotNetEnv.Env.Load();
var JWT_SECRET = Environment.GetEnvironmentVariable("JWT_SECRET")!;
var JWT_TIME = double.Parse(Environment.GetEnvironmentVariable("JWT_TIME")!);
var CONNECTION_STRING = Environment.GetEnvironmentVariable("CONNECTION_STRING")!;
var LOCAL_IP = Environment.GetEnvironmentVariable("LOCAL_IP")!;
builder.Services.AddGrpc().AddJsonTranscoding();
builder.Services.AddDbContext<AppDatabase>(options => options.UseNpgsql(CONNECTION_STRING));
builder.Services.AddScoped<IRepository<User, Guid>, Repository<User, Guid>>();
builder.Services.AddScoped<JWTAuthService>(sp =>
{
    var repo = sp.GetRequiredService<IRepository<User, Guid>>();
    return new JWTAuthService(JWT_SECRET, JWT_TIME, repo, LOCAL_IP);
});
builder.Services.AddScoped<UserService>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
.AddJwtBearer((options) =>
{
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateAudience = true,
        ValidateIssuer = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = LOCAL_IP,
        ValidAudience = LOCAL_IP,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JWT_SECRET))
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();

// Configure the HTTP request pipeline.
app.MapGrpcService<JWTAuthService>();
app.MapGrpcService<UserService>();
app.MapGet("/", () => "Communication with gRPC endpoints must be made through a gRPC client. To learn how to create a client, visit: https://go.microsoft.com/fwlink/?linkid=2086909");

app.Run();
