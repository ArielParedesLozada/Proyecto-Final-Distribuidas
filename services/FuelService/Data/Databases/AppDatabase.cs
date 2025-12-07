using FuelService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FuelService.Data.Databases;

public class AppDatabase : DbContext
{
    public AppDatabase(DbContextOptions<AppDatabase> options) : base(options) { }

    public DbSet<FuelRegister> FuelRegisters { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<FuelRegister>(entity =>
        {
            entity.ToTable("fuel_registers");
            entity.HasKey(r => new { r.Id, r.VehicleMachinery });

            entity.HasIndex(r => r.VehicleMachinery);
            entity.HasIndex(r => r.RouteId);
            entity.HasIndex(r => r.VehicleId);
            entity.HasIndex(r => r.DriverId);
            entity.HasIndex(r => r.CompletedAt);
            entity.HasIndex(r => r.Timestamp);
        });
    }

}