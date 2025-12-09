//
using FuelService.Config;
using FuelService.Data;
using FuelService.Data.Databases;
using FuelService.Domain.Entities;
using FuelService.Domain.UseCases;
// using FuelService.Infraestructure.ConsumerFactory;
using FuelService.Queue.Consumer;
using FuelService.Queue.Events;
using Microsoft.EntityFrameworkCore;
using Steeltoe.Discovery.Eureka;


var builder = WebApplication.CreateBuilder(args);
DotNetEnv.Env.Load();

var CONNECTION_STRING = Environment.GetEnvironmentVariable("CONNECTION_STRING")!;
var JWT_SECRET = Environment.GetEnvironmentVariable("JWT_SECRET")!;
var JWT_ISSUER = Environment.GetEnvironmentVariable("JWT_ISSUER")!;
var RABBITMQ_HOST = Environment.GetEnvironmentVariable("RABBIT_HOST") ?? "localhost";
var RABBITMQ_PORT = int.Parse(Environment.GetEnvironmentVariable("RABBIT_PORT") ?? "5672");
var QUEUE_NAME = Environment.GetEnvironmentVariable("ROUTES_ENDED_QUEUE") ?? "routes_ended_queue";

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services
    .AddDatabase(CONNECTION_STRING)
    .AddJwtAuth(JWT_SECRET, 2, JWT_ISSUER)
    .AddEurekaDiscoveryClient();
builder.Services.AddScoped<IConsumptionAction<FuelRegisterEvent>, RouteEndedConsumptionAction>();

builder.Services.AddHostedService(sp =>
{

    var scopeFactory = sp.GetRequiredService<IServiceScopeFactory>();

    return new EventConsumer<FuelRegisterEvent>(
        host: RABBITMQ_HOST,
        port: RABBITMQ_PORT,
        queue: QUEUE_NAME,
        topic: "fuel_events",
        scopeFactory: scopeFactory
    );
});

builder.Services.AddControllers();
var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDatabase>();
    await db.Database.MigrateAsync();
}


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
