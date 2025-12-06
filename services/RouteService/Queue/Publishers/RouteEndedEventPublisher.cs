using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using RouteService.Queue.Publishers;

public class RabbitRouteEventPublisher : IRouteEventPublisher
{
    private readonly ConnectionFactory _factory;
    private readonly string _exchangeName;

    public RabbitRouteEventPublisher(ConnectionFactory factory, string exchangeName = "fuel_events")
    {
        _factory = factory;
        _exchangeName = exchangeName;
    }

    public async Task PublishRouteEndedAsync(string topic, object @event)
    {
        await using var connection = await _factory.CreateConnectionAsync();
        await using var channel = await connection.CreateChannelAsync();

        await channel.ExchangeDeclareAsync(
            exchange: _exchangeName,
            type: ExchangeType.Topic,
            durable: true,
            autoDelete: false
        );

        // Serializar evento
        var json = JsonSerializer.Serialize(@event);
        var body = Encoding.UTF8.GetBytes(json);

        // Publicación async
        await channel.BasicPublishAsync(
            exchange: _exchangeName,
            routingKey: topic,
            mandatory: false,
            body: body
        );

        Console.WriteLine($"[x] Sent '{topic}': {json}");
    }
}