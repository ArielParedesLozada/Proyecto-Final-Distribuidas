using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AuthService.Data.Repository;
using AuthService.Domain;
using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;

namespace AuthService.Services;

public class JWTAuthService : AuthService.AuthServiceBase
{
    private readonly string _JWT_SECRET;
    private readonly double _time;
    private readonly IRepository<User, Guid> _repository;
    private readonly string _issuer;

    public JWTAuthService(string JWT_secret, double time, IRepository<User, Guid> repository, string issuer)
    {
        _JWT_SECRET = JWT_secret;
        _time = time;
        _repository = repository;
        _issuer = issuer;
    }

    private string GenerateToken(User user)
    {
        var expiration = DateTime.UtcNow.AddHours(_time);
        Claim[] claims = new[]
        {
        new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
        new Claim(JwtRegisteredClaimNames.Email, user.Email),
        new Claim(ClaimTypes.Role, user.Roles),
        new Claim(ClaimTypes.Name, user.Nombre),
    };
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_JWT_SECRET));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _issuer,
            claims: claims,
            expires: expiration,
            signingCredentials: creds
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
    public override async Task<LoginReply> Login(LoginRequest request, ServerCallContext context)
    {
        var email = request.Email;
        var user = await _repository.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            throw new RpcException(new Status(StatusCode.NotFound, "User not found"));
        }
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Wrong password"));
        }
        string _token = GenerateToken(user);
        return new LoginReply
        {
            Email = user.Email,
            Roles = user.Roles,
            Token = _token,
        };
    }
    [Authorize]
    public override async Task<MeReply> Me(Empty request, ServerCallContext context)
    {
        var httpContext = context.GetHttpContext();
        var userClaims = httpContext.User;

        if (userClaims.Identity?.IsAuthenticated != true)
        {
            throw new RpcException(new Status(StatusCode.Unauthenticated, "User not authenticated"));
        }

        var email = userClaims.FindFirst(ClaimTypes.Email)?.Value;
        var roles = userClaims.FindFirst(ClaimTypes.Role)?.Value;
        var name = userClaims.FindFirst(ClaimTypes.Name)?.Value;
        var id = userClaims.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        return new MeReply
        {
            Email = email,
            Name = name,
            Roles = roles,
            Id = id
        };
    }

}