using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AuthService.Data.Repository;
using AuthService.Domain;
using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using Microsoft.IdentityModel.Tokens;

namespace AuthService.Services;

public class JWTAuthService : AuthService.AuthServiceBase
{
    private string _JWT_SECRET;
    private double _time;
    private IRepository<User> _repository;
    private string _issuer;

    public JWTAuthService(string JWT_secret, double time, IRepository<User> repository, string issuer)
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
        new Claim(ClaimTypes.Role, user.Roles)
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
        var password = request.Password;
        var user = await _repository.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            throw new RpcException(new Status(StatusCode.NotFound, "User not found"));
        }
        if (!user.Password.Equals(password))
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

    public override Task<Empty> Logout(Empty request, ServerCallContext context)
    {
        return base.Logout(request, context);
    }

    public override Task<MeReply> Me(LoginRequest request, ServerCallContext context)
    {
        return base.Me(request, context);
    }
}