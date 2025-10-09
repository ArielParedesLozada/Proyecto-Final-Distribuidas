using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using UserServices;

namespace ChoferService.Clients;

public class UserClient
{
    private readonly UserProtoService.UserProtoServiceClient _user;

    public UserClient(UserProtoService.UserProtoServiceClient user)
    {
        _user = user;
    }
    private static CallOptions MakeCallOptions(string? bearer)
    {
        var md = new Metadata();
        if (!string.IsNullOrWhiteSpace(bearer)) md.Add("Authorization", bearer);
        return new CallOptions(md, deadline: DateTime.UtcNow.AddSeconds(5));
    }
    public async Task<ListUsersResponse> ListUsersAsync(string? bearer)
    {
        return await _user.ListUsersAsync(new Empty(), MakeCallOptions(bearer));
    }
    public async Task<UserResponse> GetUserByIdAsync(string id, string? bearer)
    {
        return await _user.GetUserByIdAsync(new UserGetByIdRequest { Id = id }, MakeCallOptions(bearer));
    }
    public async Task<UserResponse> GetUserByEmailAsync(string email, string? bearer)
    {
        return await _user.GetUserByEmailAsync(new UserGetByEmailRequest { Email = email }, MakeCallOptions(bearer));
    }

}