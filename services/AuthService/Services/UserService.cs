using AuthService.Data.Repository;
using AuthService.Domain;
using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using Microsoft.AspNetCore.Authorization;
using UserServices;

namespace AuthService.Services
{
    public class UserService : UserProtoService.UserProtoServiceBase
    {
        private readonly IRepository<User, Guid> _repository;

        public UserService(IRepository<User, Guid> repository)
        {
            _repository = repository;
        }
        [Authorize]
        public override async Task<ListUsersResponse> ListUsers(Empty request, ServerCallContext context)
        {
            var users = await _repository.GetAllAsync();
            var response = new ListUsersResponse();
            response.Users.AddRange(users.Select(u => new ReadUser
            {
                Id = u.Id.ToString(),
                Email = u.Email,
                Nombre = u.Nombre,
                Roles = u.Roles,
            }));
            return response;
        }
        [Authorize]
        public override async Task<UserResponse> GetUserById(UserGetByIdRequest request, ServerCallContext context)
        {
            var id = Guid.Parse(request.Id);
            var user = await _repository.GetByIdAsync(id) ?? throw new RpcException(new Status(StatusCode.NotFound, "User not found"));
            var responseUser = new ReadUser
            {
                Id = user.Id.ToString(),
                Email = user.Email,
                Nombre = user.Nombre,
                Roles = user.Roles
            };
            return new UserResponse { User = responseUser };
        }
        [Authorize]
        public override async Task<UserResponse> GetUserByEmail(UserGetByEmailRequest request, ServerCallContext context)
        {
            var email = request.Email;
            var user = await _repository.FirstOrDefaultAsync(u => u.Email == email) ?? throw new RpcException(new Status(StatusCode.NotFound, "User not found"));
            var responseUser = new ReadUser
            {
                Id = user.Id.ToString(),
                Email = user.Email,
                Nombre = user.Nombre,
                Roles = user.Roles
            };
            return new UserResponse { User = responseUser };
        }
        [Authorize]
        public override async Task<UserResponse> CreateUser(UserCreateRequest request, ServerCallContext context)
        {
            var userReq = request.User;

            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(userReq.Password);

            var user = new User(
                userReq.Email,
                hashedPassword,
                userReq.Nombre,
                userReq.Roles
            );
            var created = await _repository.CreateAsync(user);
            var responseUser = new ReadUser
            {
                Id = created.Id.ToString(),
                Email = created.Email,
                Nombre = created.Nombre,
                Roles = created.Roles
            };
            return new UserResponse { User = responseUser };
        }
        [Authorize]
        public override async Task<UserResponse> UpdateUser(UserUpdateRequest request, ServerCallContext context)
        {
            var id = Guid.Parse(request.Id);
            var userToUpdate = await _repository.GetByIdAsync(id) ?? throw new RpcException(new Status(StatusCode.NotFound, "User not found"));
            userToUpdate.Nombre = request.User.Nombre;
            if (!string.IsNullOrWhiteSpace(request.User.Password)
                && !string.IsNullOrWhiteSpace(request.User.Email)
                && !string.IsNullOrWhiteSpace(request.User.Roles))
            {
                userToUpdate.Roles = request.User.Roles;
                userToUpdate.Email = request.User.Email;
                userToUpdate.Password = BCrypt.Net.BCrypt.HashPassword(request.User.Password);
            }
            var updated = await _repository.UpdateAsync(userToUpdate);
            var responseUser = new ReadUser
            {
                Id = updated.Id.ToString(),
                Email = updated.Email,
                Nombre = updated.Nombre,
                Roles = updated.Roles
            };
            return new UserResponse { User = responseUser };
        }
        [Authorize]
        public override async Task<Empty> DeleteUser(UserGetByIdRequest request, ServerCallContext context)
        {
            var id = Guid.Parse(request.Id);
            var user = await _repository.GetByIdAsync(id) ?? throw new RpcException(new Status(StatusCode.NotFound, "User not found"));
            await _repository.DeleteAsync(user);
            return new Empty();
        }
    }
}
