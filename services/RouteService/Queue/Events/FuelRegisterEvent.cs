namespace RouteService.Queue.Events;

public enum VehicleMachineryTypes
{
    LIVIANO = 0,
    PESADO = 1,
}
public class FuelRegisterEvent
{
    public Guid Id { get; set; }
    public Guid RouteId { get; set; }
    public Guid DriverId { get; set; }
    public Guid VehicleId { get; set; }
    public VehicleMachineryTypes VehicleMachinery { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset CompletedAt { get; set; }
    public DateTimeOffset Timestamp { get; set; }
    public double EstimatedFuelConsumptionLiters { get; set; }
    public double RealFuelConsumptionLiters { get; set; }
    public double RealDistanceKm { get; set; }
}