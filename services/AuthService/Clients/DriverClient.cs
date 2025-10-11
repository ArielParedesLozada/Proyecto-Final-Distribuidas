using Grpc.Core;
using Grpc.Net.Client;
using ChoferService.Proto; // Namespace generado por el proto de drivers

namespace AuthService.Clients
{
    public class DriverClient
    {
        private readonly DriversService.DriversServiceClient _client;
        private readonly GrpcChannel _channel;

        public DriverClient(string choferServiceUrl)
        {
            Console.WriteLine($"[DriverClient] 🔧 Inicializando cliente para ChoferService en: http://{choferServiceUrl}");
            _channel = GrpcChannel.ForAddress($"http://{choferServiceUrl}");
            _client = new DriversService.DriversServiceClient(_channel);
            Console.WriteLine($"[DriverClient] ✅ Cliente inicializado correctamente");
        }

        public async Task<bool> UpdateDriverNameAsync(string userId, string newName, string jwtToken)
        {
            try
            {
                Console.WriteLine($"[DriverClient] 🔄 Iniciando sincronización de nombre para conductor con userId {userId} con nombre '{newName}'");
                
                var headers = new Metadata
                {
                    { "Authorization", $"Bearer {jwtToken}" }
                };

                // Primero obtener el conductor por user_id
                var getRequest = new GetDriverByUserIdRequest
                {
                    UserId = userId
                };

                Console.WriteLine($"[DriverClient] 🔍 Buscando conductor por userId: {userId}");
                DriverResponse driverResponse;
                try
                {
                    driverResponse = await _client.GetDriverByUserIdAsync(getRequest, headers);
                    Console.WriteLine($"[DriverClient] ✅ Conductor encontrado: ID={driverResponse.Driver.Id}, Nombre actual={driverResponse.Driver.FullName}");
                }
                catch (RpcException ex) when (ex.StatusCode == StatusCode.NotFound)
                {
                    Console.WriteLine($"[DriverClient] ℹ️ No hay conductor asociado a este usuario {userId} - sincronización no necesaria");
                    return true; // No es un error, simplemente no hay conductor
                }

                var driver = driverResponse.Driver;

                // Actualizar solo el nombre del conductor
                var updateRequest = new UpdateDriverRequest
                {
                    Id = driver.Id,
                    FullName = newName,
                    LicenseNumber = driver.LicenseNumber,
                    Capabilities = driver.Capabilities,
                    Availability = driver.Availability
                };

                Console.WriteLine($"[DriverClient] 📤 Enviando request a ChoferService: DriverId={driver.Id}, Nombre={newName}");
                await _client.UpdateDriverAsync(updateRequest, headers);
                Console.WriteLine($"[DriverClient] ✅ Sincronización exitosa para conductor {driver.Id}");
                return true;
            }
            catch (RpcException ex)
            {
                Console.WriteLine($"[DriverClient] ❌ Error RPC al actualizar nombre de conductor: {ex.Status.Detail}");
                Console.WriteLine($"[DriverClient] ❌ Status Code: {ex.StatusCode}");
                Console.WriteLine($"[DriverClient] ❌ Status: {ex.Status}");
                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DriverClient] ❌ Error inesperado al actualizar nombre de conductor: {ex.Message}");
                Console.WriteLine($"[DriverClient] ❌ Stack trace: {ex.StackTrace}");
                return false;
            }
        }

        public void Dispose()
        {
            _channel?.Dispose();
        }
    }
}

