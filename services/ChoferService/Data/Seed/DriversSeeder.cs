using ChoferService.Data;
using ChoferService.Models;
using Microsoft.EntityFrameworkCore;

namespace ChoferService.Data.Seed
{
    public static class DriversSeeder
    {
        public static async Task SeedAsync(DriversDb db)
        {
            // Verificar si ya existe el conductor de prueba
            var testDriverId = Guid.Parse("60ab533e-84f0-4c85-bdc0-003ae5e2f6e0");
            var testDriverExists = await db.Drivers.AnyAsync(d => d.UserId == testDriverId);
            
            if (testDriverExists)
            {
                return; // El conductor de prueba ya existe
            }

            // Solo insertar el conductor de prueba que necesitamos
            var testDriver = new Driver
            {
                Id = Guid.NewGuid(),
                UserId = Guid.Parse("60ab533e-84f0-4c85-bdc0-003ae5e2f6e0"), // ID del conductor@conductor.com
                FullName = "Conductor del Sistema",
                LicenseNumber = "CON-001",
                Capabilities = 1, // Liviana
                Availability = 1, // Disponible
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            await db.Drivers.AddAsync(testDriver);
            await db.SaveChangesAsync();
        }
    }
}
