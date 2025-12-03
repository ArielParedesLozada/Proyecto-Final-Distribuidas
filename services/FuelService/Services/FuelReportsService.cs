using FuelService.Data.Databases;
using FuelService.Data.Repository;
using FuelService.Domain.Entities;
using FuelService.Proto;
using Grpc.Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace FuelService.Services;

[Authorize(Policy = "ADMIN-OR-SUPERVISOR")]
public class FuelReportsService : FuelService.Proto.FuelService.FuelServiceBase
{
    private readonly AppDatabase _db;
    private readonly IRepository<FuelRegister, Guid> _repository;

    public FuelReportsService(AppDatabase db, IRepository<FuelRegister, Guid> repository)
    {
        _db = db;
        _repository = repository;
    }

    public override async Task<ReportByMachineryTypeResponse> GetReportByMachineryType(
        ReportByMachineryTypeRequest request,
        ServerCallContext context)
    {
        var query = _db.FuelRegisters.AsQueryable();

        // Filtrar por tipo de maquinaria si se especifica
        if (request.HasMachineryType)
        {
            var machineryType = (VehicleMachineryTypes)(int)request.MachineryType;
            query = query.Where(f => f.VehicleMachinery == machineryType);
        }

        // Filtrar por fechas si se especifican
        if (!string.IsNullOrEmpty(request.StartDate))
        {
            if (DateTimeOffset.TryParse(request.StartDate, out var startDate))
            {
                query = query.Where(f => f.CompletedAt >= startDate);
            }
        }

        if (!string.IsNullOrEmpty(request.EndDate))
        {
            if (DateTimeOffset.TryParse(request.EndDate, out var endDate))
            {
                query = query.Where(f => f.CompletedAt <= endDate);
            }
        }

        var registers = await query.ToListAsync();

        // Agrupar por tipo de maquinaria
        var grouped = registers
            .GroupBy(r => r.VehicleMachinery)
            .Select(g => new
            {
                MachineryType = g.Key,
                TotalEstimated = g.Sum(r => r.EstimatedFuelConsumptionLiters),
                TotalReal = g.Sum(r => r.RealFuelConsumptionLiters),
                TotalDistance = g.Sum(r => r.RealDistanceKm),
                Count = g.Count(),
                AvgConsumptionPerKm = g.Sum(r => r.RealDistanceKm) > 0
                    ? g.Sum(r => r.RealFuelConsumptionLiters) / g.Sum(r => r.RealDistanceKm)
                    : 0,
                Difference = g.Sum(r => r.RealFuelConsumptionLiters) - g.Sum(r => r.EstimatedFuelConsumptionLiters),
                DifferencePercentage = g.Sum(r => r.EstimatedFuelConsumptionLiters) > 0
                    ? ((g.Sum(r => r.RealFuelConsumptionLiters) - g.Sum(r => r.EstimatedFuelConsumptionLiters)) / g.Sum(r => r.EstimatedFuelConsumptionLiters)) * 100
                    : 0
            })
            .ToList();

        var reports = grouped.Select(g => new MachineryTypeReport
        {
            MachineryType = (FuelService.Proto.VehicleMachineryType)g.MachineryType,
            TotalEstimatedConsumption = g.TotalEstimated,
            TotalRealConsumption = g.TotalReal,
            TotalDistanceKm = g.TotalDistance,
            RegisterCount = g.Count,
            AverageConsumptionPerKm = g.AvgConsumptionPerKm,
            DifferenceLiters = g.Difference,
            DifferencePercentage = g.DifferencePercentage
        }).ToList();

        return new ReportByMachineryTypeResponse
        {
            Reports = { reports },
            TotalEstimatedConsumption = registers.Sum(r => r.EstimatedFuelConsumptionLiters),
            TotalRealConsumption = registers.Sum(r => r.RealFuelConsumptionLiters),
            TotalDistanceKm = registers.Sum(r => r.RealDistanceKm),
            TotalRegisters = registers.Count
        };
    }

    public override async Task<ConsumptionComparisonResponse> GetConsumptionComparison(
        ConsumptionComparisonRequest request,
        ServerCallContext context)
    {
        var query = _db.FuelRegisters.AsQueryable();

        // Filtrar por tipo de maquinaria si se especifica
        if (request.HasMachineryType)
        {
            var machineryType = (VehicleMachineryTypes)(int)request.MachineryType;
            query = query.Where(f => f.VehicleMachinery == machineryType);
        }

        // Filtrar por fechas si se especifican
        if (!string.IsNullOrEmpty(request.StartDate))
        {
            if (DateTimeOffset.TryParse(request.StartDate, out var startDate))
            {
                query = query.Where(f => f.CompletedAt >= startDate);
            }
        }

        if (!string.IsNullOrEmpty(request.EndDate))
        {
            if (DateTimeOffset.TryParse(request.EndDate, out var endDate))
            {
                query = query.Where(f => f.CompletedAt <= endDate);
            }
        }

        var registers = await query
            .OrderByDescending(r => r.CompletedAt)
            .ToListAsync();

        var items = registers.Select(r => new ConsumptionComparisonItem
        {
            RouteId = r.RouteId.ToString(),
            MachineryType = (FuelService.Proto.VehicleMachineryType)r.VehicleMachinery,
            EstimatedConsumption = r.EstimatedFuelConsumptionLiters,
            RealConsumption = r.RealFuelConsumptionLiters,
            DistanceKm = r.RealDistanceKm,
            DifferenceLiters = r.RealFuelConsumptionLiters - r.EstimatedFuelConsumptionLiters,
            DifferencePercentage = r.EstimatedFuelConsumptionLiters > 0
                ? ((r.RealFuelConsumptionLiters - r.EstimatedFuelConsumptionLiters) / r.EstimatedFuelConsumptionLiters) * 100
                : 0,
            CompletedAt = r.CompletedAt.ToString("O")
        }).ToList();

        var totalEstimated = registers.Sum(r => r.EstimatedFuelConsumptionLiters);
        var totalReal = registers.Sum(r => r.RealFuelConsumptionLiters);
        var totalDifference = totalReal - totalEstimated;
        var avgDifferencePercentage = registers.Count > 0 && totalEstimated > 0
            ? (totalDifference / totalEstimated) * 100
            : 0;

        var routesOverEstimate = registers.Count(r => r.RealFuelConsumptionLiters > r.EstimatedFuelConsumptionLiters);
        var routesUnderEstimate = registers.Count(r => r.RealFuelConsumptionLiters < r.EstimatedFuelConsumptionLiters);

        var summary = new ComparisonSummary
        {
            TotalEstimated = totalEstimated,
            TotalReal = totalReal,
            TotalDifference = totalDifference,
            AverageDifferencePercentage = avgDifferencePercentage,
            TotalRoutes = registers.Count,
            RoutesOverEstimate = routesOverEstimate,
            RoutesUnderEstimate = routesUnderEstimate
        };

        return new ConsumptionComparisonResponse
        {
            Items = { items },
            Summary = summary
        };
    }

    public override async Task<GeneralConsumptionReportResponse> GetGeneralConsumptionReport(
        GeneralConsumptionReportRequest request,
        ServerCallContext context)
    {
        var query = _db.FuelRegisters.AsQueryable();

        // Filtrar por fechas si se especifican
        if (!string.IsNullOrEmpty(request.StartDate))
        {
            if (DateTimeOffset.TryParse(request.StartDate, out var startDate))
            {
                query = query.Where(f => f.CompletedAt >= startDate);
            }
        }

        if (!string.IsNullOrEmpty(request.EndDate))
        {
            if (DateTimeOffset.TryParse(request.EndDate, out var endDate))
            {
                query = query.Where(f => f.CompletedAt <= endDate);
            }
        }

        var registers = await query.ToListAsync();

        // Resumen general
        var totalEstimated = registers.Sum(r => r.EstimatedFuelConsumptionLiters);
        var totalReal = registers.Sum(r => r.RealFuelConsumptionLiters);
        var totalDistance = registers.Sum(r => r.RealDistanceKm);
        var totalDifference = totalReal - totalEstimated;
        var avgConsumptionPerKm = totalDistance > 0 ? totalReal / totalDistance : 0;
        var avgDifferencePercentage = totalEstimated > 0 ? (totalDifference / totalEstimated) * 100 : 0;

        var summary = new GeneralReportSummary
        {
            TotalEstimatedConsumption = totalEstimated,
            TotalRealConsumption = totalReal,
            TotalDistanceKm = totalDistance,
            TotalRegisters = registers.Count,
            AverageConsumptionPerKm = avgConsumptionPerKm,
            TotalDifference = totalDifference,
            AverageDifferencePercentage = avgDifferencePercentage
        };

        // Por tipo de maquinaria
        var byMachinery = registers
            .GroupBy(r => r.VehicleMachinery)
            .Select(g => new MachineryTypeReport
            {
                MachineryType = (FuelService.Proto.VehicleMachineryType)g.Key,
                TotalEstimatedConsumption = g.Sum(r => r.EstimatedFuelConsumptionLiters),
                TotalRealConsumption = g.Sum(r => r.RealFuelConsumptionLiters),
                TotalDistanceKm = g.Sum(r => r.RealDistanceKm),
                RegisterCount = g.Count(),
                AverageConsumptionPerKm = g.Sum(r => r.RealDistanceKm) > 0
                    ? g.Sum(r => r.RealFuelConsumptionLiters) / g.Sum(r => r.RealDistanceKm)
                    : 0,
                DifferenceLiters = g.Sum(r => r.RealFuelConsumptionLiters) - g.Sum(r => r.EstimatedFuelConsumptionLiters),
                DifferencePercentage = g.Sum(r => r.EstimatedFuelConsumptionLiters) > 0
                    ? ((g.Sum(r => r.RealFuelConsumptionLiters) - g.Sum(r => r.EstimatedFuelConsumptionLiters)) / g.Sum(r => r.EstimatedFuelConsumptionLiters)) * 100
                    : 0
            }).ToList();

        // Por día
        var dailyConsumption = registers
            .GroupBy(r => r.CompletedAt.Date)
            .Select(g => new DailyConsumption
            {
                Date = g.Key.ToString("yyyy-MM-dd"),
                EstimatedConsumption = g.Sum(r => r.EstimatedFuelConsumptionLiters),
                RealConsumption = g.Sum(r => r.RealFuelConsumptionLiters),
                DistanceKm = g.Sum(r => r.RealDistanceKm),
                RegisterCount = g.Count()
            })
            .OrderBy(d => d.Date)
            .ToList();

        return new GeneralConsumptionReportResponse
        {
            Summary = summary,
            ByMachinery = { byMachinery },
            DailyConsumption = { dailyConsumption }
        };
    }
}

