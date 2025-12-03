using System.Text;
using System.Text.Json;
using FuelService.Domain.UseCases;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace FuelService.Queue.Consumer;

public class EventConsumer<TDataConsumption> : BackgroundService
{
    private readonly IConsumptionAction<TDataConsumption> _action;
    private IChannel _channel = null!;
    private readonly string _host;
    private readonly int _port;
    private readonly string _queueName;
    private readonly string _topic;

    public EventConsumer(string host, int port, string queue, string topic, IConsumptionAction<TDataConsumption> action)
    {
        _host = host;
        _port = port;
        _queueName = queue;
        _topic = topic;
        _action = action;
    }
    protected override async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var factory = new ConnectionFactory()
        {
            HostName = _host,
            Port = _port,
        };
        var connection = await factory.CreateConnectionAsync(cancellationToken);
        _channel = await connection.CreateChannelAsync(cancellationToken: cancellationToken);
        await _channel.ExchangeDeclareAsync(
            exchange: _topic,
            type: ExchangeType.Topic,
            durable: true,
            autoDelete: false,
            cancellationToken: cancellationToken
        );
        await _channel.QueueDeclareAsync(
            queue: _queueName,
            durable: true,
            exclusive: false,
            autoDelete: false,
            cancellationToken: cancellationToken
        );
        await _channel.QueueBindAsync(
            queue: _queueName,
            exchange: _topic,
            routingKey: "#",
            cancellationToken: cancellationToken
        );
        var consumer = new AsyncEventingBasicConsumer(_channel);
        consumer.ReceivedAsync += HandleMessage;
        await _channel.BasicConsumeAsync(queue: _queueName, autoAck: false, consumer: consumer, cancellationToken: cancellationToken);
    }

    private async Task HandleMessage(object sender, BasicDeliverEventArgs ea)
    {
        try
        {
            var json = Encoding.UTF8.GetString(ea.Body.ToArray());
            var obj = JsonSerializer.Deserialize<TDataConsumption>(json);
            await _action.OnConsume(obj!);
            await _channel.BasicAckAsync(ea.DeliveryTag, false);
        }
        catch (Exception ex)
        {
            System.Console.WriteLine(ex);
            await _channel.BasicNackAsync(ea.DeliveryTag, false, true);
        }
    }
}