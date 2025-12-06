using FuelService.Config;
using FuelService.Data;
using FuelService.Domain.Entities;
using FuelService.Domain.UseCases;
using FuelService.Infraestructure.ConsumerFactory;
using FuelService.Queue.Consumer;
using FuelService.Queue.Events;


var builder = WebApplication.CreateBuilder(args);
DotNetEnv.Env.Load();

var CONNECTION_STRING = Environment.GetEnvironmentVariable("CONNECTION_STRING")!;
var JWT_SECRET = Environment.GetEnvironmentVariable("JWT_SECRET")!;
var JWT_ISSUER = Environment.GetEnvironmentVariable("JWT_ISSUER")!;

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services
    .AddDatabase(CONNECTION_STRING)
    .AddJwtAuth(JWT_SECRET, 2, JWT_ISSUER);
builder.Services.AddScoped<IConsumptionAction<FuelRegisterEvent>, RouteEndedConsumptionAction>();
builder.Services.AddScoped<EventConsumerFactory<FuelRegisterEvent>>();
builder.Services.AddHostedService(sp =>
{
    using var scope = sp.CreateScope();
    var scopedProvider = scope.ServiceProvider;
    var host = Environment.GetEnvironmentVariable("RABBIT_HOST") ?? "localhost";
    var port = int.Parse(Environment.GetEnvironmentVariable("RABBIT_PORT") ?? "5672");
    var queue = Environment.GetEnvironmentVariable("ROUTES_ENDED_QUEUE") ?? "routes_ended_queue";
    var topic = Environment.GetEnvironmentVariable("FUEL_EVENTS_TOPIC") ?? "fuel_events";
    var factory = scopedProvider.GetRequiredService<EventConsumerFactory<FuelRegisterEvent>>();
    var inner = factory.Create(host, port, queue, topic);
    return new FuelRegisterEventConsumer(inner);
});

builder.Services.AddControllers();
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.MapControllers();

app.MapGet("/mq", () =>
{
    return "Estoy bien";
});

app.Run();
