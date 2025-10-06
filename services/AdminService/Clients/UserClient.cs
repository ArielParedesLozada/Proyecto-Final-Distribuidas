using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using UserServices;

namespace AdminService.Clients;

public class UserClient
{
    private readonly UserProtoService.UserProtoServiceClient _users;

    public UserClient(UserProtoService.UserProtoServiceClient users)
    {
        _users = users;
    }

    private static CallOptions MakeCallOptions(string? bearer)
    {
        var md = new Metadata();
        if (!string.IsNullOrWhiteSpace(bearer)) md.Add("Authorization", bearer);
        return new CallOptions(md, deadline: DateTime.UtcNow.AddSeconds(5));
    }
    public async Task<ListUsersResponse> ListUsersAsync(string? bearer)
    {
        return await _users.ListUsersAsync(new Empty(), MakeCallOptions(bearer));
    }
    public async Task<UserResponse> GetUserByIdAsync(string id, string? bearer)
    {
        return await _users.GetUserByIdAsync(new UserGetByIdRequest { Id = id }, MakeCallOptions(bearer));
    }
    public async Task<UserResponse> GetUserByEmailAsync(string email, string? bearer)
    {
        return await _users.GetUserByEmailAsync(new UserGetByEmailRequest { Email = email }, MakeCallOptions(bearer));
    }
    public async Task<UserResponse> CreateUserAsync(CreateUser dto, string? bearer)
    {
        return await _users.CreateUserAsync(new UserCreateRequest { User = dto }, MakeCallOptions(bearer));
    }
    public async Task<UserResponse> UpdateUserAsync(string id, CreateUser dto, string? bearer)
    {
        return await _users.UpdateUserAsync(new UserUpdateRequest { Id = id, User = dto }, MakeCallOptions(bearer));
    }
    public async Task DeleteUserAsync(string id, string? bearer)
    {
        await _users.DeleteUserAsync(new UserGetByIdRequest { Id = id }, MakeCallOptions(bearer));
    }
}