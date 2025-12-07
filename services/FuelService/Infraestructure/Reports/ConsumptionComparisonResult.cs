namespace FuelService.Infraestructure.Reports;

public class ConsumptionComparisonResult
{
    public List<ConsumptionComparisonItemModel> Items { get; set; } = new();
    public ComparisonSummaryModel Summary { get; set; } = new();
}