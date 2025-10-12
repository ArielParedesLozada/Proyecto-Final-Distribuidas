using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VehiclesService.Models;

[Table("driver_vehicle", Schema = "public")]
public class DriverVehicle
{
    [Key] [Column("id")] public Guid Id { get; set; }

    [Column("driver_id")] public Guid DriverId { get; set; }   // ID externo (ChoferService)
    [Column("vehicle_id")] public Guid VehicleId { get; set; } // FK lógica a vehicles.id

    [Column("assigned_at")] public DateTimeOffset AssignedAt { get; set; }
    [Column("unassigned_at")] public DateTimeOffset? UnassignedAt { get; set; }
}
