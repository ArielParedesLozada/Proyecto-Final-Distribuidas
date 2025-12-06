using FuelService.Data.Repository;
using FuelService.Domain.Entities;
using FuelService.Infraestructure.FuelConsumption;
using FuelService.Queue.Events;

namespace FuelService.Domain.UseCases;

public class RouteEndedConsumptionAction : IConsumptionAction<FuelRegisterEvent>
{
    private readonly IRepository<FuelRegister, Guid> _repository;
    public RouteEndedConsumptionAction(IRepository<FuelRegister, Guid> repository)
    {
        _repository = repository;
    }
    public async Task OnConsume(FuelRegisterEvent message)
    {
        var fuelRegistry = FuelConsumptionType.CreateFuelRegister(message);
        await _repository.CreateAsync(fuelRegistry);
        await Task.CompletedTask;
    }


}