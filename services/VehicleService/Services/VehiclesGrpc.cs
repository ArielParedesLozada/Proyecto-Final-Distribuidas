using Grpc.Core;
using VehiclesService.Proto;
using VehiclesService.Data;
using VehiclesService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Google.Protobuf.WellKnownTypes;
using Npgsql;
using ChoferService.Proto;

// ALIAS para evitar conflicto de nombres:
using VehicleModel = VehiclesService.Models.Vehicle;
using VehicleProto = VehiclesService.Proto.Vehicle;

namespace VehiclesService.Services;

public class VehiclesGrpc : VehiclesService.Proto.VehiclesService.VehiclesServiceBase
{
    private readonly VehiclesDb _db;
    private readonly ILogger<VehiclesGrpc> _log;
    private readonly ChoferService.Proto.DriversService.DriversServiceClient _driversClient;

    public VehiclesGrpc(VehiclesDb db, ILogger<VehiclesGrpc> log, ChoferService.Proto.DriversService.DriversServiceClient driversClient) 
    { 
        _db = db; 
        _log = log; 
        _driversClient = driversClient;
    }

    // ----- Vehículos -----

    [Authorize(Policy = "VehiclesCreate")]
    public override async Task<VehicleResponse> CreateVehicle(CreateVehicleRequest req, ServerCallContext ctx)
    {
        Console.WriteLine($"[DEBUG] CreateVehicle - Plate: {req.Plate}, CapacityLiters: {req.CapacityLiters}, Year: {req.Year}");
        
        if (string.IsNullOrWhiteSpace(req.Plate)) throw new RpcException(new(StatusCode.InvalidArgument, "plate required"));
        if (req.Year < 1980 || req.Year > DateTime.UtcNow.Year + 1) throw new RpcException(new(StatusCode.InvalidArgument, "year out of range"));
        if (req.CapacityLiters <= 0) throw new RpcException(new(StatusCode.InvalidArgument, $"capacity_liters > 0 (received: {req.CapacityLiters})"));

        var v = new VehicleModel
        {
            Id = Guid.NewGuid(),
            Plate = req.Plate.Trim().ToUpperInvariant(),
            Type = string.IsNullOrWhiteSpace(req.Type) ? "liviano" : req.Type.Trim(),
            Brand = req.Brand,
            Model = req.Model,
            Year = req.Year,
            CapacityLiters = (decimal)req.CapacityLiters,
            OdometerKm = req.OdometerKm
        };

        _db.Vehicles.Add(v);
        try { await _db.SaveChangesAsync(); }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == PostgresErrorCodes.UniqueViolation)
        { throw new RpcException(new(StatusCode.AlreadyExists, "PLATE_DUP")); }

        return new VehicleResponse { Vehicle = Map(v) };
    }

    [Authorize(Policy = "VehiclesReadAll")]
    public override async Task<VehicleResponse> GetVehicle(GetVehicleRequest req, ServerCallContext ctx)
    {
        if (!Guid.TryParse(req.Id, out var id)) throw new RpcException(new(StatusCode.InvalidArgument, "invalid id"));
        var v = await _db.Vehicles.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (v is null) throw new RpcException(new(StatusCode.NotFound, "VEHICLE_NOT_FOUND"));
        return new VehicleResponse { Vehicle = Map(v) };
    }

    [Authorize(Policy = "VehiclesReadAll")]
    public override async Task<ListVehiclesResponse> ListVehicles(ListVehiclesRequest req, ServerCallContext ctx)
    {
        var q = _db.Vehicles.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(req.Plate))
        {
            var like = req.Plate.Trim().ToUpperInvariant();
            q = q.Where(v => v.Plate.Contains(like));
        }
        if (!string.IsNullOrWhiteSpace(req.Type))
        {
            var t = req.Type.Trim();
            q = q.Where(v => v.Type == t);
        }
        if (req.Status != 0)
        {
            if (req.Status < 1 || req.Status > 4) throw new RpcException(new(StatusCode.InvalidArgument, "status 1..4"));
            q = q.Where(v => v.Status == req.Status);
        }

        var page = req.Page <= 0 ? 1 : req.Page;
        var size = req.PageSize <= 0 ? 20 : Math.Min(req.PageSize, 100);

        var total = await q.CountAsync();
        var list = await q.OrderBy(v => v.Plate).Skip((page - 1) * size).Take(size).ToListAsync();

        var resp = new ListVehiclesResponse
        {
            TotalCount = total,
            Page = page,
            PageSize = size,
            TotalPages = (int)Math.Ceiling(total / (double)size)
        };
        resp.Vehicles.AddRange(list.Select(Map));
        return resp;
    }

    [Authorize(Policy = "VehiclesUpdateAny")]
    public override async Task<VehicleResponse> UpdateVehicle(UpdateVehicleRequest req, ServerCallContext ctx)
    {
        if (!Guid.TryParse(req.Id, out var id)) throw new RpcException(new(StatusCode.InvalidArgument, "invalid id"));
        var v = await _db.Vehicles.FirstOrDefaultAsync(x => x.Id == id);
        if (v is null) throw new RpcException(new(StatusCode.NotFound, "VEHICLE_NOT_FOUND"));

        if (!string.IsNullOrWhiteSpace(req.Type)) v.Type = req.Type;
        if (!string.IsNullOrWhiteSpace(req.Brand)) v.Brand = req.Brand;
        if (!string.IsNullOrWhiteSpace(req.Model)) v.Model = req.Model;
        if (req.Year != 0)
        {
            if (req.Year < 1980 || req.Year > DateTime.UtcNow.Year + 1) throw new RpcException(new(StatusCode.InvalidArgument, "year out of range"));
            v.Year = req.Year;
        }
        if (req.CapacityLiters > 0) v.CapacityLiters = (decimal)req.CapacityLiters;
        if (req.OdometerKm >= 0) v.OdometerKm = req.OdometerKm;

        await _db.SaveChangesAsync();
        return new VehicleResponse { Vehicle = Map(v) };
    }

    [Authorize(Policy = "VehiclesUpdateAny")]
    public override async Task<VehicleResponse> SetStatus(SetStatusRequest req, ServerCallContext ctx)
    {
        if (!Guid.TryParse(req.Id, out var id)) throw new RpcException(new(StatusCode.InvalidArgument, "invalid id"));
        if (req.Status < 1 || req.Status > 4) throw new RpcException(new(StatusCode.InvalidArgument, "status 1..4"));

        var v = await _db.Vehicles.FirstOrDefaultAsync(x => x.Id == id);
        if (v is null) throw new RpcException(new(StatusCode.NotFound, "VEHICLE_NOT_FOUND"));

        v.Status = (short)req.Status;
        await _db.SaveChangesAsync();
        return new VehicleResponse { Vehicle = Map(v) };
    }

    // ----- Asignaciones -----

    [Authorize(Policy = "VehiclesAssign")]
    public override async Task<AssignmentResponse> AssignVehicle(AssignVehicleRequest req, ServerCallContext ctx)
    {
        if (!Guid.TryParse(req.VehicleId, out var vid) || !Guid.TryParse(req.DriverId, out var did))
            throw new RpcException(new(StatusCode.InvalidArgument, "invalid ids"));

        var v = await _db.Vehicles.AsNoTracking().FirstOrDefaultAsync(x => x.Id == vid);
        if (v is null) throw new RpcException(new(StatusCode.NotFound, "VEHICLE_NOT_FOUND"));
        if (v.Status != 1) throw new RpcException(new Status(StatusCode.FailedPrecondition, "VEHICLE_NOT_ACTIVE"));

        var active = await _db.DriverVehicles.FirstOrDefaultAsync(x => x.VehicleId == vid && x.UnassignedAt == null);
        if (active != null) throw new RpcException(new Status(StatusCode.AlreadyExists, "VEHICLE_ALREADY_ASSIGNED"));

        var now = DateTimeOffset.UtcNow;
        var row = new DriverVehicle { Id = Guid.NewGuid(), DriverId = did, VehicleId = vid, AssignedAt = now };
        _db.DriverVehicles.Add(row);
        await _db.SaveChangesAsync();

        return new AssignmentResponse
        {
            VehicleId = vid.ToString(),
            DriverId = did.ToString(),
            AssignedAt = Timestamp.FromDateTimeOffset(row.AssignedAt)
        };
    }

    [Authorize(Policy = "VehiclesAssign")]
    public override async Task<AssignmentResponse> UnassignVehicle(UnassignVehicleRequest req, ServerCallContext ctx)
    {
        if (!Guid.TryParse(req.VehicleId, out var vid)) throw new RpcException(new(StatusCode.InvalidArgument, "invalid vehicle_id"));

        var active = await _db.DriverVehicles.FirstOrDefaultAsync(x => x.VehicleId == vid && x.UnassignedAt == null);
        if (active == null) throw new RpcException(new Status(StatusCode.NotFound, "NO_ACTIVE_ASSIGNMENT"));

        active.UnassignedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return new AssignmentResponse
        {
            VehicleId = active.VehicleId.ToString(),
            DriverId = active.DriverId.ToString(),
            AssignedAt = Timestamp.FromDateTimeOffset(active.AssignedAt),
            UnassignedAt = Timestamp.FromDateTimeOffset(active.UnassignedAt.Value)
        };
    }

    // ----- Consultas por chofer -----

    [Authorize(Policy = "VehiclesReadAll")]
    public override async Task<VehicleResponse> GetVehicleByDriver(GetVehicleByDriverRequest req, ServerCallContext ctx)
    {
        if (!Guid.TryParse(req.DriverId, out var did)) throw new RpcException(new(StatusCode.InvalidArgument, "invalid driver_id"));

        var active = await _db.DriverVehicles.AsNoTracking().FirstOrDefaultAsync(x => x.DriverId == did && x.UnassignedAt == null);
        if (active == null) throw new RpcException(new Status(StatusCode.NotFound, "NO_ACTIVE_VEHICLE"));

        var v = await _db.Vehicles.AsNoTracking().FirstOrDefaultAsync(x => x.Id == active.VehicleId);
        if (v is null) throw new RpcException(new Status(StatusCode.NotFound, "VEHICLE_NOT_FOUND"));

        return new VehicleResponse { Vehicle = Map(v) };
    }

    [Authorize(Policy = "VehiclesReadOwn")]
    public override async Task<ListVehiclesByDriverResponse> ListMyVehicles(Empty _, ServerCallContext ctx)
    {
        var sub = ctx.GetHttpContext().User.FindFirst("sub")?.Value;
        if (string.IsNullOrWhiteSpace(sub)) 
            throw new RpcException(new Status(StatusCode.Unauthenticated, "INVALID_TOKEN"));

        // Llamar al DriversService para obtener el driver_id desde el user_id
        var getDriverRequest = new GetDriverByUserIdRequest { UserId = sub };
        var driverResponse = await _driversClient.GetDriverByUserIdAsync(getDriverRequest);
        
        if (!Guid.TryParse(driverResponse.Driver.Id, out var driverId))
            throw new RpcException(new Status(StatusCode.NotFound, "DRIVER_NOT_FOUND"));

        var vehicles = await _db.DriverVehicles
            .AsNoTracking()
            .Where(x => x.DriverId == driverId && x.UnassignedAt == null)
            .Join(_db.Vehicles.AsNoTracking(),
                  dv => dv.VehicleId,
                  v  => v.Id,
                  (dv, v) => v)
            .OrderBy(v => v.Plate)
            .ToListAsync();

        var resp = new ListVehiclesByDriverResponse();
        resp.Vehicles.AddRange(vehicles.Select(Map));
        return resp;
    }

    // ----- Listar vehículos por conductor -----

    [Authorize(Policy = "VehiclesReadAll")]
    public override async Task<ListVehiclesByDriverResponse> ListVehiclesByDriver(
        ListVehiclesByDriverRequest req, ServerCallContext ctx)
    {
        if (!Guid.TryParse(req.DriverId, out var did))
            throw new RpcException(new(StatusCode.InvalidArgument, "invalid driver_id"));

        var vehicles = await _db.DriverVehicles
            .AsNoTracking()
            .Where(x => x.DriverId == did && x.UnassignedAt == null)
            .Join(_db.Vehicles.AsNoTracking(),
                  dv => dv.VehicleId,
                  v  => v.Id,
                  (dv, v) => v)
            .OrderBy(v => v.Plate)
            .ToListAsync();

        var resp = new ListVehiclesByDriverResponse();
        resp.Vehicles.AddRange(vehicles.Select(Map));
        return resp;
    }

    // ----- Historial completo de asignaciones por conductor -----

    [Authorize(Policy = "VehiclesReadAll")]
    public override async Task<ListAssignmentsByDriverResponse> ListAssignmentsByDriver(
        ListAssignmentsByDriverRequest req, ServerCallContext ctx)
    {
        if (!Guid.TryParse(req.DriverId, out var did))
            throw new RpcException(new Status(StatusCode.InvalidArgument, "invalid driver_id"));

        var rows = await _db.DriverVehicles
            .AsNoTracking()
            .Where(x => x.DriverId == did)
            .OrderByDescending(x => x.AssignedAt)
            .ToListAsync();

        var resp = new ListAssignmentsByDriverResponse();
        resp.Items.AddRange(rows.Select(x => new AssignmentRow
        {
            VehicleId = x.VehicleId.ToString(),
            DriverId = x.DriverId.ToString(),
            AssignedAt = Timestamp.FromDateTimeOffset(x.AssignedAt),
            UnassignedAt = x.UnassignedAt.HasValue
                           ? Timestamp.FromDateTimeOffset(x.UnassignedAt.Value)
                           : null
        }));
        return resp;
    }

    // <— Aquí el mapper usando alias para evitar ambigüedad
    private static VehicleProto Map(VehicleModel v) => new VehicleProto
    {
        Id = v.Id.ToString(),
        Plate = v.Plate,
        Type = v.Type,
        Brand = v.Brand,
        Model = v.Model,
        Year = v.Year,
        CapacityLiters = (double)v.CapacityLiters,
        OdometerKm = v.OdometerKm,
        Status = v.Status,
        CreatedAt = Timestamp.FromDateTimeOffset(v.CreatedAt),
        UpdatedAt = Timestamp.FromDateTimeOffset(v.UpdatedAt),
    };
}
