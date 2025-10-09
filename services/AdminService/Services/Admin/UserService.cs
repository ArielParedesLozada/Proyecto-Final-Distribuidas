using AdminService.Clients;
using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using Microsoft.AspNetCore.Authorization;
using UserServices;

namespace AdminService.Services.Admin;

public class UserService : AdminUserService.AdminService.AdminServiceBase
{
    private readonly UserClient _client;
    private readonly DriverClient _driverClient;
    public UserService(UserClient client, DriverClient driver)
    {
        _client = client;
        _driverClient = driver;
    }
    private static string? GetAuthorization(ServerCallContext ctx)
    {
        return ctx.GetHttpContext()?.Request.Headers["Authorization"].ToString();
    }
    public override Task<ListUsersResponse> ListUsers(Empty request, ServerCallContext context)
    {
        return _client.ListUsersAsync(GetAuthorization(context));
    }
    public override Task<UserResponse> GetUserById(UserGetByIdRequest request, ServerCallContext context)
    {
        return _client.GetUserByIdAsync(request.Id, GetAuthorization(context));
    }
    public override Task<UserResponse> GetUserByEmail(UserGetByEmailRequest request, ServerCallContext context)
    {
        return _client.GetUserByEmailAsync(request.Email, GetAuthorization(context));
    }
    public override Task<UserResponse> CreateUser(UserCreateRequest request, ServerCallContext context)
    {
        return _client.CreateUserAsync(request.User, GetAuthorization(context));
    }
    public override Task<UserResponse> UpdateUser(UserUpdateRequest request, ServerCallContext context)
    {
        return _client.UpdateUserAsync(request.Id, request.User, GetAuthorization(context));
    }
    public override async Task<Empty> DeleteUser(UserGetByIdRequest request, ServerCallContext context)
    {
        var bearer = GetAuthorization(context);
        //Borra el conductor asociado
        await _driverClient.DeleteDriverByUserIdAsync(request.Id, bearer);
        // Borra el usuario ahora si
        await _client.DeleteUserAsync(request.Id, bearer);
        return new Empty();
    }
}