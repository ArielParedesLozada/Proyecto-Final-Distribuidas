using System.Text;
using System.Text.Json;
using FuelService.Domain.UseCases;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using RabbitMQ.Client.Exceptions;
using Serilog;

namespace FuelService.Queue.Consumer;

public class EventConsumer<TDataConsumption> : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly string _host;
    private readonly int _port;
    private readonly string _queueName;
    private readonly string _topic;
    private readonly int _maxRetries = 10;
    private readonly TimeSpan _retryDelay = TimeSpan.FromSeconds(5);

    private IChannel _channel = null!;

    public EventConsumer(
        string host,
        int port,
        string queue,
        string topic,
        IServiceScopeFactory scopeFactory)
    {
        _host = host;
        _port = port;
        _queueName = queue;
        _topic = topic;
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                await ConnectAndConsumeAsync(cancellationToken);
            }
            catch (BrokerUnreachableException ex)
            {
                Log.Warning(ex, "⚠️ RabbitMQ no está disponible en {Host}:{Port}. Reintentando en {Delay} segundos...", 
                    _host, _port, _retryDelay.TotalSeconds);
                
                // Esperar antes de reintentar
                await Task.Delay(_retryDelay, cancellationToken);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "❌ Error inesperado en EventConsumer. Reintentando en {Delay} segundos...", 
                    _retryDelay.TotalSeconds);
                await Task.Delay(_retryDelay, cancellationToken);
            }
        }
    }

    private async Task ConnectAndConsumeAsync(CancellationToken cancellationToken)
    {
        var factory = new ConnectionFactory()
        {
            HostName = _host,
            Port = _port,
            AutomaticRecoveryEnabled = true,
            NetworkRecoveryInterval = TimeSpan.FromSeconds(10)
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
            
            Log.Debug("✅ Mensaje procesado correctamente");
        }
        catch (Exception e)
        {
            System.Console.WriteLine($"ERROR: {e.Message}");
            await _channel.BasicNackAsync(ea.DeliveryTag, false, true);
        }
    }
}