using Grpc.Core;
using Microsoft.AspNetCore.Authorization;
using RouteService.Data.Repository;
using RoutesProto;
using Google.Protobuf.WellKnownTypes;
using RouteDomain = RouteService.Domain.Route;

namespace RouteService.Services;

public class RouteService : RoutesService.RoutesServiceBase
{
    private readonly IRepository<RouteDomain, Guid> _repository;

    public RouteService(IRepository<RouteDomain, Guid> repository)
    {
        _repository = repository;
    }

    [Authorize]
    public async override Task<ListRoutesResponse> ListRoutes(ListRoutesRequest request, ServerCallContext context)
    {
        int page = request.Page <= 0 ? 1 : request.Page;
        int pageSize = request.PageSize <= 0 ? 10 : request.PageSize;

        // --- Obtener todos los registros ---
        var allRoutes = await _repository.GetAllAsync();

        // --- Calcular total de páginas ---
        int totalCount = allRoutes.Count();
        int totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        // --- Aplicar paginación ---
        var paginatedRoutes = allRoutes
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var routesProto = paginatedRoutes.Select(r => new RouteDomain
        {
            Id = r.Id,
            DriverVehicleId = r.DriverVehicleId,
            OriginName = r.OriginName ?? string.Empty,
            DestinationName = r.DestinationName ?? string.Empty,
            IsCompleted = r.IsCompleted,
            // CreatedAt = Timestamp.FromDateTime(r.CreatedAt.UtcDateTime),
            // CompletedAt = r.CompletedAt.HasValue ? Timestamp.FromDateTime(r.CompletedAt.Value.UtcDateTime) : null,
            // CoordinateStart = new Coordinate
            // {
            //     Latitude = (double)r.CoordinatesStart.Latitude,
            //     Longitude = (double)r.CoordinatesStart.Longitude
            // },
            // CoordinatesStop = new Coordinate
            // {
            //     Latitude = (double)r.CoordinatesStop.Latitude,
            //     Longitude = (double)r.CoordinatesStop.Longitude
            // },
            DistanceKm = r.DistanceKm,
            EstimatedFuelConsumptionLiters = r.EstimatedFuelConsumptionLiters,
            RealFuelConsumptionLiters = r.RealFuelConsumptionLiters
        });

        var response = new ListRoutesResponse
        {
            Page = page,
            PageSize = pageSize,
            TotalPages = totalPages
        };
        //response.Routes.AddRange(routesProto);

        return response;
    }

}