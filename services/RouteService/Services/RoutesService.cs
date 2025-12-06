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
using DomainEnum = System.Enum;
using RouteService.Infraestructure.UseCases;
using Microsoft.EntityFrameworkCore;
using RouteService.Data.Databases;
namespace RouteService.Services;

public class RoutesService : RoutesProtoService
{
    private readonly IRepository<Route, Guid> _repository;
    private readonly VehicleClient _vehicleClient;
    private readonly DriverClient _driverClient;
    private readonly FuelClient _fuelClient;
    private readonly DistanceValidator _distanceValidator;
    private readonly AppDatabase _dbContext;

    public RoutesService(IRepository<Route, Guid> repository, VehicleClient vehicleClient, DriverClient driverClient, FuelClient fuelClient, DistanceValidator distanceValidator, AppDatabase dbContext)
    {
        _repository = repository;
        _vehicleClient = vehicleClient;
        _driverClient = driverClient;
        _fuelClient = fuelClient;
        _distanceValidator = distanceValidator;
        _dbContext = dbContext;
    }
    private static string? GetAuthorization(ServerCallContext ctx)
    {
        return ctx.GetHttpContext()?.Request.Headers["Authorization"].ToString();
    }
    [Authorize(Policy = "routes:read:all")]
    public override async Task<ListRoutesResponse> ListRoutes(ListRoutesRequest request, ServerCallContext context)
    {
        try
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

            // Optimización: cargar todas las observaciones de una vez en lugar de hacer una consulta por cada ruta
            Dictionary<Guid, List<RouteObservation>> observationsByRouteId = new();
            
            if (routes.Any())
            {
                var routeIds = routes.Select(r => r.Id).ToList();
                var allObservations = await _dbContext.RouteObservations
                    .Where(o => routeIds.Contains(o.RouteId))
                    .OrderByDescending(o => o.CreatedAt)
                    .ToListAsync();

                // Crear un diccionario de observaciones por RouteId para acceso rápido
                observationsByRouteId = allObservations
                    .GroupBy(o => o.RouteId)
                    .ToDictionary(g => g.Key, g => g.ToList());
            }

            // Mapear las rutas usando el diccionario de observaciones
            foreach (var route in routes)
            {
                var observations = observationsByRouteId.GetValueOrDefault(route.Id);
                response.Routes.Add(MapToProtoWithObservations(route, observations));
            }

            return response;
        }
        catch (RpcException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new RpcException(new Status(StatusCode.Internal, $"INTERNAL_ERROR: {ex.Message}"));
        }
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
        try
        {
            var id = Guid.Parse(request.Id);
            var routeToUpdate = await _repository.GetByIdAsync(id) ?? throw new RpcException(new Status(StatusCode.NotFound, $"ROUTE_NOT_FOUND"));

            EditRouteCheckings.CheckEditIsValid(routeToUpdate, request);

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
            DateTimeOffset? newCreated = request.CreatedAt?.ToDateTimeOffset();
            DateTimeOffset? newAssigned = request.AssignedAt?.ToDateTimeOffset();
            DateTimeOffset? newStarted = request.StartedAt?.ToDateTimeOffset();
            DateTimeOffset? newCompleted = request.CompletedAt?.ToDateTimeOffset();
            bool shouldRecalculateDistance = false;

            if (request.CoordinateStart != null)
            {
                var newStart = new Domain.Coordinate(
                    request.CoordinateStart.Latitude,
                    request.CoordinateStart.Longitude
                );
                if (routeToUpdate.CoordinatesStart == null || !newStart.Equals(routeToUpdate.CoordinatesStart))
                {
                    routeToUpdate.CoordinatesStart = newStart;
                    shouldRecalculateDistance = true;
                }
            }
            if (request.CoordinateStop != null)
            {
                var newStop = new Domain.Coordinate(
                    request.CoordinateStop.Latitude,
                    request.CoordinateStop.Longitude
                );

                if (routeToUpdate.CoordinatesStop == null || !newStop.Equals(routeToUpdate.CoordinatesStop))
                {
                    routeToUpdate.CoordinatesStop = newStop;
                    shouldRecalculateDistance = true;
                }
            }

            if (shouldRecalculateDistance)
            {
                // Validar que distance_km sea válido antes de recalcular
                if (request.DistanceKm <= 0)
                {
                    throw new RpcException(new Status(StatusCode.InvalidArgument, "INVALID_DISTANCE: distance_km debe ser mayor a 0 cuando se cambian las coordenadas"));
                }
                // Asegurar que las coordenadas no sean null antes de validar
                if (routeToUpdate.CoordinatesStart == null || routeToUpdate.CoordinatesStop == null)
                {
                    throw new RpcException(new Status(StatusCode.InvalidArgument, "INVALID_COORDINATES: las coordenadas de inicio y fin son requeridas"));
                }
                routeToUpdate.EstimatedDistanceKm = await _distanceValidator.ValidateDistanceAsync(
                    request.DistanceKm,
                    routeToUpdate.CoordinatesStart,
                    routeToUpdate.CoordinatesStop
                );
            }

            if (request.RealDistanceKm > 0)
            {
                if (routeToUpdate.CoordinatesStart == null || routeToUpdate.CoordinatesStop == null)
                {
                    throw new RpcException(new Status(StatusCode.InvalidArgument, "INVALID_COORDINATES: las coordenadas de inicio y fin son requeridas para validar la distancia real"));
                }
                routeToUpdate.RealDistanceKm = await _distanceValidator.ValidateDistanceAsync(
                    request.RealDistanceKm,
                    routeToUpdate.CoordinatesStart,
                    routeToUpdate.CoordinatesStop
                );
            }
            routeToUpdate.OriginName = request.OriginName ?? routeToUpdate.OriginName;
            routeToUpdate.DestinationName = request.DestinationName ?? routeToUpdate.DestinationName;

            routeToUpdate.CreatedAt = newCreated ?? routeToUpdate.CreatedAt;
            routeToUpdate.AssignedAt = newAssigned ?? routeToUpdate.AssignedAt;
            routeToUpdate.StartedAt = newStarted ?? routeToUpdate.StartedAt;
            routeToUpdate.CompletedAt = newCompleted ?? routeToUpdate.CompletedAt;
            // Convertir el enum de protobuf al enum del dominio usando el valor numérico
            // Ambos enums tienen los mismos valores (0=Unassigned, 1=Assigned, 2=Started, 3=Completed)
            var statusValue = (int)request.Status;
            if (statusValue >= 0 && statusValue <= 3)
            {
                routeToUpdate.Status = (RouteStatesDomain)statusValue;
            }
            if (request.EstimatedFuelConsumptionLiters > 0)
                routeToUpdate.EstimatedFuelConsumptionLiters = request.EstimatedFuelConsumptionLiters;

            if (request.RealFuelConsumptionLiters > 0)
                routeToUpdate.RealFuelConsumptionLiters = request.RealFuelConsumptionLiters;
            var updated = await _repository.UpdateAsync(routeToUpdate);
            return MapToProto(updated);
        }
        catch (RpcException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new RpcException(new Status(StatusCode.Internal, $"INTERNAL_ERROR: {ex.Message}"));
        }
    }

    [Authorize(Policy = "routes:delete")]
    public override async Task<Empty> DeleteRoute(DeleteRouteRequest request, ServerCallContext context)
    {
        if (!Guid.TryParse(request.Id, out var id))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "INVALID_ID"));
        }
        var route = await _repository.GetByIdAsync(id) ?? throw new RpcException(new Status(StatusCode.NotFound, "NOT FOUND"));
        
        // No se puede eliminar una ruta que está en curso (Started)
        if (route.Status == RouteStatesDomain.Started)
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "ROUTE_NOT_DELETABLE: No se puede eliminar una ruta en curso"));
        }
        
        // Si la ruta está asignada, primero desasignarla para liberar al conductor
        if (route.Status == RouteStatesDomain.Assigned && route.DriverId.HasValue)
        {
            var bearer = GetAuthorization(context);
            var driverId = route.DriverId.Value.ToString();
            
            // Desasignar la ruta (liberar al conductor)
            route.AssignedAt = null;
            route.DriverVehicleId = null;
            route.DriverId = null;
            route.VehicleId = null;
            route.Status = RouteStatesDomain.Unassigned;
            
            // Liberar al conductor (marcarlo como disponible)
            await _driverClient.SetDriverAvailability(driverId, 1, bearer);
            
            // Actualizar la ruta antes de eliminarla
            await _repository.UpdateAsync(route);
        }
        
        // Ahora se puede eliminar la ruta
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
        return MapToProto(route);
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
        foreach (var route in routes)
        {
            response.Routes.Add(MapToProto(route));
        }
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
        foreach (var route in routes)
        {
            response.Routes.Add(MapToProto(route));
        }
        return response;
    }
    [Authorize(Policy = "routes:read:all")]
    public override async Task<ListRoutesResponse> GetRoutesByVehicle(ListRoutesByVehicleRequest request, ServerCallContext context)
    {
        if (!Guid.TryParse(request.VehicleId, out var vehicleId))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "INVALID_ID"));
        }
        var routes = await _repository.FindAsync(r => r.VehicleId.HasValue && r.VehicleId.Value == vehicleId);
        var response = new ListRoutesResponse();
        foreach (var route in routes)
        {
            response.Routes.Add(MapToProto(route));
        }
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
        foreach (var route in routes)
        {
            response.Routes.Add(MapToProto(route));
        }
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
        var driverGuid = Guid.Parse(driverId);
        
        // Verificar si el conductor realmente tiene rutas activas (Assigned o Started)
        // Esto corrige el problema cuando se borra la BD de rutas pero los conductores quedan marcados como ocupados
        var activeRoutes = await _repository.FindAsync(r => 
            r.DriverId.HasValue && 
            r.DriverId.Value == driverGuid && 
            (r.Status == RouteStatesDomain.Assigned || r.Status == RouteStatesDomain.Started));
        
        // Si el conductor tiene rutas activas, no está disponible
        if (activeRoutes.Any())
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "DRIVER_NOT_AVAILABLE"));
        }
        
        // Si el conductor no tiene rutas activas pero está marcado como ocupado (availability = 2),
        // sincronizar su estado a disponible (availability = 1) antes de asignar
        var driverIsAvailable = await _driverClient.DriverIsAvailable(driverId, bearer);
        if (!driverIsAvailable)
        {
            // El conductor está marcado como ocupado pero no tiene rutas activas
            // Sincronizar su estado a disponible
            await _driverClient.SetDriverAvailability(driverId, 1, bearer);
        }
        
        route.AssignedAt = DateTimeOffset.UtcNow;
        route.DriverVehicleId = Guid.Parse(driverVehicleId);
        route.DriverId = driverGuid;
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
        var driver = await _driverClient.FindDriverByUserIdAsync(userId, bearer) ?? throw new RpcException(new Status(StatusCode.NotFound, "DRIVER_NOT_FOUND"));
        if (route.DriverId != Guid.Parse(driver))
            throw new RpcException(new Status(StatusCode.PermissionDenied, "NOT_OWNER_OF_ROUTE"));
        var driverVehicleId = route.DriverVehicleId.ToString() ?? throw new RpcException(new Status(StatusCode.InvalidArgument, "ROUTE_NOT_ASSIGNED"));
        var assignment = await _vehicleClient.GetDriverVehicleExists(driverVehicleId, bearer) ?? throw new RpcException(new Status(StatusCode.NotFound, "ASSIGNMENT_NOT_FOUND"));
        var vehicle = await _vehicleClient.GetVehicle(assignment.VehicleId, bearer) ?? throw new RpcException(new Status(StatusCode.NotFound, "VEHICLE_NOT_ASSIGNED"));
        FuelConsumptionService.CalculateEstimatedConsumption(route, (int)vehicle.Machinery, vehicle.Type, vehicle.Year, vehicle.CapacityLiters);
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
        var driver = await _driverClient.FindDriverByUserIdAsync(userId, bearer) ?? throw new RpcException(new Status(StatusCode.NotFound, "DRIVER_NOT_FOUND"));
        if (route.DriverId != Guid.Parse(driver))
            throw new RpcException(new Status(StatusCode.PermissionDenied, "NOT_OWNER_OF_ROUTE"));
        // Validar que los datos reales sean proporcionados y válidos
        if (request.RealDistanceKm <= 0)
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "REAL_DISTANCE_TRAVELED_MUST_BE_GREATER_THAN_ZERO"));
        }
        
        if (request.RealFuelConsumptionLiters <= 0)
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "REAL_FUEL_CONSUMPTION_MUST_BE_GREATER_THAN_ZERO"));
        }

        // Validar distancia real (debe ser razonable respecto a las coordenadas)
        var validatedRealDistance = await _distanceValidator.ValidateDistanceAsync(
            request.RealDistanceKm,
            route.CoordinatesStart,
            route.CoordinatesStop
        );
        
        route.CompletedAt = DateTimeOffset.UtcNow;
        route.RealDistanceKm = validatedRealDistance;
        route.RealFuelConsumptionLiters = request.RealFuelConsumptionLiters;
        route.Status = RouteStatesDomain.Completed;
        
        var vehicleId = route.VehicleId.HasValue ? route.VehicleId.Value.ToString() : throw new RpcException(new Status(StatusCode.InvalidArgument, "VEHICLE_NOT_FOUND_CORRUP_ROUTE"));
        var driverId = route.DriverId.HasValue ? route.DriverId.Value.ToString() : throw new RpcException(new Status(StatusCode.InvalidArgument, "DRIVER_NOT_FOUND_CORRUP_ROUTE"));
        
        // Obtener el vehículo para saber el tipo de maquinaria
        var vehicle = await _vehicleClient.GetVehicle(vehicleId, bearer);
        var machineryType = vehicle?.Machinery ?? 0; // 0 = LIVIANO por defecto
        
        await _vehicleClient.UpdateVehicleRouteEnded(vehicleId, route, bearer);
        await _driverClient.SetDriverAvailability(driverId, 1, bearer);
        await _repository.UpdateAsync(route);
        
        // Registrar consumo de combustible en FuelService
        try
        {
            await _fuelClient.RegisterFuelConsumption(route, (int)machineryType, bearer);
        }
        catch (Exception ex)
        {
            // Log el error pero no fallar la finalización de la ruta
            Console.WriteLine($"[RoutesService] Error al registrar consumo en FuelService: {ex.Message}");
        }
        
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

    private RouteProto MapToProto(Route route)
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