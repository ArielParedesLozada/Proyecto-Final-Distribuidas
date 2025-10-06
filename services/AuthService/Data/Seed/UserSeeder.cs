using AuthService.Data.Databases;
using AuthService.Domain;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Data.Seed
{
    public static class UserSeeder
    {
        public static async Task SeedAsync(AppDatabase db)
        {
            // Verificar si ya existe el usuario conductor
            var conductorExists = await db.Users.AnyAsync(u => u.Email == "conductor@conductor.com");
            
            if (conductorExists)
            {
                return; // El usuario conductor ya existe
            }

            // Crear el usuario conductor
            var conductor = new User(
                "conductor@conductor.com",
                BCrypt.Net.BCrypt.HashPassword("conductor123"), // Contraseña: conductor123
                "Conductor del Sistema",
                "CONDUCTOR"
            );

            await db.Users.AddAsync(conductor);
            await db.SaveChangesAsync();
        }
    }
}
