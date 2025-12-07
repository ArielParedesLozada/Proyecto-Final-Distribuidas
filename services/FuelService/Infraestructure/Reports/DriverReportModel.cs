namespace FuelService.Infraestructure.Reports;

public class DriverReportModel
{
    public string DriverId { get; set; } = "";
    public int RouteCount { get; set; }
    public double TotalEstimatedConsumption { get; set; }
    public double TotalRealConsumption { get; set; }
    public double TotalDistanceKm { get; set; }
    public double AverageConsumptionPerKm { get; set; }
    public double DifferenceLiters { get; set; }
    public double DifferencePercentage { get; set; }
}