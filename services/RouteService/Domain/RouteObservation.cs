namespace RouteService.Domain;

public class RouteObservation
{
    public Guid Id { get; set; }
    public Guid RouteId { get; set; }
    public string Text { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; } // DriverId que creó la observación
}

