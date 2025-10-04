using ChoferService.Services;
using ChoferService.Data;
using ChoferService.Data.Seed;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Grpc.HealthCheck;
using Grpc.Health.V1;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddGrpc();
builder.Services.AddGrpcReflection();
builder.Services.AddSingleton<Grpc.HealthCheck.HealthServiceImpl>();

// Add DbContext
builder.Services.AddDbContext<DriversDb>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DriversDb")));

// Add Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Jwt:Authority"];
        options.RequireHttpsMetadata = false; // Para desarrollo
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false
        };
    });

// Add Authorization with policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("DriversCreate", policy =>
        policy.RequireClaim("scope", "drivers:create"));
    options.AddPolicy("DriversReadAll", policy =>
        policy.RequireClaim("scope", "drivers:read:all"));
    options.AddPolicy("DriversReadOwn", policy =>
        policy.RequireClaim("scope", "drivers:read:own"));
    options.AddPolicy("DriversUpdateAny", policy =>
        policy.RequireClaim("scope", "drivers:update:any"));
});

var app = builder.Build();

// Seed database if empty
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DriversDb>();
    await DriversSeeder.SeedAsync(db);
}

// Configure the HTTP request pipeline
app.UseAuthentication();
app.UseAuthorization();

// Configure gRPC health check service
var health = app.Services.GetRequiredService<Grpc.HealthCheck.HealthServiceImpl>();
health.SetStatus("", HealthCheckResponse.Types.ServingStatus.Serving);
health.SetStatus("drivers.v1.DriversService", HealthCheckResponse.Types.ServingStatus.Serving);

// Map gRPC services
app.MapGrpcService<DriversGrpc>();
app.MapGrpcService<Grpc.HealthCheck.HealthServiceImpl>();

// Enable gRPC reflection solo en Development
if (app.Environment.IsDevelopment())
{
    app.MapGrpcReflectionService();
}

// Map HTTP endpoints
app.MapGet("/", () => "Communication with gRPC endpoints must be made through a gRPC client. To learn how to create a client, visit: https://go.microsoft.com/fwlink/?linkid=2086909");
app.MapGet("/healthz", () => "ok"); // Liveness probe
app.MapGet("/readyz", async (DriversDb db) =>
{
    try
    {
        var canConnect = await db.Database.CanConnectAsync();
        return canConnect ? Results.Ok("ready") : Results.StatusCode(503);
    }
    catch
    {
        return Results.StatusCode(503);
    }
}); // Readiness probe

app.Run();
