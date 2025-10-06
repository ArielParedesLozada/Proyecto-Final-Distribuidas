using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ChoferService.Middleware;

public class GrpcJwtMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GrpcJwtMiddleware> _logger;
    private readonly string _jwtSecret = "b674d61f8fa4763520494479868548fc0fa05e571b8103e96bdcabaeddf51473";

    public GrpcJwtMiddleware(RequestDelegate next, ILogger<GrpcJwtMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Solo procesar requests gRPC
        if (context.Request.Path.StartsWithSegments("/grpc") || 
            context.Request.ContentType?.StartsWith("application/grpc") == true)
        {
            try
            {
                // Intentar obtener el token de los metadatos gRPC
                var token = ExtractTokenFromGrpcMetadata(context);
                
                if (!string.IsNullOrEmpty(token))
                {
                    // Validar y establecer el token JWT
                    var principal = ValidateJwtToken(token);
                    if (principal != null)
                    {
                        context.User = principal;
                        _logger.LogInformation("JWT token validado exitosamente desde metadatos gRPC");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error procesando JWT desde metadatos gRPC");
            }
        }

        await _next(context);
    }

    private string? ExtractTokenFromGrpcMetadata(HttpContext context)
    {
        // Los metadatos gRPC se pasan como headers con prefijo "grpc-metadata-"
        var authHeader = context.Request.Headers["grpc-metadata-authorization"].FirstOrDefault();
        
        if (!string.IsNullOrEmpty(authHeader))
        {
            // Remover "Bearer " si está presente
            return authHeader.StartsWith("Bearer ") ? authHeader.Substring(7) : authHeader;
        }

        return null;
    }

    private ClaimsPrincipal? ValidateJwtToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_jwtSecret);

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = "http://localhost:5121",
                ValidAudience = "http://localhost:5121",
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ClockSkew = TimeSpan.Zero
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
            return principal;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validando JWT token");
            return null;
        }
    }
}
