namespace RouteService.Domain;

public class Route
{
    public Guid Id { get; set; }
    public Guid? DriverVehicleId { get; set; }
    public DateTimeOffset? AssignedAt { get; set; }
    public string OriginName { get; set; } = string.Empty;
    public string DestinationName { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public Coordinate CoordinatesStart { get; set; }
    public Coordinate CoordinatesStop { get; set; }
    public double DistanceKm { get; set; }
    public double? EstimatedFuelConsumptionLiters { get; set; }
    public double? RealFuelConsumptionLiters { get; set; }
    public void CalculateEstimatedConsumption(double averageConsumptionPerKm)
    {
        if (DistanceKm <= 0)
            throw new InvalidOperationException("Distance must be greater than zero.");

        EstimatedFuelConsumptionLiters = DistanceKm * averageConsumptionPerKm;
    }
}