// using FuelService.Domain.UseCases;
// using FuelService.Queue.Consumer;
// namespace FuelService.Infraestructure.ConsumerFactory;
// public class EventConsumerFactory<T>
// {
//     private readonly IServiceProvider _serviceProvider;

//     public EventConsumerFactory(IServiceProvider serviceProvider)
//     {
//         _serviceProvider = serviceProvider;
//     }

//     public EventConsumer<T> Create(string host, int port, string queue, string topic)
//     {
//         var action = _serviceProvider.GetRequiredService<IConsumptionAction<T>>();

//         return new EventConsumer<T>(
//             host: host,
//             port: port,
//             queue: queue,
//             topic: topic,
//             action: action
//         );
//     }
// }
