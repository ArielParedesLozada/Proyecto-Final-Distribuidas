using FuelService.Domain.Entities;
using FuelService.Infraestructure.Reports;

namespace FuelService.Infraestructure.Mapping;

public static class FuelRegisterToConsumptionComparisonMapper
{
    /// <summary>
    /// Crea una lista de ítems detallados para comparación de consumo.
    /// </summary>
    public static List<ConsumptionComparisonItemModel> Map(IEnumerable<FuelRegister> registers)
    {
        return registers
            .Select(r =>
            {
                double diff = r.RealFuelConsumptionLiters - r.EstimatedFuelConsumptionLiters;
                double diffPercentage = r.EstimatedFuelConsumptionLiters > 0
                    ? (diff / r.EstimatedFuelConsumptionLiters) * 100
                    : 0;

                return new ConsumptionComparisonItemModel
                {
                    RouteId = r.RouteId.ToString(),
                    MachineryType = r.VehicleMachinery,
                    EstimatedConsumption = r.EstimatedFuelConsumptionLiters,
                    RealConsumption = r.RealFuelConsumptionLiters,
                    DistanceKm = r.RealDistanceKm,
                    DifferenceLiters = diff,
                    DifferencePercentage = diffPercentage,
                    CompletedAt = r.CompletedAt
                };
            })
            .ToList();
    }

    /// <summary>
    /// Genera un resumen total del consumo.
    /// </summary>
    public static ComparisonSummaryModel Summarize(IEnumerable<FuelRegister> registers)
    {
        var list = registers.ToList();

        double totalEstimated = list.Sum(r => r.EstimatedFuelConsumptionLiters);
        double totalReal = list.Sum(r => r.RealFuelConsumptionLiters);
        double diff = totalReal - totalEstimated;

        // Promedio de diferencias porcentuales por ruta
        double avgDiffPercentage = list.Count > 0
            ? list.Average(r =>
            {
                double routeDiff = r.RealFuelConsumptionLiters - r.EstimatedFuelConsumptionLiters;
                return r.EstimatedFuelConsumptionLiters > 0
                    ? (routeDiff / r.EstimatedFuelConsumptionLiters) * 100
                    : 0;
            })
            : 0;

        int overEstimate = list.Count(r => r.RealFuelConsumptionLiters > r.EstimatedFuelConsumptionLiters);
        int underEstimate = list.Count(r => r.RealFuelConsumptionLiters < r.EstimatedFuelConsumptionLiters);

        return new ComparisonSummaryModel
        {
            TotalEstimated = totalEstimated,
            TotalReal = totalReal,
            TotalDifference = diff,
            AverageDifferencePercentage = avgDiffPercentage,
            TotalRoutes = list.Count,
            RoutesOverEstimate = overEstimate,
            RoutesUnderEstimate = underEstimate
        };
    }
}
