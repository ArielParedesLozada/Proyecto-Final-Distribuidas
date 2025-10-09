using AuthService.Data.Databases;
using AuthService.Domain;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Data.Seed
{
    public static class UserSeeder
    {
        public static async Task SeedAsync(AppDatabase db)
        {
            // Verificar si ya existen los usuarios
            var conductorExists = await db.Users.AnyAsync(u => u.Email == "conductor@conductor.com");
            var adminExists = await db.Users.AnyAsync(u => u.Email == "admin@admin.com");
            
            // Si ambos usuarios ya existen, no hacer nada
            if (conductorExists && adminExists)
            {
                return;
            }

            // Crear el usuario admin si no existe
            if (!adminExists)
            {
                var admin = new User(
                    "admin@admin.com",
                    BCrypt.Net.BCrypt.HashPassword("admin123"), // Contraseña: admin123
                    "Administrador del Sistema",
                    "ADMIN"
                );
                await db.Users.AddAsync(admin);
            }

            // Crear el usuario conductor si no existe
            if (!conductorExists)
            {
                var conductor = new User(
                    "conductor@conductor.com",
                    BCrypt.Net.BCrypt.HashPassword("conductor123"), // Contraseña: conductor123
                    "Conductor del Sistema",
                    "CONDUCTOR"
                );
                await db.Users.AddAsync(conductor);
            }

            await db.SaveChangesAsync();
        }
    }
}
