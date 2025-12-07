using FuelService.Domain.Entities;
using FuelService.Infraestructure.Reports;

public static class ReportByDriverMapper
{
    /// <summary>
    /// Genera un reporte agrupado por conductor.
    /// </summary>
    public static ReportByDriverResult MapReports(IEnumerable<FuelRegister> records)
    {
        var list = records.ToList();

        var grouped = list
            .GroupBy(r => r.DriverId)
            .Select(g =>
            {
                var totalEstimated = g.Sum(x => x.EstimatedFuelConsumptionLiters);
                var totalReal = g.Sum(x => x.RealFuelConsumptionLiters);
                var totalKm = g.Sum(x => x.RealDistanceKm);
                var diff = totalReal - totalEstimated;

                return new DriverReportModel
                {
                    DriverId = g.Key.ToString(),
                    RouteCount = g.Count(),
                    TotalEstimatedConsumption = totalEstimated,
                    TotalRealConsumption = totalReal,
                    TotalDistanceKm = totalKm,
                    AverageConsumptionPerKm = totalKm > 0 ? totalReal / totalKm : 0,
                    DifferenceLiters = diff,
                    DifferencePercentage = totalEstimated > 0 ? (diff / totalEstimated) * 100.0 : 0
                };
            })
            .OrderBy(x => x.DriverId)
            .ToList();

        // Totales globales
        return new ReportByDriverResult
        {
            Reports = grouped,
            TotalEstimatedConsumption = list.Sum(r => r.EstimatedFuelConsumptionLiters),
            TotalRealConsumption = list.Sum(r => r.RealFuelConsumptionLiters),
            TotalDistanceKm = list.Sum(r => r.RealDistanceKm),
            TotalRegisters = list.Count
        };
    }
}
