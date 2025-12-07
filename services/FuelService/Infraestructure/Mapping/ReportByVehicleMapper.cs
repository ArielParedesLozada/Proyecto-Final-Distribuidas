using FuelService.Domain.Entities;
using FuelService.Infraestructure.Reports;

namespace FuelService.Infraestructure.Mapping;

public static class ReportByVehicleMapper
{
    /// <summary>
    /// Mapea los registros para generar un reporte agrupado por vehículo.
    /// </summary>
    public static ReportByVehicleResult MapReports(IEnumerable<FuelRegister> records)
    {
        var list = records.ToList();

        // Agrupación por vehículo
        var grouped = list
            .GroupBy(r => r.VehicleId)
            .Select(g =>
            {
                var totalEstimated = g.Sum(x => x.EstimatedFuelConsumptionLiters);
                var totalReal = g.Sum(x => x.RealFuelConsumptionLiters);
                var totalKm = g.Sum(x => x.RealDistanceKm);
                var difference = totalReal - totalEstimated;

                return new VehicleReportModel
                {
                    VehicleId = g.Key.ToString(),
                    RouteCount = g.Count(),
                    TotalEstimatedConsumption = totalEstimated,
                    TotalRealConsumption = totalReal,
                    TotalDistanceKm = totalKm,
                    AverageConsumptionPerKm = totalKm > 0 ? totalReal / totalKm : 0,
                    DifferenceLiters = difference,
                    DifferencePercentage = totalEstimated > 0 ? (difference / totalEstimated) * 100 : 0
                };
            })
            .OrderBy(r => r.VehicleId)
            .ToList();

        // Totales globales
        var result = new ReportByVehicleResult
        {
            Reports = grouped,
            TotalEstimatedConsumption = list.Sum(x => x.EstimatedFuelConsumptionLiters),
            TotalRealConsumption = list.Sum(x => x.RealFuelConsumptionLiters),
            TotalDistanceKm = list.Sum(x => x.RealDistanceKm),
            TotalRegisters = list.Count
        };

        return result;
    }
}
