namespace FuelService.Infraestructure.Reports;

public class ReportByDriverResult
{
    public List<DriverReportModel> Reports { get; set; } = new();
    public double TotalEstimatedConsumption { get; set; }
    public double TotalRealConsumption { get; set; }
    public double TotalDistanceKm { get; set; }
    public int TotalRegisters { get; set; }
}