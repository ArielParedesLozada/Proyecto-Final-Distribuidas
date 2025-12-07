using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using RouteService.Infraestructure.Coordinates;
using RouteDomain = RouteService.Domain.Route;
namespace RouteService.Data.Databases;

public class AppDatabase : DbContext
{
    public AppDatabase(DbContextOptions<AppDatabase> options) : base(options) { }

    public DbSet<RouteDomain> Routes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<RouteDomain>(entity =>
        {

            entity.ToTable("Routes");
            entity.HasKey(r => r.Id);
            var converter = new CoordinatesConverterFactory().CreateConverter();
            entity.Property(r => r.CoordinatesStart)
                .HasColumnType("geometry(Point, 4326)")
                .HasConversion(converter);
            entity.Property(r => r.CoordinatesStop)
                .HasColumnType("geometry(Point, 4326)")
                .HasConversion(converter);
            entity.HasIndex(r => r.CoordinatesStart).HasMethod("GIST");
            entity.HasIndex(r => r.CoordinatesStop).HasMethod("GIST");
        });
    }

}