using ChoferService.Data;
using ChoferService.Models;
using Microsoft.EntityFrameworkCore;

namespace ChoferService.Data.Seed
{
    public static class DriversSeeder
    {
        public static Task SeedAsync(DriversDb db)
        {
            // No crear conductores automáticamente
            // Los conductores se crearán cuando los usuarios se autentiquen por primera vez
            return Task.CompletedTask;
        }
    }
}
