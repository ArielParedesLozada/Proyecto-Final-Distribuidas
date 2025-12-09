using System.Text;
using System.Text.Json;
using FuelService.Domain.UseCases;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace FuelService.Queue.Consumer;

public class EventConsumer<TDataConsumption> : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly string _host;
    private readonly int _port;
    private readonly string _queueName;
    private readonly string _topic;
    private IChannel _channel = null!;
    private ILogger<EventConsumer<TDataConsumption>> _logger;
    public EventConsumer(
        ILogger<EventConsumer<TDataConsumption>> logger,
        string host,
        int port,
        string queue,
        string topic,
        IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _host = host;
        _port = port;
        _queueName = queue;
        _topic = topic;
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var factory = new ConnectionFactory()
        {
            HostName = _host,
            Port = _port,
        };

        var connection = await factory.CreateConnectionAsync(cancellationToken);
        _channel = await connection.CreateChannelAsync(cancellationToken: cancellationToken); // <--- Guardamos el canal

        await _channel.ExchangeDeclareAsync(_topic, ExchangeType.Topic, durable: true, cancellationToken: cancellationToken);
        await _channel.QueueDeclareAsync(_queueName, durable: true, exclusive: false, autoDelete: false, cancellationToken: cancellationToken);
        await _channel.QueueBindAsync(_queueName, _topic, routingKey: "#", cancellationToken: cancellationToken);

        var consumer = new AsyncEventingBasicConsumer(_channel);
        consumer.ReceivedAsync += HandleMessage;

        await _channel.BasicConsumeAsync(_queueName, autoAck: false, consumer: consumer, cancellationToken: cancellationToken);
    }

    private async Task HandleMessage(object sender, BasicDeliverEventArgs ea)
    {
        using var scope = _scopeFactory.CreateScope();
        var action = scope.ServiceProvider.GetRequiredService<IConsumptionAction<TDataConsumption>>();

        try
        {
            var json = Encoding.UTF8.GetString(ea.Body.ToArray());
            var obj = JsonSerializer.Deserialize<TDataConsumption>(json);

            await action.OnConsume(obj!);
            await _channel.BasicAckAsync(ea.DeliveryTag, false);
        }
        catch (Exception e)
        {
            System.Console.WriteLine($"ERROR: {e.Message}");
            _logger.LogError(e, "Ocurrio el error al recibir un mensaje");
            await _channel.BasicNackAsync(ea.DeliveryTag, false, true);
        }
    }
}