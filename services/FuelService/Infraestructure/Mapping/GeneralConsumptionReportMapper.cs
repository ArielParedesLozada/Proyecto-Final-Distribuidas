using FuelService.Domain.Entities;
using FuelService.Infraestructure.Reports;

namespace FuelService.Infraestructure.Mapping;

public static class GeneralConsumptionReportMapper
{
    /// <summary>
    /// Agrupa los registros por tipo de maquinaria y genera las métricas.
    /// </summary>
    public static List<MachineryTypeReportModel> MapMachinery(IEnumerable<FuelRegister> records)
    {
        return [.. records
            .GroupBy(r => r.VehicleMachinery)
            .Select(g =>
            {
                var totalEstimated = g.Sum(x => x.EstimatedFuelConsumptionLiters);
                var totalReal = g.Sum(x => x.RealFuelConsumptionLiters);
                var totalKm = g.Sum(x => x.RealDistanceKm);
                var count = g.Count();
                var difference = totalReal - totalEstimated;

                return new MachineryTypeReportModel
                {
                    MachineryType = g.Key,
                    TotalEstimatedConsumption = totalEstimated,
                    TotalRealConsumption = totalReal,
                    TotalDistanceKm = totalKm,
                    RegisterCount = count,
                    AverageConsumptionPerKm = totalKm > 0 ? totalReal / totalKm : 0,
                    DifferenceLiters = difference,
                    DifferencePercentage = totalEstimated > 0 ? (difference / totalEstimated) * 100 : 0
                };
            })
            .OrderBy(x => x.MachineryType)];
    }

    /// <summary>
    /// Genera el consumo agrupado por día.
    /// </summary>
    public static List<DailyConsumptionModel> MapDailyConsumption(IEnumerable<FuelRegister> records)
    {
        return [.. records
            .GroupBy(r => r.StartedAt.Date)
            .Select(g =>
            {
                var totalEstimated = g.Sum(x => x.EstimatedFuelConsumptionLiters);
                var totalReal = g.Sum(x => x.RealFuelConsumptionLiters);
                var totalKm = g.Sum(x => x.RealDistanceKm);

                return new DailyConsumptionModel
                {
                    Date = g.Key,
                    EstimatedConsumption = totalEstimated,
                    RealConsumption = totalReal,
                    DistanceKm = totalKm,
                    RegisterCount = g.Count()
                };
            })
            .OrderBy(x => x.Date)];
    }

    /// <summary>
    /// Genera un resumen total del reporte.
    /// </summary>
    public static GeneralReportSummaryModel Summarize(IEnumerable<FuelRegister> records)
    {
        var list = records.ToList();

        var totalEstimated = list.Sum(x => x.EstimatedFuelConsumptionLiters);
        var totalReal = list.Sum(x => x.RealFuelConsumptionLiters);
        var totalKm = list.Sum(x => x.RealDistanceKm);
        var totalRegisters = list.Count;
        var difference = totalReal - totalEstimated;

        return new GeneralReportSummaryModel
        {
            TotalEstimatedConsumption = totalEstimated,
            TotalRealConsumption = totalReal,
            TotalDistanceKm = totalKm,
            TotalRegisters = totalRegisters,
            AverageConsumptionPerKm = totalKm > 0 ? totalReal / totalKm : 0,
            TotalDifference = difference,
            AverageDifferencePercentage = totalEstimated > 0 ? (difference / totalEstimated) * 100 : 0
        };
    }
}
