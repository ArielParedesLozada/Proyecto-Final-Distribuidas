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
    private readonly IConsumptionAction<TDataConsumption> _action;
    private IChannel? _channel;
    private IConnection? _connection;
    private readonly string _host;
    private readonly int _port;
    private readonly string _queueName;
    private readonly string _topic;
    private readonly int _maxRetries = 10;
    private readonly TimeSpan _retryDelay = TimeSpan.FromSeconds(5);

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

        Log.Information("🔌 Intentando conectar a RabbitMQ en {Host}:{Port}...", _host, _port);
        
        _connection = await factory.CreateConnectionAsync(cancellationToken);
        _channel = await _connection.CreateChannelAsync(cancellationToken: cancellationToken);
        
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
        
        Log.Information("✅ Conectado a RabbitMQ. Escuchando en queue: {QueueName}, exchange: {Exchange}", 
            _queueName, _topic);
        
        var consumer = new AsyncEventingBasicConsumer(_channel);
        consumer.ReceivedAsync += HandleMessage;
        
        await _channel.BasicConsumeAsync(
            queue: _queueName, 
            autoAck: false, 
            consumer: consumer, 
            cancellationToken: cancellationToken
        );

        // Esperar hasta que se cancele
        await Task.Delay(Timeout.Infinite, cancellationToken);
    }

    private async Task HandleMessage(object sender, BasicDeliverEventArgs ea)
    {
        if (_channel == null)
        {
            Log.Warning("⚠️ Canal no disponible para procesar mensaje");
            return;
        }

        try
        {
            var json = Encoding.UTF8.GetString(ea.Body.ToArray());
            var obj = JsonSerializer.Deserialize<TDataConsumption>(json);
            
            if (obj == null)
            {
                Log.Warning("⚠️ No se pudo deserializar el mensaje");
                await _channel.BasicNackAsync(ea.DeliveryTag, false, false);
                return;
            }
            
            await _action.OnConsume(obj);
            await _channel.BasicAckAsync(ea.DeliveryTag, false);
            
            Log.Debug("✅ Mensaje procesado correctamente");
        }
        catch (Exception ex)
        {
            Log.Error(ex, "❌ Error al procesar mensaje. Rechazando mensaje.");
            try
            {
                await _channel.BasicNackAsync(ea.DeliveryTag, false, true);
            }
            catch (Exception nackEx)
            {
                Log.Error(nackEx, "❌ Error al hacer NACK del mensaje");
            }
        }
    }

    public override void Dispose()
    {
        try
        {
            _channel?.CloseAsync().AsTask().Wait();
            _connection?.CloseAsync().AsTask().Wait();
            _channel?.Dispose();
            _connection?.Dispose();
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "⚠️ Error al cerrar conexión RabbitMQ");
        }
        base.Dispose();
    }
}