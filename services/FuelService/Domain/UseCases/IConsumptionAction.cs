namespace FuelService.Domain.UseCases;

public interface IConsumptionAction<T>
{
    public Task OnConsume(T data);
}