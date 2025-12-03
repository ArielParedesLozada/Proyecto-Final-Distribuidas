using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace FuelService.Config;

public static class JWTConfig
{
    public static IServiceCollection AddJwtAuth(this IServiceCollection services, string jwtSecret, double jwtTime, string issuer)
    {
        var key = Encoding.ASCII.GetBytes(jwtSecret);
        JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
        JwtSecurityTokenHandler.DefaultMapInboundClaims = false;
        services
            .AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = false; // true en producción
                options.SaveToken = true;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = false, // si tu AuthService no emite audiencias específicas
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = issuer,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ClockSkew = TimeSpan.Zero, // elimina margen de tiempo por diferencia de relojes
                    NameClaimType = "sub"
                };
            });
        services.AddAuthorization(options =>
        {
            options.AddPolicy("ADMIN-OR-SUPERVISOR", policy =>
                policy.RequireAssertion(context =>
                    context.User.IsInRole("ADMIN") || context.User.IsInRole("SUPERVISOR")
                )
            );
        });
        return services;
    }
}
