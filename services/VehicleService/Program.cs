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

// Cargar .env si existe
DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Valores desde .env o appsettings
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
var jwtSecret  = Cfg("JWT_SECRET", "Jwt:Secret");
var jwtIssuer  = Cfg("JWT_ISSUER", "Jwt:Issuer");
// var jwtAudience = Cfg("JWT_AUDIENCE", "Jwt:Audience"); // si decides validar audience

builder.Services.AddDbContext<VehiclesDb>(opt => opt.UseNpgsql(connectionString));

builder.Services.AddGrpc();
builder.Services.AddGrpcReflection();
builder.Services.AddSingleton<HealthServiceImpl>();
builder.Services.AddHttpContextAccessor(); // Para el interceptor JWT
builder.Services.AddScoped<JwtInterceptor>(); // Registrar el interceptor

// Configurar cliente gRPC hacia DriversService
var driversGrpc = Environment.GetEnvironmentVariable("DRIVERS_GRPC")
                   ?? builder.Configuration["Drivers:Grpc"]
                   ?? "http://localhost:5122";

builder.Services.AddGrpcClient<ChoferService.Proto.DriversService.DriversServiceClient>(o =>
{
    o.Address = new Uri(driversGrpc);
})
.AddInterceptor<JwtInterceptor>(); // Interceptor para enviar JWT

// evitar remapeos de claims
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
            // ValidAudience = jwtIssuer,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
            NameClaimType = "sub",
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
        };

        // gRPC envía el token en metadata 'authorization' (minúsculas). Asegura fallback correcto.
        o.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                // Para gRPC, el token viene en los headers de metadata
                var auth = ctx.Request.Headers["authorization"].FirstOrDefault() ??
                          ctx.Request.Headers["Authorization"].FirstOrDefault() ??
                          ctx.Request.Headers["grpc-metadata-authorization"].FirstOrDefault();

                Console.WriteLine($"[JWT/Vehicles] 🔍 Headers disponibles: {string.Join(", ", ctx.Request.Headers.Keys)}");
                Console.WriteLine($"[JWT/Vehicles] 🔍 authorization header: '{ctx.Request.Headers["authorization"].FirstOrDefault()}'");
                Console.WriteLine($"[JWT/Vehicles] 🔍 Authorization header: '{ctx.Request.Headers["Authorization"].FirstOrDefault()}'");

                if (!string.IsNullOrWhiteSpace(auth))
                {
                    // Remover "Bearer " si está presente
                    ctx.Token = auth.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                        ? auth.Substring("Bearer ".Length).Trim()
                        : auth.Trim();
                    
                    Console.WriteLine($"[JWT/Vehicles] 🔑 Token recibido: {ctx.Token.Substring(0, Math.Min(20, ctx.Token.Length))}...");
                }
                else
                {
                    Console.WriteLine("[JWT/Vehicles] ⚠️ No se encontró token de autorización");
                }
                return Task.CompletedTask;
            },
            OnAuthenticationFailed = ctx =>
            {
                Console.WriteLine($"[JWT/Vehicles] ❌ Auth failed: {ctx.Exception.GetType().Name}: {ctx.Exception.Message}");
                Console.WriteLine($"[JWT/Vehicles] ❌ Stack trace: {ctx.Exception.StackTrace}");
                return Task.CompletedTask;
            },
            OnTokenValidated = ctx =>
            {
                var sub = ctx.Principal?.FindFirst("sub")?.Value
                          ?? ctx.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                var aud = ctx.Principal?.FindFirst("aud")?.Value;
                var scope = ctx.Principal?.FindFirst("scope")?.Value;
                var role = ctx.Principal?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
                
                Console.WriteLine($"[JWT/Vehicles] ✅ Token válido. sub={sub} aud={aud} role={role} scope={scope}");
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();

    // Helper para requerir scope
    static void RequireScope(AuthorizationPolicyBuilder p, string scope) =>
        p.RequireAssertion(ctx => ctx.User.Claims.Any(c => c.Type == "scope" && c.Value.Split(' ').Contains(scope)));

    options.AddPolicy(AuthPolicies.VehiclesCreate,    p => RequireScope(p, "vehicles:create"));
    options.AddPolicy(AuthPolicies.VehiclesReadAll,   p => RequireScope(p, "vehicles:read:all"));
    options.AddPolicy(AuthPolicies.VehiclesReadOwn,   p => RequireScope(p, "vehicles:read:own"));
    options.AddPolicy(AuthPolicies.VehiclesUpdateAny, p => RequireScope(p, "vehicles:update:any"));
    options.AddPolicy(AuthPolicies.VehiclesAssign,    p => RequireScope(p, "vehicles:assign"));
});

var app = builder.Build();

// aplicar migraciones automáticamente (dev/qa)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<VehiclesDb>();
    db.Database.Migrate();
}

app.UseAuthentication();
app.UseAuthorization();

var health = app.Services.GetRequiredService<HealthServiceImpl>();
health.SetStatus("", HealthCheckResponse.Types.ServingStatus.Serving);
health.SetStatus("vehicles.v1.VehiclesService", HealthCheckResponse.Types.ServingStatus.Serving);

app.MapGrpcService<VehiclesGrpc>();
app.MapGrpcService<HealthServiceImpl>();
if (app.Environment.IsDevelopment()) app.MapGrpcReflectionService();

app.MapGet("/", () => "Vehicles gRPC up");
app.MapGet("/healthz", () => "ok");

app.Run();

// Interceptor para enviar JWT en llamadas gRPC hacia DriversService
public class JwtInterceptor : Interceptor
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public JwtInterceptor(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public override AsyncUnaryCall<TResponse> AsyncUnaryCall<TRequest, TResponse>(
        TRequest request,
        ClientInterceptorContext<TRequest, TResponse> context,
        AsyncUnaryCallContinuation<TRequest, TResponse> continuation)
    {
        // Obtener el token JWT del contexto HTTP actual
        var headers = _httpContextAccessor.HttpContext?.Request.Headers;
        var token = headers?["authorization"].FirstOrDefault()
                 ?? headers?["Authorization"].FirstOrDefault()
                 ?? headers?["grpc-metadata-authorization"].FirstOrDefault();
        
        if (!string.IsNullOrEmpty(token) &&
            token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            token = token.Substring("Bearer ".Length).Trim();
        }

        if (!string.IsNullOrEmpty(token))
        {
            // Agregar el token a los headers de la llamada gRPC
            var metadata = new Metadata();
            metadata.Add("authorization", $"Bearer {token}");
            context = new ClientInterceptorContext<TRequest, TResponse>(
                context.Method, context.Host, context.Options.WithHeaders(metadata));
            
            Console.WriteLine($"[JWT/Interceptor] 🔑 Enviando token a DriversService: {token.Substring(0, Math.Min(20, token.Length))}...");
        }
        else
        {
            Console.WriteLine("[JWT/Interceptor] ⚠️ No se encontró token para enviar a DriversService");
        }

        return continuation(request, context);
    }
}
