using FuelService.Domain.Entities;

namespace FuelService.Infraestructure.Reports;

public class MachineryTypeReportModel
{
    public VehicleMachineryTypes MachineryType { get; set; }
    public double TotalEstimatedConsumption { get; set; }
    public double TotalRealConsumption { get; set; }
    public double TotalDistanceKm { get; set; }
    public int RegisterCount { get; set; }
    public double AverageConsumptionPerKm { get; set; }
    public double DifferenceLiters { get; set; }
    public double DifferencePercentage { get; set; }
}