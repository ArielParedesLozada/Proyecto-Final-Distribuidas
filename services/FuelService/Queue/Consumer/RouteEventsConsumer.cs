using FuelService.Data;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
namespace FuelService.Queue.Consumer;

public class RouteEventsConsumer : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var factory = new ConnectionFactory()
        {
            HostName = "localhost",
        };

        var connection = await factory.CreateConnectionAsync(stoppingToken);
        var channel = await connection.CreateChannelAsync(cancellationToken: stoppingToken);

        await channel.QueueDeclareAsync(
            queue: "route.events",
            durable: true,
            exclusive: false,
            autoDelete: false,
            cancellationToken: stoppingToken
        );

        var consumer = new AsyncEventingBasicConsumer(channel);
        consumer.ReceivedAsync += async (_, ea) =>
        {
            var json = Encoding.UTF8.GetString(ea.Body.ToArray());

            // TODO: aquí procesas el evento
            Console.WriteLine($"EVENT RECEIVED: {json}");
            BasicDataSingleton.GetBasicDataSingleton().Data.Add(json);
            await channel.BasicAckAsync(ea.DeliveryTag, multiple: false);
        };

        await channel.BasicConsumeAsync("route.events", autoAck: false, consumer, cancellationToken: stoppingToken);

        return;
    }
}
