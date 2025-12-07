using FuelService.Data.Databases;
using FuelService.Data.Repository;
using FuelService.Domain.Entities;
using FuelService.Domain.Events;
using Microsoft.EntityFrameworkCore;
using Serilog;

namespace FuelService.Domain.UseCases;

public class RegisterFuelConsumptionAction : IConsumptionAction<FuelConsumptionMessage>
{
    private readonly AppDatabase _db;
    private readonly IRepository<FuelRegister, Guid> _repository;

    public RegisterFuelConsumptionAction(AppDatabase db, IRepository<FuelRegister, Guid> repository)
    {
        _db = db;
        _repository = repository;
    }

    public async Task OnConsume(FuelConsumptionMessage message)
    {
        try
        {
            Log.Information("📨 Recibido mensaje de consumo de combustible para ruta {RouteId}", message.RouteId);

            // Verificar si ya existe un registro para esta ruta
            var existing = await _db.FuelRegisters
                .FirstOrDefaultAsync(r => r.RouteId == Guid.Parse(message.RouteId));

            if (existing != null)
            {
                // Actualizar registro existente
                existing.VehicleId = !string.IsNullOrEmpty(message.VehicleId) ? Guid.Parse(message.VehicleId) : existing.VehicleId;
                existing.DriverId = !string.IsNullOrEmpty(message.DriverId) ? Guid.Parse(message.DriverId) : existing.DriverId;
                existing.VehicleMachinery = (VehicleMachineryTypes)message.MachineryType;
                existing.EstimatedFuelConsumptionLiters = message.EstimatedFuelConsumptionLiters;
                existing.RealFuelConsumptionLiters = message.RealFuelConsumptionLiters;
                existing.RealDistanceKm = message.RealDistanceKm;
                if (DateTimeOffset.TryParse(message.CompletedAt, out var completedAt))
                {
                    existing.CompletedAt = completedAt;
                }
                existing.Timestamp = DateTimeOffset.UtcNow;

                await _repository.UpdateAsync(existing);
                Log.Information("✅ Registro de combustible actualizado para ruta {RouteId}", message.RouteId);
            }
            else
            {
                // Crear nuevo registro
                var fuelRegister = new FuelRegister
                {
                    Id = Guid.NewGuid(),
                    RouteId = Guid.Parse(message.RouteId),
                    VehicleId = !string.IsNullOrEmpty(message.VehicleId) ? Guid.Parse(message.VehicleId) : null,
                    DriverId = !string.IsNullOrEmpty(message.DriverId) ? Guid.Parse(message.DriverId) : null,
                    VehicleMachinery = (VehicleMachineryTypes)message.MachineryType,
                    Type = FuelRegisterType.NORMAL,
                    EstimatedFuelConsumptionLiters = message.EstimatedFuelConsumptionLiters,
                    RealFuelConsumptionLiters = message.RealFuelConsumptionLiters,
                    RealDistanceKm = message.RealDistanceKm,
                    Timestamp = DateTimeOffset.UtcNow
                };

                if (DateTimeOffset.TryParse(message.CompletedAt, out var completedAt))
                {
                    fuelRegister.CompletedAt = completedAt;
                }
                else
                {
                    fuelRegister.CompletedAt = DateTimeOffset.UtcNow;
                }

                await _repository.CreateAsync(fuelRegister);
                Log.Information("✅ Registro de combustible creado para ruta {RouteId}", message.RouteId);
            }
        }
        catch (Exception ex)
        {
            Log.Error(ex, "❌ Error al procesar mensaje de consumo de combustible para ruta {RouteId}", message.RouteId);
            throw; // Re-lanzar para que RabbitMQ reintente
        }
    }
}

