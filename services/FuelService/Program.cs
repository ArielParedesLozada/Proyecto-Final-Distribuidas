//
using FuelService.Config;
using FuelService.Data.Databases;
using FuelService.Domain.UseCases;
// using FuelService.Infraestructure.ConsumerFactory;
using FuelService.Queue.Consumer;
using FuelService.Queue.Events;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Serilog.Events;
using Steeltoe.Discovery.Eureka;


var builder = WebApplication.CreateBuilder(args);
DotNetEnv.Env.Load();

var CONNECTION_STRING = Environment.GetEnvironmentVariable("CONNECTION_STRING")!;
var JWT_SECRET = Environment.GetEnvironmentVariable("JWT_SECRET")!;
var JWT_TIME = int.Parse(Environment.GetEnvironmentVariable("JWT_TIME") ?? "2");
var JWT_ISSUER = Environment.GetEnvironmentVariable("JWT_ISSUER")!;
var RABBITMQ_HOST = Environment.GetEnvironmentVariable("RABBIT_HOST") ?? "localhost";
var RABBITMQ_PORT = int.Parse(Environment.GetEnvironmentVariable("RABBIT_PORT") ?? "5672");
var QUEUE_NAME = Environment.GetEnvironmentVariable("QUEUE_NAME") ?? "routes_ended_queue";
var PORT = int.Parse(Environment.GetEnvironmentVariable("PORT") ?? "5126");
var SEQ_URL = Environment.GetEnvironmentVariable("SEQ_URL") ?? "http://localhost:5341";
// Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.Seq(SEQ_URL)
    .CreateLogger();

builder.Host.UseSerilog(Log.Logger);
builder.WebHost.ConfigureKestrelPorts(PORT);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services
    .AddDatabase(CONNECTION_STRING)
    .AddJwtAuth(JWT_SECRET, JWT_TIME, JWT_ISSUER)
    .AddEurekaDiscoveryClient();
builder.Services.AddScoped<IConsumptionAction<FuelRegisterEvent>, RouteEndedConsumptionAction>();

builder.Services.AddHostedService(sp =>
{

    var scopeFactory = sp.GetRequiredService<IServiceScopeFactory>();
    var logger = sp.GetRequiredService<ILogger<EventConsumer<FuelRegisterEvent>>>();

    return new EventConsumer<FuelRegisterEvent>(
        logger: logger,
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

app.UseSerilogRequestLogging();
app.MapControllers();

app.MapGet("/health", () => "Estoy bien");

app.Run();
