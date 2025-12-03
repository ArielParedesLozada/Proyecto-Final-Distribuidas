namespace FuelService.Domain.Entities;

public enum VehicleMachineryTypes
{
    LIVIANO = 0,
    PESADO = 1,
}
public enum FuelRegisterType
{
    NORMAL = 0,
    WARNING = 1,
    DANGER = 2,
}
public class FuelRegister
{
    public Guid Id { get; set; }
    public Guid RouteId { get; set; }
    public VehicleMachineryTypes VehicleMachinery { get; set; }
    public FuelRegisterType Type { get; set; }
    public DateTimeOffset CompletedAt { get; set; }
    public DateTimeOffset Timestamp { get; set; }
    public double EstimatedFuelConsumptionLiters { get; set; }
    public double RealFuelConsumptionLiters { get; set; }
    public double RealDistanceKm { get; set; }
}