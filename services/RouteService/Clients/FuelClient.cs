using RouteService.Queue.Publisher;
using RouteDomain = RouteService.Domain.Route;
using Serilog;

namespace RouteService.Clients;

public class FuelClient
{
    private readonly FuelConsumptionPublisher _publisher;
    
    public FuelClient(FuelConsumptionPublisher publisher)
    {
        _publisher = publisher;
    }
    
    public async Task<bool> RegisterFuelConsumption(
        RouteDomain route,
        int machineryType,
        string? bearer)
    {
        try
        {
            var message = new
            {
                RouteId = route.Id.ToString(),
                VehicleId = route.VehicleId?.ToString() ?? "",
                DriverId = route.DriverId?.ToString() ?? "",
                MachineryType = machineryType, // 0 = LIVIANO, 1 = PESADO
                EstimatedFuelConsumptionLiters = route.EstimatedFuelConsumptionLiters ?? 0,
                RealFuelConsumptionLiters = route.RealFuelConsumptionLiters ?? 0,
                RealDistanceKm = route.RealDistanceKm ?? 0,
                CompletedAt = route.CompletedAt?.ToString("O") ?? DateTimeOffset.UtcNow.ToString("O")
            };
            
            await _publisher.PublishAsync(message);
            Log.Information("✅ Mensaje de consumo de combustible publicado en RabbitMQ para ruta {RouteId}", route.Id);
            return true;
        }
        catch (Exception ex)
        {
            Log.Error(ex, "❌ Error al publicar consumo de combustible en RabbitMQ para ruta {RouteId}", route.Id);
            return false;
        }
    }
}

