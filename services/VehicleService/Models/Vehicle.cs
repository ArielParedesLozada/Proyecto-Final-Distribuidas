using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VehiclesService.Models;

public enum VehicleMachineryTypes
{
    LIVIANO = 0,
    PESADO = 1,
}

[Table("vehicles", Schema = "public")]
public class Vehicle
{
    [Key][Column("id")] public Guid Id { get; set; }

    [Required][Column("plate")] public string Plate { get; set; } = string.Empty;
    [Required][Column("machinery")] public VehicleMachineryTypes Machinery { get; set; } = VehicleMachineryTypes.LIVIANO;
    [Required][Column("type")] public string Type { get; set; } = "automovil";
    [Required][Column("brand")] public string Brand { get; set; } = string.Empty;
    [Required][Column("model")] public string Model { get; set; } = string.Empty;

    [Column("year")] public int Year { get; set; }
    [Column("capacity_liters")] public decimal CapacityLiters { get; set; }
    [Column("odometer_km")] public int OdometerKm { get; set; } = 0;

    [Column("status")] public short Status { get; set; } = 1; // 1=DISPONIBLE, 2=OCUPADO (calculado dinámicamente)

    [Column("created_at")] public DateTimeOffset CreatedAt { get; set; }
    [Column("updated_at")] public DateTimeOffset UpdatedAt { get; set; }
}
