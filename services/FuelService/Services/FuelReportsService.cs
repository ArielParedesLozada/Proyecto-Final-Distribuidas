using FuelService.Data.Databases;
using FuelService.Data.Repository;
using FuelService.Domain.Entities;
using FuelService.Proto;
using Grpc.Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace FuelService.Services;

public class FuelReportsService : FuelService.Proto.FuelService.FuelServiceBase
{
    private readonly AppDatabase _db;
    private readonly IRepository<FuelRegister, Guid> _repository;

    public FuelReportsService(AppDatabase db, IRepository<FuelRegister, Guid> repository)
    {
        _db = db;
        _repository = repository;
    }

    [Authorize(Policy = "ADMIN-OR-SUPERVISOR")]
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

    [Authorize(Policy = "ADMIN-OR-SUPERVISOR")]
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

    [Authorize(Policy = "ADMIN-OR-SUPERVISOR")]
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

    // Registrar consumo de combustible cuando se completa una ruta
    // Permitir que RouteService lo llame (requiere autenticación pero no rol específico)
    [Authorize] // Solo requiere autenticación, no rol específico
    public override async Task<RegisterFuelConsumptionResponse> RegisterFuelConsumption(
        RegisterFuelConsumptionRequest request,
        ServerCallContext context)
    {
        try
        {
            // Verificar si ya existe un registro para esta ruta
            var existing = await _db.FuelRegisters
                .FirstOrDefaultAsync(r => r.RouteId == Guid.Parse(request.RouteId));

            if (existing != null)
            {
                // Actualizar registro existente
                existing.VehicleId = !string.IsNullOrEmpty(request.VehicleId) ? Guid.Parse(request.VehicleId) : existing.VehicleId;
                existing.DriverId = !string.IsNullOrEmpty(request.DriverId) ? Guid.Parse(request.DriverId) : existing.DriverId;
                existing.VehicleMachinery = (VehicleMachineryTypes)(int)request.MachineryType;
                existing.EstimatedFuelConsumptionLiters = request.EstimatedFuelConsumptionLiters;
                existing.RealFuelConsumptionLiters = request.RealFuelConsumptionLiters;
                existing.RealDistanceKm = request.RealDistanceKm;
                if (DateTimeOffset.TryParse(request.CompletedAt, out var completedAt))
                {
                    existing.CompletedAt = completedAt;
                }
                existing.Timestamp = DateTimeOffset.UtcNow;

                await _repository.UpdateAsync(existing);

                return new RegisterFuelConsumptionResponse
                {
                    Id = existing.Id.ToString(),
                    Success = true,
                    Message = "Registro actualizado correctamente"
                };
            }
            else
            {
                // Crear nuevo registro
                var fuelRegister = new FuelRegister
                {
                    Id = Guid.NewGuid(),
                    RouteId = Guid.Parse(request.RouteId),
                    VehicleId = !string.IsNullOrEmpty(request.VehicleId) ? Guid.Parse(request.VehicleId) : null,
                    DriverId = !string.IsNullOrEmpty(request.DriverId) ? Guid.Parse(request.DriverId) : null,
                    VehicleMachinery = (VehicleMachineryTypes)(int)request.MachineryType,
                    Type = FuelRegisterType.NORMAL,
                    EstimatedFuelConsumptionLiters = request.EstimatedFuelConsumptionLiters,
                    RealFuelConsumptionLiters = request.RealFuelConsumptionLiters,
                    RealDistanceKm = request.RealDistanceKm,
                    Timestamp = DateTimeOffset.UtcNow
                };

                if (DateTimeOffset.TryParse(request.CompletedAt, out var completedAt))
                {
                    fuelRegister.CompletedAt = completedAt;
                }
                else
                {
                    fuelRegister.CompletedAt = DateTimeOffset.UtcNow;
                }

                var created = await _repository.CreateAsync(fuelRegister);

                return new RegisterFuelConsumptionResponse
                {
                    Id = created.Id.ToString(),
                    Success = true,
                    Message = "Registro creado correctamente"
                };
            }
        }
        catch (Exception ex)
        {
            return new RegisterFuelConsumptionResponse
            {
                Id = "",
                Success = false,
                Message = $"Error al registrar consumo: {ex.Message}"
            };
        }
    }

    [Authorize(Policy = "ADMIN-OR-SUPERVISOR")]
    public override async Task<ReportByVehicleResponse> GetReportByVehicle(
        ReportByVehicleRequest request,
        ServerCallContext context)
    {
        var query = _db.FuelRegisters.AsQueryable();

        // Filtrar por vehículo si se especifica
        if (!string.IsNullOrEmpty(request.VehicleId))
        {
            if (Guid.TryParse(request.VehicleId, out var vehicleId))
            {
                query = query.Where(f => f.VehicleId == vehicleId);
            }
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

        // Agrupar por vehículo
        var grouped = registers
            .Where(r => r.VehicleId.HasValue)
            .GroupBy(r => r.VehicleId.Value)
            .Select(g => new VehicleReport
            {
                VehicleId = g.Key.ToString(),
                RouteCount = g.Count(),
                TotalEstimatedConsumption = g.Sum(r => r.EstimatedFuelConsumptionLiters),
                TotalRealConsumption = g.Sum(r => r.RealFuelConsumptionLiters),
                TotalDistanceKm = g.Sum(r => r.RealDistanceKm),
                AverageConsumptionPerKm = g.Sum(r => r.RealDistanceKm) > 0
                    ? g.Sum(r => r.RealFuelConsumptionLiters) / g.Sum(r => r.RealDistanceKm)
                    : 0,
                DifferenceLiters = g.Sum(r => r.RealFuelConsumptionLiters) - g.Sum(r => r.EstimatedFuelConsumptionLiters),
                DifferencePercentage = g.Sum(r => r.EstimatedFuelConsumptionLiters) > 0
                    ? ((g.Sum(r => r.RealFuelConsumptionLiters) - g.Sum(r => r.EstimatedFuelConsumptionLiters)) / g.Sum(r => r.EstimatedFuelConsumptionLiters)) * 100
                    : 0
            }).ToList();

        return new ReportByVehicleResponse
        {
            Reports = { grouped },
            TotalEstimatedConsumption = registers.Sum(r => r.EstimatedFuelConsumptionLiters),
            TotalRealConsumption = registers.Sum(r => r.RealFuelConsumptionLiters),
            TotalDistanceKm = registers.Sum(r => r.RealDistanceKm),
            TotalRegisters = registers.Count
        };
    }

    [Authorize(Policy = "ADMIN-OR-SUPERVISOR")]
    public override async Task<ReportByDriverResponse> GetReportByDriver(
        ReportByDriverRequest request,
        ServerCallContext context)
    {
        var query = _db.FuelRegisters.AsQueryable();

        // Filtrar por chofer si se especifica
        if (!string.IsNullOrEmpty(request.DriverId))
        {
            if (Guid.TryParse(request.DriverId, out var driverId))
            {
                query = query.Where(f => f.DriverId == driverId);
            }
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

        // Agrupar por chofer
        var grouped = registers
            .Where(r => r.DriverId.HasValue)
            .GroupBy(r => r.DriverId.Value)
            .Select(g => new DriverReport
            {
                DriverId = g.Key.ToString(),
                RouteCount = g.Count(),
                TotalEstimatedConsumption = g.Sum(r => r.EstimatedFuelConsumptionLiters),
                TotalRealConsumption = g.Sum(r => r.RealFuelConsumptionLiters),
                TotalDistanceKm = g.Sum(r => r.RealDistanceKm),
                AverageConsumptionPerKm = g.Sum(r => r.RealDistanceKm) > 0
                    ? g.Sum(r => r.RealFuelConsumptionLiters) / g.Sum(r => r.RealDistanceKm)
                    : 0,
                DifferenceLiters = g.Sum(r => r.RealFuelConsumptionLiters) - g.Sum(r => r.EstimatedFuelConsumptionLiters),
                DifferencePercentage = g.Sum(r => r.EstimatedFuelConsumptionLiters) > 0
                    ? ((g.Sum(r => r.RealFuelConsumptionLiters) - g.Sum(r => r.EstimatedFuelConsumptionLiters)) / g.Sum(r => r.EstimatedFuelConsumptionLiters)) * 100
                    : 0
            }).ToList();

        return new ReportByDriverResponse
        {
            Reports = { grouped },
            TotalEstimatedConsumption = registers.Sum(r => r.EstimatedFuelConsumptionLiters),
            TotalRealConsumption = registers.Sum(r => r.RealFuelConsumptionLiters),
            TotalDistanceKm = registers.Sum(r => r.RealDistanceKm),
            TotalRegisters = registers.Count
        };
    }

    [Authorize(Policy = "ADMIN-OR-SUPERVISOR")]
    public override async Task<ReportByRouteResponse> GetReportByRoute(
        ReportByRouteRequest request,
        ServerCallContext context)
    {
        var query = _db.FuelRegisters.AsQueryable();

        // Filtrar por ruta si se especifica
        if (!string.IsNullOrEmpty(request.RouteId))
        {
            if (Guid.TryParse(request.RouteId, out var routeId))
            {
                query = query.Where(f => f.RouteId == routeId);
            }
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

        var reports = registers.Select(r => new RouteReport
        {
            RouteId = r.RouteId.ToString(),
            VehicleId = r.VehicleId?.ToString() ?? "",
            DriverId = r.DriverId?.ToString() ?? "",
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

        return new ReportByRouteResponse
        {
            Reports = { reports },
            TotalEstimatedConsumption = registers.Sum(r => r.EstimatedFuelConsumptionLiters),
            TotalRealConsumption = registers.Sum(r => r.RealFuelConsumptionLiters),
            TotalDistanceKm = registers.Sum(r => r.RealDistanceKm),
            TotalRegisters = registers.Count
        };
    }
}

