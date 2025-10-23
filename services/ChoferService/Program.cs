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
using Serilog;
using Serilog.Events;

var builder = WebApplication.CreateBuilder(args);

// ====== Carga .env (dev) ======
DotNetEnv.Env.Load();

// ====== Configuración Serilog (solo SEQ) ======
var serviceName = Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "DRIVER-SERVICE";
var seqUrl = Environment.GetEnvironmentVariable("SEQ_URL") ?? "http://localhost:5134";

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .Enrich.WithProperty("ServiceName", serviceName)
    .Enrich.FromLogContext()
    .Enrich.WithThreadId()
    .WriteTo.Console()
    .WriteTo.Seq(seqUrl)
    .CreateLogger();

builder.Host.UseSerilog();

Log.Information("🚀 Iniciando ChoferService - enviando logs a {SeqUrl}", seqUrl);

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
    ?? "http://localhost:5121";

var jwtAudience =
    Cfg("Jwt:Audience", "JWT:Audience", "JWT_AUDIENCE")
    ?? jwtIssuer;

Log.Information("[CHOFER] JWT configurado. Fingerprint={Fp} Issuer={Issuer} Audience={Audience}",
    Fingerprint(jwtSecret), jwtIssuer, jwtAudience);

// ====== gRPC, Health y Reflection ======
builder.Services.AddGrpc();
builder.Services.AddGrpcReflection();
builder.Services.AddSingleton<HealthServiceImpl>();

JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
JwtSecurityTokenHandler.DefaultMapInboundClaims = false;

// ====== gRPC Clients ======
builder.Services.AddGrpcClientDiscovered<UserServices.UserProtoService.UserProtoServiceClient, UserClient>("auth-service");
builder.Services.AddGrpcClientDiscovered<VehiclesService.Proto.VehiclesService.VehiclesServiceClient, VehicleClient>("vehicle-service");

// ====== AuthN (JWT) ======
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.MapInboundClaims = false;
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
            RoleClaimType = ClaimTypes.Role
        };

        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = ctx =>
            {
                Log.Warning("[JWT] ❌ Auth failed: {Type}: {Message}", ctx.Exception.GetType().Name, ctx.Exception.Message);
                return Task.CompletedTask;
            },
            OnTokenValidated = ctx =>
            {
                var sub = ctx.Principal?.FindFirst("sub")?.Value ?? ctx.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                Log.Information("[JWT] ✅ Token válido. sub={Sub}", sub);
                return Task.CompletedTask;
            }
        };
    });

// ====== AuthZ ======
static void RequireScope(AuthorizationPolicyBuilder p, string scope) =>
    p.RequireAssertion(ctx => ctx.User.Claims.Any(c => c.Type == "scope" && c.Value.Split(' ').Contains(scope)));

static void RequireAnyScope(AuthorizationPolicyBuilder p, params string[] scopes) =>
    p.RequireAssertion(ctx => ctx.User.Claims.Any(c => c.Type == "scope" && c.Value.Split(' ').Intersect(scopes).Any()));

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
    Log.Information("✅ Base de datos inicializada correctamente");
}

// ====== Pipeline ======
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

// ====== Health ======
var health = app.Services.GetRequiredService<HealthServiceImpl>();
health.SetStatus("", HealthCheckResponse.Types.ServingStatus.Serving);
health.SetStatus("drivers.v1.DriversService", HealthCheckResponse.Types.ServingStatus.Serving);

// ====== gRPC Services ======
app.MapGrpcService<DriversGrpc>();
app.MapGrpcService<HealthServiceImpl>();

if (app.Environment.IsDevelopment())
{
    app.MapGrpcReflectionService();
}

app.MapGet("/", () => "ChoferService gRPC");
app.MapGet("/healthz", () => "ok");
app.MapGet("/readyz", async (DriversDb db) =>
{
    try
    {
        var canConnect = await db.Database.CanConnectAsync();
        return canConnect ? Results.Ok("ready") : Results.StatusCode(503);
    }
    catch (Exception ex)
    {
        Log.Error(ex, "❌ Error verificando conexión a DB");
        return Results.StatusCode(503);
    }
});

try
{
    Log.Information("🏁 Iniciando aplicación...");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "❌ La aplicación falló al iniciarse");
}
finally
{
    Log.CloseAndFlush();
}
