
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

DotNetEnv.Env.Load();
// ---------- Grpc & Health ----------
builder.Services.AddGrpc();
builder.Services.AddGrpcReflection();
builder.Services.AddSingleton<HealthServiceImpl>();

// -- Variables de entorno (POR AMOR DE DIOS USENLAS. NO PONGAN TODO EN APPSETTINGS. TODOS LO VEN)
var CONNECTION_STRING = Environment.GetEnvironmentVariable("CONNECTION_STRING")!;
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? builder.Configuration["Jwt:Secret"];
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? builder.Configuration["Jwt:Issuer"];
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? builder.Configuration["Jwt:Audience"];

// ---------- DB ----------
builder.Services.AddDbContext<DriversDb>(options =>
    options.UseNpgsql(CONNECTION_STRING));

// ---------- JWT CONFIG (HS256) ----------

if (string.IsNullOrWhiteSpace(jwtSecret))
    throw new InvalidOperationException("JWT secret no configurado. Define Jwt:Secret en appsettings.json o JWT_SECRET en variables de entorno.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false; // dev
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),

            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,

            ValidateAudience = true,
            ValidAudience = jwtAudience,

            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
        };

        // Asegura que tome el token desde Authorization en HTTP/2 (gRPC)
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var auth = context.Request.Headers["Authorization"].FirstOrDefault()
                           ?? context.Request.Headers["authorization"].FirstOrDefault();

                if (!string.IsNullOrWhiteSpace(auth))
                {
                    if (auth.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                        context.Token = auth.Substring("Bearer ".Length).Trim();
                    else
                        context.Token = auth.Trim();
                }
                return Task.CompletedTask;
            }
        };
    });

// ---------- Autorización (políticas por scope) ----------
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("DriversCreate", policy =>
        policy.RequireAssertion(ctx =>
            ctx.User.HasClaim(c => c.Type == "scope" && c.Value.Contains("drivers:create"))));

    options.AddPolicy("DriversReadAll", policy =>
        policy.RequireAssertion(ctx =>
            ctx.User.HasClaim(c => c.Type == "scope" && c.Value.Contains("drivers:read:all"))));

    options.AddPolicy("DriversReadOwn", policy =>
        policy.RequireAssertion(ctx =>
            ctx.User.HasClaim(c => c.Type == "scope" && c.Value.Contains("drivers:read:own"))));

    options.AddPolicy("DriversUpdateAny", policy =>
        policy.RequireAssertion(ctx =>
            ctx.User.HasClaim(c => c.Type == "scope" && c.Value.Contains("drivers:update:any"))));
});
var app = builder.Build();

// ---------- Seed ----------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DriversDb>();
    await DriversSeeder.SeedAsync(db);
}

// ---------- Pipeline ----------
// ⛔️ Quita el middleware custom de JWT para evitar segunda validación con otra Authority/llave
// app.UseMiddleware<GrpcJwtMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

// ---------- Health ----------
var health = app.Services.GetRequiredService<Grpc.HealthCheck.HealthServiceImpl>();
health.SetStatus("", HealthCheckResponse.Types.ServingStatus.Serving);
health.SetStatus("drivers.v1.DriversService", HealthCheckResponse.Types.ServingStatus.Serving);

// ---------- gRPC Services ----------
app.MapGrpcService<DriversGrpc>()
   .RequireAuthorization(); // o .RequireAuthorization("DriversReadOwn") si quieres forzar ese scope a todo

app.MapGrpcService<Grpc.HealthCheck.HealthServiceImpl>();

// ---------- Reflection (solo dev) ----------
if (app.Environment.IsDevelopment())
{
    app.MapGrpcReflectionService();
}

// ---------- Endpoints HTTP ----------
app.MapGet("/", () => "ChoferService gRPC");
app.MapGet("/healthz", () => "ok");
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
});

app.Run();
