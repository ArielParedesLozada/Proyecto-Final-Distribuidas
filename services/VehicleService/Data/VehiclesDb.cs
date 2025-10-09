using Microsoft.EntityFrameworkCore;
using VehiclesService.Models;

namespace VehiclesService.Data;

public class VehiclesDb : DbContext
{
    public VehiclesDb(DbContextOptions<VehiclesDb> options) : base(options) { }

    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<DriverVehicle> DriverVehicles => Set<DriverVehicle>();

    public override int SaveChanges()
    {
        TouchTimestamps();
        return base.SaveChanges();
    }
    public override Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        TouchTimestamps();
        return base.SaveChangesAsync(ct);
    }

    private void TouchTimestamps()
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var e in ChangeTracker.Entries<Vehicle>())
        {
            if (e.State == EntityState.Added) { e.Entity.CreatedAt = now; e.Entity.UpdatedAt = now; }
            if (e.State == EntityState.Modified) { e.Entity.UpdatedAt = now; e.Property(x => x.CreatedAt).IsModified = false; }
        }
    }

    protected override void OnModelCreating(ModelBuilder model)
    {
        base.OnModelCreating(model);

        model.Entity<Vehicle>(e =>
        {
            e.ToTable("vehicles", "public", t => 
                t.HasCheckConstraint("CK_vehicles_year", $"year BETWEEN 1980 AND {(DateTime.UtcNow.Year + 1)}"));
            
            e.HasIndex(x => x.Plate).IsUnique().HasDatabaseName("IX_vehicles_plate_unique");
            e.HasIndex(x => x.Status).HasDatabaseName("IX_vehicles_status");
            e.HasIndex(x => x.Type).HasDatabaseName("IX_vehicles_type");

            e.Property(x => x.CapacityLiters).HasColumnType("numeric(10,2)");
            e.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            e.Property(x => x.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            e.Property(x => x.OdometerKm).HasDefaultValue(0);
        });

        model.Entity<DriverVehicle>(e =>
        {
            e.ToTable("driver_vehicle", "public");
            e.HasIndex(x => x.DriverId).HasDatabaseName("IX_driver_vehicle_driver");
            // 1 asignación activa por vehículo (índice único parcial)
            e.HasIndex(x => x.VehicleId).IsUnique()
                .HasDatabaseName("UQ_driver_vehicle_active")
                .HasFilter("\"unassigned_at\" IS NULL");
        });
    }
}
