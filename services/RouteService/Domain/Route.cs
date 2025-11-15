namespace RouteService.Domain;

public enum RouteStates
{
    Unassigned = 0,
    Assigned = 1,
    Started = 2,
    Completed = 3,
}
public class Route
{
    public Guid Id { get; set; }
    public Guid? DriverVehicleId { get; set; }
    public DateTimeOffset? AssignedAt { get; set; }
    public string OriginName { get; set; } = string.Empty;
    public string DestinationName { get; set; } = string.Empty;
    public RouteStates Status { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public required Coordinate CoordinatesStart { get; set; }
    public required Coordinate CoordinatesStop { get; set; }
    public double EstimatedDistanceKm { get; set; }
    public double? RealDistanceKm { get; set; }

    public double? EstimatedFuelConsumptionLiters { get; set; }
    public double? RealFuelConsumptionLiters { get; set; }
}