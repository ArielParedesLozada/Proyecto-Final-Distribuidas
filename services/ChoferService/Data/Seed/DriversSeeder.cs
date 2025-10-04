using ChoferService.Data;
using ChoferService.Models;
using Microsoft.EntityFrameworkCore;

namespace ChoferService.Data.Seed
{
    public static class DriversSeeder
    {
        public static async Task SeedAsync(DriversDb db)
        {
            // Solo insertar datos si la tabla está vacía
            if (await db.Drivers.AnyAsync())
            {
                return; // Ya hay datos, no insertar
            }

            var drivers = new List<Driver>
            {
                new Driver
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    FullName = "Chofer Liviana",
                    LicenseNumber = "LIC-001",
                    Capabilities = 1, // Liviana
                    Availability = 1, // Disponible
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                },
                new Driver
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    FullName = "Chofer Pesada",
                    LicenseNumber = "LIC-002",
                    Capabilities = 2, // Pesada
                    Availability = 1, // Disponible
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                },
                new Driver
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                    FullName = "Chofer Ambos",
                    LicenseNumber = "LIC-003",
                    Capabilities = 3, // Ambas
                    Availability = 1, // Disponible
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                }
            };

            await db.Drivers.AddRangeAsync(drivers);
            await db.SaveChangesAsync();
        }
    }
}
