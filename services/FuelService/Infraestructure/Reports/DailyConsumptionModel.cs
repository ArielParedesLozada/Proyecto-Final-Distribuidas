namespace FuelService.Infraestructure.Reports;

public class DailyConsumptionModel
{
    public DateTime Date { get; set; }
    public double EstimatedConsumption { get; set; }
    public double RealConsumption { get; set; }
    public double DistanceKm { get; set; }
    public int RegisterCount { get; set; }
}