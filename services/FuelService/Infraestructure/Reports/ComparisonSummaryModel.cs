namespace FuelService.Infraestructure.Reports;
public class ComparisonSummaryModel
{
    public double TotalEstimated { get; set; }
    public double TotalReal { get; set; }
    public double TotalDifference { get; set; }
    public double AverageDifferencePercentage { get; set; }
    public int TotalRoutes { get; set; }
    public int RoutesOverEstimate { get; set; }
    public int RoutesUnderEstimate { get; set; }
}
