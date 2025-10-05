using System.Text;
using AuthService.Config;
using AuthService.Data.Repository;
using AuthService.Domain;
using AuthService.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

public static class JWTConfig
{
    public static IServiceCollection AddJwtAuth(this IServiceCollection services, string jwtSecret, double jwtTime, string issuer)
    {
        services.AddScoped<JWTAuthService>(sp =>
        {
            var repo = sp.GetRequiredService<IRepository<User, Guid>>();
            return new JWTAuthService(jwtSecret, jwtTime, repo, issuer);
        });

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateAudience = true,
                    ValidateIssuer = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = issuer,
                    ValidAudience = issuer,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
                };
            });
        return services;
    }
}