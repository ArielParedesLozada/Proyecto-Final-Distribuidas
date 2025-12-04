using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FuelService.Migrations
{
    /// <inheritdoc />
    public partial class AddVehicleAndDriverIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "DriverId",
                table: "FuelConsumption",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "VehicleId",
                table: "FuelConsumption",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_FuelConsumption_DriverId",
                table: "FuelConsumption",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_FuelConsumption_VehicleId",
                table: "FuelConsumption",
                column: "VehicleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_FuelConsumption_DriverId",
                table: "FuelConsumption");

            migrationBuilder.DropIndex(
                name: "IX_FuelConsumption_VehicleId",
                table: "FuelConsumption");

            migrationBuilder.DropColumn(
                name: "DriverId",
                table: "FuelConsumption");

            migrationBuilder.DropColumn(
                name: "VehicleId",
                table: "FuelConsumption");
        }
    }
}
