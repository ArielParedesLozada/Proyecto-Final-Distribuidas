//
using Microsoft.EntityFrameworkCore;
using VehiclesService.Data;
using VehiclesService.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using VehiclesService.Configs;
using Grpc.HealthCheck;
using Grpc.Health.V1;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Grpc.Core;
using Grpc.Core.Interceptors;
using VehicleService.Clients;
using VehicleService.Configs;
using Steeltoe.Discovery.Eureka;
using Serilog;
using Serilog.Events;

// Cargar .env si existe
DotNetEnv.Env.Load();

// ====== Configuración de Serilog ======
var serviceName = Environment.GetEnvironmentVariable("SERVICE_NAME") ?? "VEHCILE-SERVICE";
var seqUrl = Environment.GetEnvironmentVariable("SEQ_URL") ?? "http://localhost:5134";

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("ServiceName", serviceName)
    .Enrich.WithThreadId()
    .WriteTo.Console()
    .WriteTo.Seq(seqUrl)
    .CreateLogger();

Log.Information("🚀 Iniciando VehiclesService... enviando logs a {SeqUrl}", seqUrl);

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog(); // 🔗 Integrar Serilog con el host

// ====== Configuración de variables ======
string Conn(string key) =>
    Environment.GetEnvironmentVariable(key) ??
    builder.Configuration.GetConnectionString("VehiclesDb") ??
    builder.Configuration["ConnectionStrings:VehiclesDb"]!;

string Cfg(params string[] keys)
{
    foreach (var k in keys)
    {
        var v = Environment.GetEnvironmentVariable(k) ?? builder.Configuration[k];
        if (!string.IsNullOrWhiteSpace(v)) return v!;
    }
    throw new InvalidOperationException($"Falta configuración: {string.Join("/", keys)}");
}

var connectionString = Conn("CONNECTION_STRING");
var jwtSecret = Cfg("JWT_SECRET", "Jwt:Secret");
var jwtIssuer = Cfg("JWT_ISSUER", "Jwt:Issuer");

// ====== Servicios ======
builder.Services.AddDbContext<VehiclesDb>(opt => opt.UseNpgsql(connectionString));
builder.Services.AddGrpc();
builder.Services.AddGrpcReflection();
builder.Services.AddSingleton<HealthServiceImpl>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<JwtInterceptor>();

// ====== gRPC hacia DriversService ======
builder.Services.AddEurekaDiscoveryClient();
builder.Services
    .AddGrpcClientDiscovered<ChoferService.Proto.DriversService.DriversServiceClient, DriverClient>("driver-service")
    .AddInterceptor<JwtInterceptor>();

// ====== JWT ======
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
JwtSecurityTokenHandler.DefaultMapInboundClaims = false;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.RequireHttpsMetadata = false;
        o.MapInboundClaims = false;
        o.TokenValidationParameters = new TokenValidationParameters
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

        o.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var auth = ctx.Request.Headers["authorization"].FirstOrDefault()
                        ?? ctx.Request.Headers["Authorization"].FirstOrDefault()
                        ?? ctx.Request.Headers["grpc-metadata-authorization"].FirstOrDefault();

                if (!string.IsNullOrWhiteSpace(auth))
                {
                    ctx.Token = auth.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                        ? auth.Substring("Bearer ".Length).Trim()
                        : auth.Trim();

                    Log.Information("[JWT/Vehicles] 🔑 Token recibido ({Length} chars)", ctx.Token.Length);
                }
                else
                {
                    Log.Warning("[JWT/Vehicles] ⚠️ No se encontró token de autorización");
                }
                return Task.CompletedTask;
            },
            OnAuthenticationFailed = ctx =>
            {
                Log.Error(ctx.Exception, "[JWT/Vehicles] ❌ Error de autenticación: {Message}", ctx.Exception.Message);
                return Task.CompletedTask;
            },
            OnTokenValidated = ctx =>
            {
                var sub = ctx.Principal?.FindFirst("sub")?.Value
                          ?? ctx.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                Log.Information("[JWT/Vehicles] ✅ Token válido. sub={Sub}", sub);
                return Task.CompletedTask;
            }
        };
    });

// ====== Autorización ======
builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();

    static void RequireScope(AuthorizationPolicyBuilder p, string scope) =>
        p.RequireAssertion(ctx => ctx.User.Claims.Any(c => c.Type == "scope" && c.Value.Split(' ').Contains(scope)));

    options.AddPolicy(AuthPolicies.VehiclesCreate, p => RequireScope(p, "vehicles:create"));
    options.AddPolicy(AuthPolicies.VehiclesReadAll, p => RequireScope(p, "vehicles:read:all"));
    options.AddPolicy(AuthPolicies.VehiclesReadOwn, p => RequireScope(p, "vehicles:read:own"));
    options.AddPolicy(AuthPolicies.VehiclesUpdateAny, p => RequireScope(p, "vehicles:update:any"));
    options.AddPolicy(AuthPolicies.VehiclesAssign, p => RequireScope(p, "vehicles:assign"));
    options.AddPolicy(AuthPolicies.VehiclesReadAllOrAssign, p =>
        p.RequireAssertion(ctx =>
            ctx.User.Claims.Any(c => c.Type == "scope" && c.Value.Split(' ').Contains("vehicles:read:all")) ||
            ctx.User.Claims.Any(c => c.Type == "scope" && c.Value.Split(' ').Contains("vehicles:assign"))));
});

var app = builder.Build();

// ====== Migración automática ======
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<VehiclesDb>();
    db.Database.Migrate();
    Log.Information("📦 Base de datos migrada correctamente.");
}

// ====== Middleware ======
app.UseAuthentication();
app.UseAuthorization();

// ====== Healthcheck ======
var health = app.Services.GetRequiredService<HealthServiceImpl>();
health.SetStatus("", HealthCheckResponse.Types.ServingStatus.Serving);
health.SetStatus("vehicles.v1.VehiclesService", HealthCheckResponse.Types.ServingStatus.Serving);

app.MapGrpcService<VehiclesGrpc>();
app.MapGrpcService<HealthServiceImpl>();
if (app.Environment.IsDevelopment()) app.MapGrpcReflectionService();

app.MapGet("/", [AllowAnonymous] () => "Vehicles gRPC up");
app.MapGet("/healthz", [AllowAnonymous] () => "ok");

try
{
    Log.Information("✅ VehiclesService iniciado correctamente en {Env}", app.Environment.EnvironmentName);
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "❌ VehiclesService no pudo iniciarse correctamente.");
}
finally
{
    Log.CloseAndFlush();
}

// ====== Interceptor para enviar JWT ======
public class JwtInterceptor : Interceptor
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    public JwtInterceptor(IHttpContextAccessor httpContextAccessor) => _httpContextAccessor = httpContextAccessor;

    public override AsyncUnaryCall<TResponse> AsyncUnaryCall<TRequest, TResponse>(
        TRequest request,
        ClientInterceptorContext<TRequest, TResponse> context,
        AsyncUnaryCallContinuation<TRequest, TResponse> continuation)
    {
        var headers = _httpContextAccessor.HttpContext?.Request.Headers;
        var token = headers?["authorization"].FirstOrDefault()
                 ?? headers?["Authorization"].FirstOrDefault()
                 ?? headers?["grpc-metadata-authorization"].FirstOrDefault();

        if (!string.IsNullOrEmpty(token) && token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            token = token.Substring("Bearer ".Length).Trim();

        if (!string.IsNullOrEmpty(token))
        {
            var metadata = new Metadata { { "authorization", $"Bearer {token}" } };
            context = new ClientInterceptorContext<TRequest, TResponse>(
                context.Method, context.Host, context.Options.WithHeaders(metadata));
            Log.Debug("[JWT/Interceptor] 🔑 Enviando token a DriversService ({Len} chars)", token.Length);
        }
        else
        {
            Log.Warning("[JWT/Interceptor] ⚠️ No se encontró token para enviar a DriversService");
        }

        return continuation(request, context);
    }
}
