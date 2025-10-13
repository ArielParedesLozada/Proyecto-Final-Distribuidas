using ChoferService.Services;
using ChoferService.Data;
using ChoferService.Data.Seed;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Grpc.HealthCheck;
using Grpc.Health.V1;
using Microsoft.AspNetCore.Authorization;
using ChoferService.Clients;
using ChoferService.Configs;
using Steeltoe.Discovery.Eureka;

var builder = WebApplication.CreateBuilder(args);

// ====== Carga .env (dev) ======
DotNetEnv.Env.Load();

// ====== Helpers ======
static string Fingerprint(string s)
{
    using var sha = System.Security.Cryptography.SHA256.Create();
    return Convert.ToHexString(sha.ComputeHash(Encoding.UTF8.GetBytes(s))).Substring(0, 16);
}

string? Cfg(params string[] keys)
{
    foreach (var k in keys)
    {
        var v = builder.Configuration[k];
        if (!string.IsNullOrWhiteSpace(v)) return v;
        v = Environment.GetEnvironmentVariable(k.Replace(':', '_'));
        if (!string.IsNullOrWhiteSpace(v)) return v;
    }
    return null;
}

// ====== Config app/DB ======
var connectionString =
    Environment.GetEnvironmentVariable("CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("DriversDb")
    ?? builder.Configuration["ConnectionStrings:DriversDb"]
    ?? throw new InvalidOperationException("No se encontró CONNECTION_STRING ni ConnectionStrings:DriversDb.");

builder.Services.AddDbContext<DriversDb>(opt => opt.UseNpgsql(connectionString));

// ====== JWT ======
var jwtSecret =
    Cfg("Jwt:Secret", "JWT:Secret", "JWT_SECRET")
    ?? throw new InvalidOperationException("JWT secret no configurado (Jwt:Secret / JWT_SECRET).");

var jwtIssuer =
    Cfg("Jwt:Issuer", "JWT:Issuer", "JWT_ISSUER")
    ?? "http://localhost:5121"; // mismo valor que usa AuthService por defecto

var jwtAudience =
    Cfg("Jwt:Audience", "JWT:Audience", "JWT_AUDIENCE")
    ?? jwtIssuer; // por compatibilidad con AuthService que usa issuer = audience

Console.WriteLine($"[CHOFER] JWT_SECRET fp: {Fingerprint(jwtSecret)} len:{jwtSecret.Length} | issuer:{jwtIssuer} | audience:{jwtAudience}");

// ====== gRPC, Health y Reflection ======
builder.Services.AddGrpc();
builder.Services.AddGrpcReflection();
builder.Services.AddSingleton<HealthServiceImpl>();

// Limpia el mapeo de claims inbound para evitar renombres automáticos (sub -> nameidentifier, etc.)
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
JwtSecurityTokenHandler.DefaultMapInboundClaims = false;

// Comunicacion con gRPC-->AuthService
builder.Services.AddGrpcClientDiscovered<UserServices.UserProtoService.UserProtoServiceClient, UserClient>("auth-service");
// Comunicacion con gRPC-->VehicleService
builder.Services.AddGrpcClientDiscovered<VehiclesService.Proto.VehiclesService.VehiclesServiceClient, VehicleClient>("vehicle-service");
// ====== AuthN (JWT) ======
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false; // dev sin TLS
        options.MapInboundClaims = false; // obligatorio
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),

            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,

            ValidateAudience = false,

            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
            NameClaimType = "sub",
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
        };

        // gRPC envía el token en metadata 'authorization' (minúsculas). Asegura fallback correcto.
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var auth = ctx.Request.Headers["authorization"].ToString();
                if (string.IsNullOrWhiteSpace(auth))
                    auth = ctx.Request.Headers["Authorization"].ToString();
                if (string.IsNullOrWhiteSpace(auth))
                    auth = ctx.Request.Headers["grpc-metadata-authorization"].ToString();

                if (!string.IsNullOrWhiteSpace(auth))
                {
                    ctx.Token = auth.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                        ? auth.Substring("Bearer ".Length).Trim()
                        : auth.Trim();
                }
                return Task.CompletedTask;
            },
            OnAuthenticationFailed = ctx =>
            {
                Console.WriteLine($"[JWT/Chofer] ❌ Auth failed: {ctx.Exception.GetType().Name}: {ctx.Exception.Message}");
                return Task.CompletedTask;
            },
            OnTokenValidated = ctx =>
            {
                var sub = ctx.Principal?.FindFirst("sub")?.Value
                          ?? ctx.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var aud = ctx.Principal?.FindFirst("aud")?.Value;
                Console.WriteLine($"[JWT/Chofer] ✅ Token válido. sub={sub} aud={aud}");
                return Task.CompletedTask;
            }
        };
    });

// ====== AuthZ (políticas por scope) ======
static void RequireScope(AuthorizationPolicyBuilder p, string scope) =>
    p.RequireAssertion(ctx => ctx.User.Claims.Any(c => c.Type == "scope" && c.Value.Split(' ').Contains(scope)));

static void RequireAnyScope(AuthorizationPolicyBuilder p, params string[] scopes) =>
    p.RequireAssertion(ctx =>
        ctx.User.Claims.Any(c => c.Type == "scope" && c.Value.Split(' ').Intersect(scopes).Any()));

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();

    options.AddPolicy("DriversCreate", p => RequireScope(p, "drivers:create"));
    options.AddPolicy("DriversReadAll", p => RequireScope(p, "drivers:read:all"));
    options.AddPolicy("DriversReadOwn", p => RequireScope(p, "drivers:read:own"));
    options.AddPolicy("DriversUpdateAny", p => RequireAnyScope(p, "drivers:update", "drivers:update:any"));
});

builder.Services.AddEurekaDiscoveryClient();

var app = builder.Build();

// ====== Seed DB ======
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DriversDb>();
    await DriversSeeder.SeedAsync(db);
}

// ====== Pipeline ======
app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

// ====== Health ======
var health = app.Services.GetRequiredService<Grpc.HealthCheck.HealthServiceImpl>();
health.SetStatus("", HealthCheckResponse.Types.ServingStatus.Serving);
health.SetStatus("drivers.v1.DriversService", HealthCheckResponse.Types.ServingStatus.Serving);

// ====== gRPC Services ======
app.MapGrpcService<DriversGrpc>();   // métodos con [Authorize] funcionarán (sin RequireAuthorization global)

app.MapGrpcService<Grpc.HealthCheck.HealthServiceImpl>();

// ====== Reflection (solo dev) ======
if (app.Environment.IsDevelopment())
{
    app.MapGrpcReflectionService();
}

// ====== Endpoints HTTP ======
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