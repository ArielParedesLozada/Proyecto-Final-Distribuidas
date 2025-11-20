using Grpc.Core;
using RoutesProto;
using RouteDomain = RouteService.Domain.Route;
using RouteStatesDomain = RouteService.Domain.RouteStates;
namespace RouteService.Infraestructure.UseCases;

class EditRouteCheckings
{
    public static void CheckEditIsValid(RouteDomain routeToUpdate, EditRouteRequest request)
    {
        if (routeToUpdate.Status is RouteStatesDomain.Started or RouteStatesDomain.Completed or RouteStatesDomain.Assigned)
            throw new RpcException(new Status(StatusCode.InvalidArgument, "ROUTE_NOT_EDITABLE"));
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
            if (!Guid.TryParse(request.DriverVehicleId, out _))
                throw new RpcException(new Status(StatusCode.InvalidArgument, "DRIVER_VEHICLE_ID_INVALID"));
        }

        if (request.CoordinateStart != null)
        {
            if (!IsValidLatLon(request.CoordinateStart.Latitude, request.CoordinateStart.Longitude))
                throw new RpcException(new Status(StatusCode.InvalidArgument, "INVALID_START_COORDINATES"));
        }

        if (request.CoordinateStop != null)
        {
            if (!IsValidLatLon(request.CoordinateStop.Latitude, request.CoordinateStop.Longitude))
                throw new RpcException(new Status(StatusCode.InvalidArgument, "INVALID_STOP_COORDINATES"));
        }
    }

    private static bool IsValidLatLon(double lat, double lon)
    {
        return lat is >= -90 and <= 90 && lon is >= -180 and <= 180;
    }
}