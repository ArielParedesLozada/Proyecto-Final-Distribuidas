using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using FuelService.Domain.Entities;
using FuelService.Data.Repository;
using FuelService.Infraestructure.Reports;
using FuelService.Infraestructure.Mapping;
using System.Linq.Expressions;

namespace FuelService.Presentation;

[ApiController]
[Route("api/fuel")]
public class FuelReportsController : ControllerBase
{
    private readonly IRepository<FuelRegister, Guid> _repository;
    private readonly ILogger<FuelReportsController> _logger;

    public FuelReportsController(
        IRepository<FuelRegister, Guid> repository,
        ILogger<FuelReportsController> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    // -----------------------------------------------------------
    //  HELPERS PARA FECHAS (EF Core Compatible)
    // -----------------------------------------------------------
    private static void ParseDates(string? start, string? end, out DateTimeOffset? startDate, out DateTimeOffset? endDate)
    {
        startDate = DateTimeOffset.TryParse(start, out var s) ? s : null;
        endDate = DateTimeOffset.TryParse(end, out var e) ? e : null;
    }

    private static Expression<Func<FuelRegister, bool>> BuildDatePredicate(DateTimeOffset? start, DateTimeOffset? end)
    {
        return r =>
            (!start.HasValue || r.StartedAt >= start.Value) &&
            (!end.HasValue || r.CompletedAt <= end.Value);
    }

    // -----------------------------------------------------------
    //  GET /api/fuel/reports/machinery-type
    // -----------------------------------------------------------
    [HttpGet("reports/machinery-type")]
    [Authorize(Policy = "ADMIN-OR-SUPERVISOR")]
    public async Task<ActionResult<ReportByMachineryTypeResult>> GetReportByMachineryType(
        [FromQuery] VehicleMachineryTypes? machinery_type,
        [FromQuery] string? start_date,
        [FromQuery] string? end_date)
    {
        ParseDates(start_date, end_date, out var start, out var end);

        Expression<Func<FuelRegister, bool>> predicate =
            r => r.VehicleMachinery == machinery_type &&
                 (!start.HasValue || r.StartedAt >= start.Value) &&
                 (!end.HasValue || r.CompletedAt <= end.Value);

        var results = await _repository.FindAsync(predicate);

        var reports = FuelRegisterToMachineryReportMapper.MapFuelRegisterToReport(results);

        return Ok(new ReportByMachineryTypeResult
        {
            Reports = reports,
            TotalEstimatedConsumption = results.Sum(r => r.EstimatedFuelConsumptionLiters),
            TotalRealConsumption = results.Sum(r => r.RealFuelConsumptionLiters),
            TotalDistanceKm = results.Sum(r => r.RealDistanceKm),
            TotalRegisters = results.Count()
        });
    }

    // -----------------------------------------------------------
    //  GET /api/fuel/reports/consumption-comparison
    // -----------------------------------------------------------
    [HttpGet("reports/consumption-comparison")]
    [Authorize(Policy = "ADMIN-OR-SUPERVISOR")]
    public async Task<ActionResult<ConsumptionComparisonResult>> GetConsumptionComparison(
        [FromQuery] VehicleMachineryTypes? machinery_type,
        [FromQuery] string? start_date,
        [FromQuery] string? end_date)
    {
        ParseDates(start_date, end_date, out var start, out var end);

        Expression<Func<FuelRegister, bool>> predicate =
            r => r.VehicleMachinery == machinery_type &&
                 (!start.HasValue || r.StartedAt >= start.Value) &&
                 (!end.HasValue || r.CompletedAt <= end.Value);

        var results = await _repository.FindAsync(predicate);

        var reports = FuelRegisterToConsumptionComparisonMapper.Map(results);
        var summary = FuelRegisterToConsumptionComparisonMapper.Summarize(results);

        return Ok(new ConsumptionComparisonResult
        {
            Items = reports,
            Summary = summary
        });
    }

    // -----------------------------------------------------------
    //  GET /api/fuel/reports/general
    // -----------------------------------------------------------
    [HttpGet("reports/general")]
    [Authorize(Policy = "ADMIN-OR-SUPERVISOR")]
    public async Task<ActionResult<GeneralConsumptionReportResult>> GetGeneralReport(
        [FromQuery] string? start_date,
        [FromQuery] string? end_date)
    {
        ParseDates(start_date, end_date, out var start, out var end);

        var results = await _repository.FindAsync(BuildDatePredicate(start, end));

        return Ok(new GeneralConsumptionReportResult
        {
            ByMachinery = GeneralConsumptionReportMapper.MapMachinery(results),
            DailyConsumption = GeneralConsumptionReportMapper.MapDailyConsumption(results),
            Summary = GeneralConsumptionReportMapper.Summarize(results)
        });
    }

    // -----------------------------------------------------------
    //  GET /api/fuel/reports/vehicle
    // -----------------------------------------------------------
    [HttpGet("reports/vehicle")]
    [Authorize(Policy = "ADMIN-OR-SUPERVISOR")]
    public async Task<ActionResult<ReportByVehicleResult>> GetReportByVehicle(
        [FromQuery] string? vehicle_id,
        [FromQuery] string? start_date,
        [FromQuery] string? end_date)
    {
        if (vehicle_id == null)
            return BadRequest("vehicle_id is required");

        ParseDates(start_date, end_date, out var start, out var end);

        var vehId = Guid.Parse(vehicle_id);

        Expression<Func<FuelRegister, bool>> predicate =
            r => r.VehicleId == vehId &&
                 (!start.HasValue || r.StartedAt >= start.Value) &&
                 (!end.HasValue || r.CompletedAt <= end.Value);

        var results = await _repository.FindAsync(predicate);

        var mapped = ReportByVehicleMapper.MapReports(results);

        return Ok(mapped);
    }

    // -----------------------------------------------------------
    //  GET /api/fuel/reports/driver
    // -----------------------------------------------------------
    [HttpGet("reports/driver")]
    [Authorize(Policy = "ADMIN-OR-SUPERVISOR")]
    public async Task<ActionResult<ReportByDriverResult>> GetReportByDriver(
        [FromQuery] string? driver_id,
        [FromQuery] string? start_date,
        [FromQuery] string? end_date)
    {
        if (driver_id == null)
            return BadRequest("driver_id is required");

        ParseDates(start_date, end_date, out var start, out var end);

        var drvId = Guid.Parse(driver_id);

        Expression<Func<FuelRegister, bool>> predicate =
            r => r.DriverId == drvId &&
                 (!start.HasValue || r.StartedAt >= start.Value) &&
                 (!end.HasValue || r.CompletedAt <= end.Value);

        var results = await _repository.FindAsync(predicate);

        var mapped = ReportByDriverMapper.MapReports(results);

        return Ok(mapped);
    }

    // -----------------------------------------------------------
    //  GET /api/fuel/reports/route
    // -----------------------------------------------------------
    [HttpGet("reports/route")]
    [Authorize(Policy = "ADMIN-OR-SUPERVISOR")]
    public async Task<ActionResult<ReportByRouteResult>> GetReportByRoute(
        [FromQuery] string? route_id,
        [FromQuery] string? start_date,
        [FromQuery] string? end_date)
    {
        if (route_id == null)
            return BadRequest("route_id is required");

        ParseDates(start_date, end_date, out var start, out var end);

        var rtId = Guid.Parse(route_id);

        Expression<Func<FuelRegister, bool>> predicate =
            r => r.RouteId == rtId &&
                 (!start.HasValue || r.StartedAt >= start.Value) &&
                 (!end.HasValue || r.CompletedAt <= end.Value);

        var results = await _repository.FindAsync(predicate);

        var mapped = ReportByRouteMapper.MapReports(results);

        return Ok(mapped);
    }
}