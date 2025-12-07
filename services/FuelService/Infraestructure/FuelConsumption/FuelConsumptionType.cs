using FuelService.Domain.Entities;
using FuelService.Queue.Events;
using VehicleMachineryTypes = FuelService.Domain.Entities.VehicleMachineryTypes;

namespace FuelService.Infraestructure.FuelConsumption;

public class FuelConsumptionType
{
    private const double NORMAL_TOLERANCE = 0.15;
    private const double WARNING_TOLERANCE = 0.35;
    private const double DANGER_MULTIPLIER = 1.7;

    public static FuelRegister CreateFuelRegister(FuelRegisterEvent @event)
    {
        var fuelRegister = new FuelRegister
        {
            Id = Guid.NewGuid(),
            RouteId = @event.RouteId,
            DriverId = @event.DriverId,
            VehicleId = @event.VehicleId,
            VehicleMachinery = (VehicleMachineryTypes)@event.VehicleMachinery,
            CompletedAt = @event.CompletedAt,
            StartedAt = @event.StartedAt,
            EstimatedFuelConsumptionLiters = @event.EstimatedFuelConsumptionLiters,
            RealFuelConsumptionLiters = @event.RealFuelConsumptionLiters,
            RealDistanceKm = @event.RealDistanceKm,
            Timestamp = DateTimeOffset.UtcNow,
            Type = DetermineFuelRegisterType(@event)
        };
        return fuelRegister;
    }

    private static FuelRegisterType DetermineFuelRegisterType(FuelRegisterEvent @event)
    {
        if (@event.EstimatedFuelConsumptionLiters <= 0 ||
            @event.RealFuelConsumptionLiters <= 0 ||
            @event.RealDistanceKm <= 0)
        {
            return FuelRegisterType.DANGER;
        }
        if (@event.RealFuelConsumptionLiters >= @event.EstimatedFuelConsumptionLiters * DANGER_MULTIPLIER)
        {
            return FuelRegisterType.DANGER;
        }
        if (@event.RealFuelConsumptionLiters <= @event.EstimatedFuelConsumptionLiters * 0.3)
        {
            return FuelRegisterType.DANGER;
        }

        double difference = @event.RealFuelConsumptionLiters - @event.EstimatedFuelConsumptionLiters;
        double percentageDifference = Math.Abs(difference / @event.EstimatedFuelConsumptionLiters);

        if (percentageDifference <= NORMAL_TOLERANCE)
        {
            return FuelRegisterType.NORMAL;
        }
        else if (percentageDifference <= WARNING_TOLERANCE)
        {
            return FuelRegisterType.WARNING;
        }
        else
        {
            return FuelRegisterType.DANGER;
        }
    }
}