using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FuelService.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDistributedMachinery : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("SELECT create_distributed_table('fuel_registers', 'VehicleMachinery');");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("SELECT undistribute_table('fuel_registers');");
        }
    }
}
