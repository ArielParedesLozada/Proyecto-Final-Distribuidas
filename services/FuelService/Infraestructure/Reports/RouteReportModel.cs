using FuelService.Domain.Entities;

namespace FuelService.Infraestructure.Reports;

public class RouteReportModel
{
    public string RouteId { get; set; } = "";
    public string VehicleId { get; set; } = "";
    public string DriverId { get; set; } = "";
    public VehicleMachineryTypes MachineryType { get; set; }
    public double EstimatedConsumption { get; set; }
    public double RealConsumption { get; set; }
    public double DistanceKm { get; set; }
    public double DifferenceLiters { get; set; }
    public double DifferencePercentage { get; set; }
    public DateTimeOffset CompletedAt { get; set; }
}