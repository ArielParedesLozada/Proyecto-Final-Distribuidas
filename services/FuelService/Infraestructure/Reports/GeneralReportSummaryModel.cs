namespace FuelService.Infraestructure.Reports;

public class GeneralReportSummaryModel
{
    public double TotalEstimatedConsumption { get; set; }
    public double TotalRealConsumption { get; set; }
    public double TotalDistanceKm { get; set; }
    public int TotalRegisters { get; set; }
    public double AverageConsumptionPerKm { get; set; }
    public double TotalDifference { get; set; }
    public double AverageDifferencePercentage { get; set; }
}