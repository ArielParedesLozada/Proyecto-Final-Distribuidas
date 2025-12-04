namespace FuelService.Domain.Events;

/// <summary>
/// Mensaje enviado desde RouteService cuando se completa una ruta
/// </summary>
public class FuelConsumptionMessage
{
    public string RouteId { get; set; } = string.Empty;
    public string VehicleId { get; set; } = string.Empty;
    public string DriverId { get; set; } = string.Empty;
    public int MachineryType { get; set; } // 0 = LIVIANO, 1 = PESADO
    public double EstimatedFuelConsumptionLiters { get; set; }
    public double RealFuelConsumptionLiters { get; set; }
    public double RealDistanceKm { get; set; }
    public string CompletedAt { get; set; } = string.Empty; // ISO 8601 format
}

