using Microsoft.EntityFrameworkCore;
using ChoferService.Models;

namespace ChoferService.Data;

public class DriversDb : DbContext
{
    public DriversDb(DbContextOptions<DriversDb> options) : base(options)
    {
    }

    public DbSet<Driver> Drivers { get; set; }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return await base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries<Driver>();
        
        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTimeOffset.UtcNow;
                entry.Entity.UpdatedAt = DateTimeOffset.UtcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTimeOffset.UtcNow;
                // Asegurar que CreatedAt no se marque como modificado
                entry.Property(x => x.CreatedAt).IsModified = false;
            }
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configurar la entidad Driver
        modelBuilder.Entity<Driver>(entity =>
        {
            // Configurar tabla y esquema
            entity.ToTable("drivers", "public");

            // Configurar clave primaria
            entity.HasKey(e => e.Id);

            // Configurar propiedades requeridas
            entity.Property(e => e.FullName)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.LicenseNumber)
                .IsRequired()
                .HasMaxLength(50);

            // Configurar índices únicos
            entity.HasIndex(e => e.UserId)
                .IsUnique()
                .HasDatabaseName("IX_drivers_user_id_unique");

            entity.HasIndex(e => e.LicenseNumber)
                .IsUnique()
                .HasDatabaseName("IX_drivers_license_number_unique");

            // Configurar índices regulares
            entity.HasIndex(e => e.Availability)
                .HasDatabaseName("IX_drivers_availability");

            entity.HasIndex(e => e.Capabilities)
                .HasDatabaseName("IX_drivers_capabilities");

            // Configurar valores por defecto para timestamps
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Configurar valores de enum para validación
            entity.Property(e => e.Capabilities)
                .HasComment("1=Liviana, 2=Pesada, 3=Ambas");

            entity.Property(e => e.Availability)
                .HasComment("1=Disponible, 2=Ocupado, 3=FueraServicio");
        });
    }
}
