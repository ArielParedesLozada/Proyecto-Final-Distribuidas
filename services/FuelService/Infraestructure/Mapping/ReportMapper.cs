using FuelService.Domain.Entities;
using FuelService.Infraestructure.Reports;

namespace FuelService.Infraestructure.Mapping;

public static class FuelRegisterToMachineryReportMapper
{
    public static List<MachineryTypeReportModel> MapFuelRegisterToReport(IEnumerable<FuelRegister> registers)
    {
        var grouped = registers
            .GroupBy(r => r.VehicleMachinery)
            .Select(g =>
            {
                double totalEstimated = g.Sum(x => x.EstimatedFuelConsumptionLiters);
                double totalReal = g.Sum(x => x.RealFuelConsumptionLiters);
                double totalDistance = g.Sum(x => x.RealDistanceKm);

                double difference = totalReal - totalEstimated;
                double avgPerKm = totalDistance > 0 ? totalReal / totalDistance : 0;
                double diffPercentage = totalEstimated > 0
                    ? (difference / totalEstimated) * 100
                    : 0;

                return new MachineryTypeReportModel
                {
                    MachineryType = g.Key,
                    RegisterCount = g.Count(),
                    TotalEstimatedConsumption = totalEstimated,
                    TotalRealConsumption = totalReal,
                    TotalDistanceKm = totalDistance,
                    AverageConsumptionPerKm = avgPerKm,
                    DifferenceLiters = difference,
                    DifferencePercentage = diffPercentage
                };
            })
            .ToList();

        return grouped;
    }
}
