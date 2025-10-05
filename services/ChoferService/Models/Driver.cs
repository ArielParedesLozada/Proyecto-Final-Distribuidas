using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoferService.Models;

[Table("drivers", Schema = "public")]
public class Driver
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Required]
    [Column("user_id")]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(255)]
    [Column("full_name")]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    [Column("license_number")]
    public string LicenseNumber { get; set; } = string.Empty;

    [Column("capabilities")]
    public short Capabilities { get; set; } // 1=Liviana, 2=Pesada, 3=Ambas

    [Column("availability")]
    public short Availability { get; set; } // 1=Disponible, 2=Ocupado, 3=FueraServicio

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; }
}
