namespace FuelService.Infraestructure.Reports;

public class GeneralConsumptionReportResult
{
    public GeneralReportSummaryModel Summary { get; set; } = new();
    public List<MachineryTypeReportModel> ByMachinery { get; set; } = new();
    public List<DailyConsumptionModel> DailyConsumption { get; set; } = new();
}