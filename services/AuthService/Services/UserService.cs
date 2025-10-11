using AuthService.Data.Repository;
using AuthService.Domain;
using AuthService.Clients;
using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using Microsoft.AspNetCore.Authorization;
using UserServices;

namespace AuthService.Services
{
    public class UserService : UserProtoService.UserProtoServiceBase
    {
        private readonly IRepository<User, Guid> _repository;
        private readonly DriverClient _driverClient;

        public UserService(IRepository<User, Guid> repository, DriverClient driverClient)
        {
            _repository = repository;
            _driverClient = driverClient;
        }
        [Authorize(Roles = "ADMIN")]
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
        [Authorize(Roles = "ADMIN")]
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
        [Authorize(Roles = "ADMIN")]
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
        [Authorize(Roles = "ADMIN")]
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
        [Authorize(Roles = "ADMIN")]
        public override async Task<UserResponse> UpdateUser(UserUpdateRequest request, ServerCallContext context)
        {
            var id = Guid.Parse(request.Id);
            var userToUpdate = await _repository.GetByIdAsync(id) ?? throw new RpcException(new Status(StatusCode.NotFound, "User not found"));
            
            // Guardar el nombre anterior para comparar
            var previousName = userToUpdate.Nombre;
            var nameChanged = false;
            
            // Actualizar nombre si se proporciona
            if (!string.IsNullOrWhiteSpace(request.User.Nombre))
            {
                nameChanged = previousName != request.User.Nombre;
                userToUpdate.Nombre = request.User.Nombre;
            }
            
            // Actualizar email si se proporciona
            if (!string.IsNullOrWhiteSpace(request.User.Email))
            {
                userToUpdate.Email = request.User.Email;
            }
            
            // Actualizar rol si se proporciona
            if (!string.IsNullOrWhiteSpace(request.User.Roles))
            {
                userToUpdate.Roles = request.User.Roles;
            }
            
            // Actualizar contraseña solo si se proporciona
            if (!string.IsNullOrWhiteSpace(request.User.Password))
            {
                userToUpdate.Password = BCrypt.Net.BCrypt.HashPassword(request.User.Password);
            }
            
            var updated = await _repository.UpdateAsync(userToUpdate);

            // Sincronizar nombre con ChoferService si cambió y el usuario es CONDUCTOR
            if (nameChanged && updated.Roles == "CONDUCTOR")
            {
                try
                {
                    // Obtener el token JWT del contexto
                    var httpContext = context.GetHttpContext();
                    var authHeader = httpContext?.Request.Headers["authorization"].FirstOrDefault();
                    var jwtToken = authHeader?.Replace("Bearer ", "");

                    if (!string.IsNullOrEmpty(jwtToken))
                    {
                        Console.WriteLine($"Synchronizing user name with ChoferService for user: {updated.Id}");
                        
                        var syncSuccess = await _driverClient.UpdateDriverNameAsync(
                            updated.Id.ToString(), 
                            updated.Nombre, 
                            jwtToken
                        );

                        if (syncSuccess)
                        {
                            Console.WriteLine("Successfully synchronized user name with ChoferService");
                        }
                        else
                        {
                            Console.WriteLine("Failed to synchronize user name with ChoferService - user updated but driver name may be out of sync");
                        }
                    }
                    else
                    {
                        Console.WriteLine("No JWT token found - cannot synchronize with ChoferService");
                    }
                }
                catch (Exception syncEx)
                {
                    Console.WriteLine($"Error synchronizing user name with ChoferService - user updated but driver name may be out of sync: {syncEx.Message}");
                    // No lanzamos excepción aquí para no afectar la actualización del usuario
                }
            }

            var responseUser = new ReadUser
            {
                Id = updated.Id.ToString(),
                Email = updated.Email,
                Nombre = updated.Nombre,
                Roles = updated.Roles
            };
            return new UserResponse { User = responseUser };
        }
        [Authorize(Roles = "ADMIN")]
        public override async Task<Empty> DeleteUser(UserGetByIdRequest request, ServerCallContext context)
        {
            var id = Guid.Parse(request.Id);
            var user = await _repository.GetByIdAsync(id) ?? throw new RpcException(new Status(StatusCode.NotFound, "User not found"));
            await _repository.DeleteAsync(user);
            return new Empty();
        }
    }
}
