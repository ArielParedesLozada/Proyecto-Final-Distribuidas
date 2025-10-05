using AdminService.Clients;
using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using Microsoft.AspNetCore.Authorization;
using UserServices;

namespace AdminService.Services.Admin;

public class UserService : AdminUserService.AdminService.AdminServiceBase
{
    private readonly UserClient _client;
    public UserService(UserClient client)
    {
        _client = client;
    }
    private static string? GetAuthorization(ServerCallContext ctx)
    {
        return ctx.GetHttpContext()?.Request.Headers["Authorization"].ToString();
    }
    [Authorize]
    public override Task<ListUsersResponse> ListUsers(Empty request, ServerCallContext context)
    {
        return _client.ListUsersAsync(GetAuthorization(context));
    }
    [Authorize]
    public override Task<UserResponse> GetUserById(UserGetByIdRequest request, ServerCallContext context)
    {
        return _client.GetUserByIdAsync(request.Id, GetAuthorization(context));
    }
    [Authorize]
    public override Task<UserResponse> GetUserByEmail(UserGetByEmailRequest request, ServerCallContext context)
    {
        return _client.GetUserByEmailAsync(request.Email, GetAuthorization(context));
    }
    [Authorize]
    public override Task<UserResponse> CreateUser(UserCreateRequest request, ServerCallContext context)
    {
        return _client.CreateUserAsync(request.User, GetAuthorization(context));
    }
    [Authorize]
    public override Task<UserResponse> UpdateUser(UserUpdateRequest request, ServerCallContext context)
    {
        return _client.UpdateUserAsync(request.Id, request.User, GetAuthorization(context));
    }
    [Authorize]
    public override async Task<Empty> DeleteUser(UserGetByIdRequest request, ServerCallContext context)
    {
        await _client.DeleteUserAsync(request.Id, GetAuthorization(context));
        return new Empty();
    }
}