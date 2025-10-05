using ChoferService.Services;
using ChoferService.Data;
using ChoferService.Data.Seed;
// using ChoferService.Middleware; // ⛔️ dejado fuera para evitar doble validación
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Grpc.HealthCheck;
using Grpc.Health.V1;
using Microsoft.AspNetCore.Authentication;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

var builder = WebApplication.CreateBuilder(args);

// Mantener los claim types "crudos" (p.ej. 'sub' como 'sub')
JwtSecurityTokenHandler.DefaultMapInboundClaims = false;

// ---------- gRPC & Health ----------
builder.Services.AddGrpc();
builder.Services.AddGrpcReflection();
builder.Services.AddSingleton<Grpc.HealthCheck.HealthServiceImpl>();

// ---------- DB ----------
builder.Services.AddDbContext<DriversDb>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DriversDb")));

// ---------- JWT CONFIG (HS256) ----------
var jwtSecret   = builder.Configuration["Jwt:Secret"]   ?? Environment.GetEnvironmentVariable("JWT_SECRET");
var jwtIssuer   = builder.Configuration["Jwt:Issuer"]   ?? "http://localhost:5121";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "http://localhost:5121";

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

        // Leer el token desde Authorization (metadata) en gRPC
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
            },

            // 🔑 Expandir "scope" en claims individuales (soporta espacios o comas)
            OnTokenValidated = context =>
            {
                if (context.Principal?.Identity is ClaimsIdentity id)
                {
                    var scopeRaw = id.FindFirst("scope")?.Value;
                    if (!string.IsNullOrWhiteSpace(scopeRaw) && (scopeRaw.Contains(' ') || scopeRaw.Contains(',')))
                    {
                        foreach (var s in scopeRaw
                            .Split(new[] { ' ', ',' }, StringSplitOptions.RemoveEmptyEntries)
                            .Distinct())
                        {
                            id.AddClaim(new Claim("scope", s));
                        }
                    }
                }
                return Task.CompletedTask;
            }
        };
    });

// ---------- Autorización (políticas por scope) ----------
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("DriversCreate",    policy => policy.RequireClaim("scope", "drivers:create"));
    options.AddPolicy("DriversReadAll",   policy => policy.RequireClaim("scope", "drivers:read:all"));
    options.AddPolicy("DriversReadOwn",   policy => policy.RequireClaim("scope", "drivers:read:own"));
    options.AddPolicy("DriversUpdateAny", policy => policy.RequireClaim("scope", "drivers:update:any"));
});

var app = builder.Build();

// ---------- Seed ----------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DriversDb>();
    await DriversSeeder.SeedAsync(db);
}

// ---------- Pipeline ----------
app.UseAuthentication();
app.UseAuthorization();

// ---------- Health ----------
var health = app.Services.GetRequiredService<Grpc.HealthCheck.HealthServiceImpl>();
health.SetStatus("", HealthCheckResponse.Types.ServingStatus.Serving);
health.SetStatus("drivers.v1.DriversService", HealthCheckResponse.Types.ServingStatus.Serving);

// ---------- gRPC Services ----------
app.MapGrpcService<DriversGrpc>()
   .RequireAuthorization(); // exige JWT en todos los métodos (las policies específicas siguen en cada método)

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
