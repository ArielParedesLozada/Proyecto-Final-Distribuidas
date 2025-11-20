using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VehicleService.Migrations
{
    /// <inheritdoc />
    public partial class AddMachineryToVehicles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "machinery",
                schema: "public",
                table: "vehicles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddForeignKey(
                name: "FK_driver_vehicle_vehicles_vehicle_id",
                schema: "public",
                table: "driver_vehicle",
                column: "vehicle_id",
                principalSchema: "public",
                principalTable: "vehicles",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_driver_vehicle_vehicles_vehicle_id",
                schema: "public",
                table: "driver_vehicle");

            migrationBuilder.DropColumn(
                name: "machinery",
                schema: "public",
                table: "vehicles");
        }
    }
}
