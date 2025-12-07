using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using Serilog;

namespace RouteService.Queue.Publisher;

public class FuelConsumptionPublisher
{
    private readonly string _host;
    private readonly int _port;
    private readonly string _exchange;
    private readonly string _routingKey;
    private IConnection? _connection;
    private IChannel? _channel;

    public FuelConsumptionPublisher(string host, int port, string exchange, string routingKey)
    {
        _host = host;
        _port = port;
        _exchange = exchange;
        _routingKey = routingKey;
    }

    private async Task EnsureConnectionAsync()
    {
        if (_connection?.IsOpen == true && _channel?.IsOpen == true)
            return;

        try
        {
            var factory = new ConnectionFactory
            {
                HostName = _host,
                Port = _port
            };

            _connection = await factory.CreateConnectionAsync();
            _channel = await _connection.CreateChannelAsync();

            // Declarar exchange (topic)
            await _channel.ExchangeDeclareAsync(
                exchange: _exchange,
                type: ExchangeType.Topic,
                durable: true,
                autoDelete: false
            );

            Log.Information("✅ Conexión a RabbitMQ establecida para FuelConsumptionPublisher");
        }
        catch (Exception ex)
        {
            Log.Error(ex, "❌ Error al conectar con RabbitMQ");
            throw;
        }
    }

    public async Task PublishAsync(object message)
    {
        try
        {
            await EnsureConnectionAsync();

            var json = JsonSerializer.Serialize(message);
            var body = Encoding.UTF8.GetBytes(json);

            // En RabbitMQ.Client 7.x, BasicPublishAsync usa ReadOnlyMemory<byte> y un objeto de propiedades
            var properties = new BasicProperties
            {
                Persistent = true // Mensaje persistente
            };

            await _channel!.BasicPublishAsync(
                exchange: _exchange,
                routingKey: _routingKey,
                mandatory: false,
                basicProperties: properties,
                body: new ReadOnlyMemory<byte>(body)
            );

            Log.Information("📤 Mensaje publicado en RabbitMQ: Exchange={Exchange}, RoutingKey={RoutingKey}", _exchange, _routingKey);
        }
        catch (Exception ex)
        {
            Log.Error(ex, "❌ Error al publicar mensaje en RabbitMQ");
            throw;
        }
    }

    public void Dispose()
    {
        try
        {
            _channel?.DisposeAsync().AsTask().Wait();
            _connection?.DisposeAsync().AsTask().Wait();
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Error al cerrar conexión RabbitMQ");
        }
    }
}

