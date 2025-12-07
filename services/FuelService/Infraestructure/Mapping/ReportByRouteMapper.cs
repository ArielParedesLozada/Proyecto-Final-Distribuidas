using FuelService.Domain.Entities;
using FuelService.Infraestructure.Reports;

public static class ReportByRouteMapper
{
    /// <summary>
    /// Mapea los registros individuales a reportes por ruta.
    /// Cada FuelRegister representa una ruta única.
    /// </summary>
    public static ReportByRouteResult MapReports(IEnumerable<FuelRegister> records)
    {
        var list = records.ToList();

        var routeReports = list
            .Select(r =>
            {
                var diff = r.RealFuelConsumptionLiters - r.EstimatedFuelConsumptionLiters;

                return new RouteReportModel
                {
                    RouteId = r.RouteId.ToString(),
                    VehicleId = r.VehicleId.ToString(),
                    DriverId = r.DriverId.ToString(),
                    MachineryType = r.VehicleMachinery,
                    EstimatedConsumption = r.EstimatedFuelConsumptionLiters,
                    RealConsumption = r.RealFuelConsumptionLiters,
                    DistanceKm = r.RealDistanceKm,
                    DifferenceLiters = diff,
                    DifferencePercentage = r.EstimatedFuelConsumptionLiters > 0
                        ? (diff / r.EstimatedFuelConsumptionLiters) * 100.0
                        : 0,
                    CompletedAt = r.CompletedAt
                };
            })
            .OrderByDescending(r => r.CompletedAt) // puedes cambiarlo si quieres
            .ToList();

        return new ReportByRouteResult
        {
            Reports = routeReports,
            TotalEstimatedConsumption = list.Sum(r => r.EstimatedFuelConsumptionLiters),
            TotalRealConsumption = list.Sum(r => r.RealFuelConsumptionLiters),
            TotalDistanceKm = list.Sum(r => r.RealDistanceKm),
            TotalRegisters = list.Count
        };
    }
}
