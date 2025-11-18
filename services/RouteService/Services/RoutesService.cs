using RouteService.Data.Repository;
using RoutesProtoService = RoutesProto.RoutesService.RoutesServiceBase;
using Route = RouteService.Domain.Route;
using RouteStatesDomain = RouteService.Domain.RouteStates;
using RouteProto = RoutesProto.Route;
using Microsoft.AspNetCore.Authorization;
using Grpc.Core;
using RoutesProto;
using Google.Protobuf.WellKnownTypes;
using RouteService.Clients;
using FuelConsumptionService = RouteService.Domain.FuelConsumptionService;
using RouteService.Infraestructure.Distance;
namespace RouteService.Services;

public class RoutesService : RoutesProtoService
{
    private readonly IRepository<Route, Guid> _repository;
    private readonly VehicleClient _vehicleClient;
    private readonly DriverClient _driverClient;
    private readonly DistanceValidator _distanceValidator;

    public RoutesService(IRepository<Route, Guid> repository, VehicleClient vehicleClient, DriverClient driverClient, DistanceValidator distanceValidator)
    {
        _repository = repository;
        _vehicleClient = vehicleClient;
        _driverClient = driverClient;
        _distanceValidator = distanceValidator;
    }
    private static string? GetAuthorization(ServerCallContext ctx)
    {
        return ctx.GetHttpContext()?.Request.Headers["Authorization"].ToString();
    }
    [Authorize(Policy = "routes:read:all")]
    public override async Task<ListRoutesResponse> ListRoutes(ListRoutesRequest request, ServerCallContext context)
    {
        int page = request.Page <= 0 ? 1 : request.Page;
        int pageSize = request.PageSize <= 0 ? 10 : request.PageSize;
        var (routes, totalCount) = await _repository.GetAllPagedAsync(page, pageSize);
        int totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        var response = new ListRoutesResponse
        {
            Page = page,
            PageSize = pageSize,
            TotalPages = totalPages
        };

        response.Routes.AddRange(routes.Select(MapToProto));

        return response;
    }
    [Authorize(Policy = "routes:create")]
    public override async Task<RouteProto> CreateRoute(CreateRouteRequest request, ServerCallContext context)
    {
        var coordinateStart = new Domain.Coordinate(request.CoordinateStart.Latitude, request.CoordinateStart.Longitude);
        var coordinateStop = new Domain.Coordinate(request.CoordinateStop.Latitude, request.CoordinateStop.Longitude);
        var distance = await _distanceValidator.ValidateDistanceAsync(request.DistanceKm, coordinateStart, coordinateStop);
        var newRoute = new Route
        {
            DriverVehicleId = null,
            AssignedAt = null,
            DriverId = null,
            VehicleId = null,
            OriginName = request.OriginName,
            DestinationName = request.DestinationName,
            Status = RouteStatesDomain.Unassigned,
            CreatedAt = DateTimeOffset.UtcNow,
            StartedAt = null,
            CompletedAt = null,
            CoordinatesStart = coordinateStart,
            CoordinatesStop = coordinateStop,
            EstimatedDistanceKm = distance,
            RealDistanceKm = null,
            EstimatedFuelConsumptionLiters = null,
            RealFuelConsumptionLiters = null,
        };
        var created = await _repository.CreateAsync(newRoute);
        var response = MapToProto(created);
        return response;
    }
    [Authorize(Policy = "routes:update:any")]
    public override async Task<RouteProto> EditRoute(EditRouteRequest request, ServerCallContext context)
    {
        var id = Guid.Parse(request.Id);
        var routeToUpdate = await _repository.GetByIdAsync(id) ?? throw new RpcException(new Status(StatusCode.NotFound, $"Route with ID {id} not found"));

        DateTimeOffset? newCreated = request.CreatedAt?.ToDateTimeOffset();
        DateTimeOffset? newAssigned = request.AssignedAt?.ToDateTimeOffset();
        DateTimeOffset? newStarted = request.StartedAt?.ToDateTimeOffset();
        DateTimeOffset? newCompleted = request.CompletedAt?.ToDateTimeOffset();

        bool isTemporalOrderValid =
            (newCreated == null || newAssigned == null || newCreated <= newAssigned) &&
            (newAssigned == null || newStarted == null || newAssigned <= newStarted) &&
            (newStarted == null || newCompleted == null || newStarted <= newCompleted);

        if (!isTemporalOrderValid)
            throw new RpcException(new Status(StatusCode.InvalidArgument, "INVALID_TEMPORAL_ORDER"));

        if (!string.IsNullOrWhiteSpace(request.DriverVehicleId))
        {
            if (!Guid.TryParse(request.DriverVehicleId, out var driverVehicleGuid))
                throw new RpcException(new Status(StatusCode.InvalidArgument, "DRIVER_VEHICLE_ID_INVALID"));

            var assignmentRow = await _vehicleClient.GetDriverVehicleExists(
                request.DriverVehicleId,
                GetAuthorization(context)
            ) ?? throw new RpcException(new Status(StatusCode.NotFound, "ASSIGNMENT_NOT_FOUND"));
            routeToUpdate.DriverVehicleId = driverVehicleGuid;
            routeToUpdate.DriverId = Guid.Parse(assignmentRow.DriverId);
            routeToUpdate.VehicleId = Guid.Parse(assignmentRow.VehicleId);
        }
        var coordinateStart = new Domain.Coordinate(request.CoordinateStart.Latitude, request.CoordinateStart.Longitude);
        var coordinateStop = new Domain.Coordinate(request.CoordinateStop.Latitude, request.CoordinateStop.Longitude);
        var distanceEstimated = await _distanceValidator.ValidateDistanceAsync(request.DistanceKm, coordinateStart, coordinateStop);
        double? distanceReal = null;

        if (request.RealDistanceKm > 0)
        {
            distanceReal = await _distanceValidator.ValidateDistanceAsync(
                request.RealDistanceKm,
                coordinateStart,
                coordinateStop
            );
        }
        routeToUpdate.AssignedAt = newAssigned ?? routeToUpdate.AssignedAt;
        routeToUpdate.OriginName = request.OriginName ?? routeToUpdate.OriginName;
        routeToUpdate.DestinationName = request.DestinationName ?? routeToUpdate.DestinationName;
        routeToUpdate.Status = (RouteStatesDomain)request.Status;
        routeToUpdate.CreatedAt = newCreated ?? routeToUpdate.CreatedAt;
        routeToUpdate.StartedAt = newStarted ?? routeToUpdate.StartedAt;
        routeToUpdate.CompletedAt = newCompleted ?? routeToUpdate.CompletedAt;

        if (request.CoordinateStart != null)
        {
            routeToUpdate.CoordinatesStart = coordinateStart;
        }

        if (request.CoordinateStop != null)
        {
            routeToUpdate.CoordinatesStop = coordinateStop;
        }
        routeToUpdate.EstimatedDistanceKm = distanceEstimated;
        routeToUpdate.RealDistanceKm = distanceReal ?? routeToUpdate.RealDistanceKm; ;
        routeToUpdate.EstimatedFuelConsumptionLiters = request.EstimatedFuelConsumptionLiters;
        routeToUpdate.RealFuelConsumptionLiters = request.RealFuelConsumptionLiters;

        var updated = await _repository.UpdateAsync(routeToUpdate);
        var response = MapToProto(updated);
        return response;
    }
    [Authorize(Policy = "routes:delete")]
    public override async Task<Empty> DeleteRoute(DeleteRouteRequest request, ServerCallContext context)
    {
        if (!Guid.TryParse(request.Id, out var id))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "INVALID_ID"));
        }
        var route = await _repository.GetByIdAsync(id) ?? throw new RpcException(new Status(StatusCode.NotFound, "NOT FOUND"));
        if (route.Status == RouteStatesDomain.Assigned || route.Status == RouteStatesDomain.Started)
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "ROUTE_NOT_DELETABLE"));
        }
        await _repository.DeleteAsync(route);
        return new Empty();
    }
    [Authorize(Policy = "routes:read:all")]
    public async override Task<RouteProto> GetRoute(GetRouteRequest request, ServerCallContext context)
    {
        if (!Guid.TryParse(request.Id, out var id))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "INVALID_ID"));
        }
        var route = await _repository.GetByIdAsync(id) ?? throw new RpcException(new Status(StatusCode.NotFound, "NOT FOUND"));
        var response = MapToProto(route);
        return response;
    }
    [Authorize(Policy = "routes:read:all")]
    public async override Task<ListRoutesResponse> GetRoutesByDriver(ListRoutesByDriverRequest request, ServerCallContext context)
    {
        var driverId = request.DriverId;
        var assignments = await _vehicleClient.GetDriverAssignmentRows(driverId, GetAuthorization(context));
        var vehicleIds = assignments.Items
            .Select(a => Guid.Parse(a.VehicleId))
            .ToList();
        if (vehicleIds.Count == 0)
        {
            return new ListRoutesResponse();
        }
        var routes = await _repository.FindAsync(r => r.DriverVehicleId.HasValue && vehicleIds.Contains(r.DriverVehicleId.Value));
        var response = new ListRoutesResponse();
        response.Routes.AddRange(routes.Select(MapToProto));
        return response;
    }
    [Authorize(Policy = "routes:read:all")]
    public override async Task<ListRoutesResponse> GetRoutesByDriverVehicle(ListRoutesByDriverVehicleRequest request, ServerCallContext context)
    {
        if (!Guid.TryParse(request.DriverVehicleId, out var driverVehicleId))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "INVALID_ID"));
        }
        var routes = await _repository.FindAsync(r => r.DriverVehicleId.HasValue && r.DriverVehicleId.Value == driverVehicleId);
        var response = new ListRoutesResponse();
        response.Routes.AddRange(routes.Select(MapToProto));
        return response;
    }
    [Authorize(Policy = "routes:read:own")]
    public override async Task<ListRoutesResponse> GetMyRoutes(GetMyRoutesRequest request, ServerCallContext context)
    {
        var bearer = GetAuthorization(context);
        var userId = context.GetHttpContext().User.FindFirst("sub")?.Value;
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, $"NULL_USER {userId}"));
        }
        var driverId = await _driverClient.FindDriverByUserIdAsync(userId, bearer) ?? throw new RpcException(new Status(StatusCode.InvalidArgument, $"DRIVER_NOT_FOUND {userId} SIGMA"));
        var assignments = await _vehicleClient.GetDriverAssignmentRows(driverId, bearer);
        var assignmentIds = assignments.Items
            .Select(a => Guid.Parse(a.AssignmentId))
            .ToList();
        if (assignmentIds.Count == 0)
        {
            return new ListRoutesResponse();
        }
        var routes = await _repository.FindAsync(r => r.DriverVehicleId.HasValue && assignmentIds.Contains(r.DriverVehicleId.Value));
        var response = new ListRoutesResponse();
        response.Routes.AddRange(routes.Select(MapToProto));
        return response;
    }
    [Authorize(Policy = "routes:assign")]
    public override async Task<RouteProto> AssignRoute(AssignRouteRequest request, ServerCallContext context)
    {
        var bearer = GetAuthorization(context);
        var routeId = request.Id;
        var route = await _repository.GetByIdAsync(Guid.Parse(routeId)) ?? throw new RpcException(new Status(StatusCode.NotFound, "ROUTE_NOT_FOUND"));
        if (route.Status == RouteStatesDomain.Completed || route.Status == RouteStatesDomain.Started)
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "ROUTE_COMPLETED"));
        }
        var driverVehicleId = request.DriverVehicleId;
        var assignment = await _vehicleClient.GetDriverVehicleExists(driverVehicleId, bearer) ?? throw new RpcException(new Status(StatusCode.NotFound, "ASSIGNMENT_NOT_FOUND"));
        var driverId = assignment.DriverId;
        var vehicleId = assignment.VehicleId;
        if (!(await _driverClient.DriverIsAvailable(driverId, bearer)))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "DRIVER_NOT_AVAILABLE"));
        }
        route.AssignedAt = DateTimeOffset.UtcNow;
        route.DriverVehicleId = Guid.Parse(driverVehicleId);
        route.DriverId = Guid.Parse(driverId);
        route.VehicleId = Guid.Parse(vehicleId);
        route.Status = RouteStatesDomain.Assigned;
        await _driverClient.SetDriverAvailability(driverId, 2, bearer);
        await _repository.UpdateAsync(route);
        var response = MapToProto(route);
        return response;
    }

    [Authorize(Policy = "routes:assign")]
    public async override Task<RouteProto> UnassignRoutes(UnassignRouteRequest request, ServerCallContext context)
    {
        var bearer = GetAuthorization(context);
        var routeId = request.Id;
        var route = await _repository.GetByIdAsync(Guid.Parse(routeId)) ?? throw new RpcException(new Status(StatusCode.NotFound, "ROUTE_NOT_FOUND"));
        if (route.Status == RouteStatesDomain.Completed || route.Status == RouteStatesDomain.Started)
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "ROUTE_COMPLETED"));
        }
        if (route.Status == RouteStatesDomain.Unassigned || route.DriverVehicleId == null)
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "ROUTE_NOT_ASSIGNED"));
        }
        var driverId = route.DriverId.HasValue ? route.DriverId.Value.ToString() : string.Empty;
        route.AssignedAt = null;
        route.DriverVehicleId = null;
        route.DriverId = null;
        route.VehicleId = null;
        route.Status = RouteStatesDomain.Unassigned;
        await _driverClient.SetDriverAvailability(driverId, 1, bearer);
        await _repository.UpdateAsync(route);
        var response = MapToProto(route);
        return response;
    }
    [Authorize(Policy = "routes:start-or-start-own")]
    public async override Task<RouteProto> StartRoute(StartRouteRequest request, ServerCallContext context)
    {
        var bearer = GetAuthorization(context);
        var routeId = request.Id;
        var route = await _repository.GetByIdAsync(Guid.Parse(routeId)) ?? throw new RpcException(new Status(StatusCode.NotFound, "ROUTE_NOT_FOUND"));
        if (route.Status == RouteStatesDomain.Completed || route.Status == RouteStatesDomain.Started)
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "ROUTE_NOT_STARTABLE"));
        }
        if (route.Status == RouteStatesDomain.Unassigned || route.DriverVehicleId == null)
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "ROUTE_NOT_ASSIGNED"));
        }
        var userId = context.GetHttpContext().User.FindFirst("sub")?.Value ?? throw new RpcException(new Status(StatusCode.Unauthenticated, "NOT_AUTHENTICATED"));
        var driver = await _driverClient.FindDriverByUserIdAsync(userId, bearer)
            ?? throw new RpcException(new Status(StatusCode.NotFound, "DRIVER_NOT_FOUND"));
        if (route.DriverId != Guid.Parse(driver))
            throw new RpcException(new Status(StatusCode.PermissionDenied, "NOT_OWNER_OF_ROUTE"));
        var driverVehicleId = route.DriverVehicleId.ToString() ?? throw new RpcException(new Status(StatusCode.InvalidArgument, "ROUTE_NOT_ASSIGNED"));
        var assignment = await _vehicleClient.GetDriverVehicleExists(driverVehicleId, bearer) ?? throw new RpcException(new Status(StatusCode.NotFound, "ASSIGNMENT_NOT_FOUND"));
        var vehicle = await _vehicleClient.GetVehicle(assignment.VehicleId, bearer) ?? throw new RpcException(new Status(StatusCode.NotFound, "VEHICLE_NOT_ASSIGNED"));
        FuelConsumptionService.CalculateEstimatedConsumption(route, vehicle.Type, vehicle.Model, vehicle.Year, vehicle.CapacityLiters);
        route.Status = RouteStatesDomain.Started;
        route.StartedAt = DateTimeOffset.UtcNow;
        await _repository.UpdateAsync(route);
        return MapToProto(route);
    }
    [Authorize(Policy = "routes:end-or-end-own")]
    public async override Task<RouteProto> EndRoute(EndRouteRequest request, ServerCallContext context)
    {
        var bearer = GetAuthorization(context);
        var routeId = request.Id;
        var route = await _repository.GetByIdAsync(Guid.Parse(routeId)) ?? throw new RpcException(new Status(StatusCode.NotFound, "ROUTE_NOT_FOUND"));
        if (route.Status != RouteStatesDomain.Started)
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "ROUTE_NOT_ENDABLE"));
        }
        var userId = context.GetHttpContext().User.FindFirst("sub")?.Value ?? throw new RpcException(new Status(StatusCode.Unauthenticated, "NOT_AUTHENTICATED"));
        var driver = await _driverClient.FindDriverByUserIdAsync(userId, bearer)
                ?? throw new RpcException(new Status(StatusCode.NotFound, "DRIVER_NOT_FOUND"));
        if (route.DriverId != Guid.Parse(driver))
            throw new RpcException(new Status(StatusCode.PermissionDenied, "NOT_OWNER_OF_ROUTE"));
        route.CompletedAt = DateTimeOffset.UtcNow;
        if (request.RealDistanceKm > 0)
        {
            var validatedRealDistance = await _distanceValidator.ValidateDistanceAsync(
                request.RealDistanceKm,
                route.CoordinatesStart,
                route.CoordinatesStop
            );
            route.RealDistanceKm = validatedRealDistance;
        }
        else
        {
            route.RealDistanceKm = route.EstimatedDistanceKm;
        }
        route.Status = RouteStatesDomain.Completed;
        //Falta logica de consumo real
        var vehicleId = route.VehicleId.HasValue ? route.VehicleId.Value.ToString() : throw new RpcException(new Status(StatusCode.InvalidArgument, "VEHICLE_NOT_FOUND_CORRUP_ROUTE"));
        var driverId = route.DriverId.HasValue ? route.DriverId.Value.ToString() : throw new RpcException(new Status(StatusCode.InvalidArgument, "DRIVER_NOT_FOUND_CORRUP_ROUTE"));
        route.RealFuelConsumptionLiters = request.RealFuelConsumptionLiters <= 0 ? route.EstimatedFuelConsumptionLiters : request.RealFuelConsumptionLiters;
        await _vehicleClient.UpdateVehicleRouteEnded(vehicleId, route, bearer);
        await _driverClient.SetDriverAvailability(driverId, 1, bearer);
        await _repository.UpdateAsync(route);
        return MapToProto(route);
    }
    [Authorize(Policy = "routes:delete")]
    public override async Task<Empty> DeleteRoutesByDriverCascade(DeleteRoutesByDriverCascadeRequest request, ServerCallContext context)
    {
        var bearer = GetAuthorization(context);
        var driverId = Guid.Parse(request.DriverId);
        // var assignments = await _vehicleClient.GetDriverAssignmentRows(driverId, bearer);
        // var assignmentIds = assignments.Items.Select(a => Guid.Parse(a.AssignmentId)).ToList();
        await _repository.DeleteWhereAsync(r => r.DriverId.HasValue && r.DriverId == driverId);
        return new Empty();
    }
    [Authorize(Policy = "routes:delete")]
    public override async Task<Empty> DeleteRoutesByVehicleCascade(DeleteRouteByVehicleCascadeRequest request, ServerCallContext context)
    {
        var bearer = GetAuthorization(context);
        var vehicleId = Guid.Parse(request.VehicleId);
        // var assignments = await _vehicleClient.GetAssignmentRowsByVehicleId(vehicleId, bearer);
        // var assignmentIds = assignments.Assignments.Select(a => Guid.Parse(a.AssignmentId)).ToList();
        await _repository.DeleteWhereAsync(r => r.VehicleId.HasValue && r.VehicleId == vehicleId);
        return new Empty();
    }
    [Authorize(Policy = "routes:delete")]
    public override async Task<Empty> DeleteRoutesByDriverVehicleCascade(DeleteRouteByDriverVehicleCascadeRequest request, ServerCallContext context)
    {
        var driverVehicleId = request.DriverVehicle;
        if (!Guid.TryParse(driverVehicleId, out var dvId))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid driverVehicleId"));
        }
        await _repository.DeleteWhereAsync(r => r.DriverVehicleId.HasValue && dvId == r.DriverVehicleId);
        return new Empty();
    }

    private static RouteProto MapToProto(Route route)
    {
        return new RouteProto
        {
            Id = route.Id.ToString(),
            DriverVehicleId = route.DriverVehicleId?.ToString() ?? string.Empty,
            DriverId = route.DriverId?.ToString() ?? string.Empty,
            VehicleId = route.VehicleId?.ToString() ?? string.Empty,
            AssignedAt = route.AssignedAt.HasValue
                           ? Timestamp.FromDateTimeOffset(route.AssignedAt.Value)
                           : null,
            OriginName = route.OriginName,
            DestinationName = route.DestinationName,
            Status = (RouteStates)route.Status,
            CreatedAt = Timestamp.FromDateTimeOffset(route.CreatedAt),
            StartedAt = route.StartedAt.HasValue
                           ? Timestamp.FromDateTimeOffset(route.StartedAt.Value)
                           : null,
            CompletedAt = route.CompletedAt.HasValue
                           ? Timestamp.FromDateTimeOffset(route.CompletedAt.Value)
                           : null,
            CoordinateStart = route.CoordinatesStart != null
                           ? new RoutesProto.Coordinate
                           {
                               Latitude = route.CoordinatesStart.Latitude,
                               Longitude = route.CoordinatesStart.Longitude
                           }
                           : null,
            CoordinateStop = route.CoordinatesStop != null
                           ? new RoutesProto.Coordinate
                           {
                               Latitude = route.CoordinatesStop.Latitude,
                               Longitude = route.CoordinatesStop.Longitude
                           }
                           : null,
            DistanceKm = route.EstimatedDistanceKm,
            RealDistanceKm = route.RealDistanceKm ?? 0,
            EstimatedFuelConsumptionLiters = route.EstimatedFuelConsumptionLiters ?? 0,
            RealFuelConsumptionLiters = route.RealFuelConsumptionLiters ?? 0
        };
    }
}