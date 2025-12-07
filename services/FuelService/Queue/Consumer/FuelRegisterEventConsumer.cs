using FuelService.Domain.Entities;
using FuelService.Domain.UseCases;
using FuelService.Queue.Events;

namespace FuelService.Queue.Consumer;

public class FuelRegisterEventConsumer : BackgroundService
{
    private readonly EventConsumer<FuelRegisterEvent> _inner;

    public FuelRegisterEventConsumer(EventConsumer<FuelRegisterEvent> inner)
    {
        _inner = inner;
    }

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
        => _inner.StartAsync(stoppingToken);
}