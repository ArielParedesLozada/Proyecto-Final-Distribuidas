using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FuelService.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "fuel_registers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VehicleMachinery = table.Column<int>(type: "integer", nullable: false),
                    RouteId = table.Column<Guid>(type: "uuid", nullable: false),
                    DriverId = table.Column<Guid>(type: "uuid", nullable: false),
                    VehicleId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Timestamp = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    EstimatedFuelConsumptionLiters = table.Column<double>(type: "double precision", nullable: false),
                    RealFuelConsumptionLiters = table.Column<double>(type: "double precision", nullable: false),
                    RealDistanceKm = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fuel_registers", x => new { x.Id, x.VehicleMachinery });
                });

            migrationBuilder.CreateIndex(
                name: "IX_fuel_registers_VehicleMachinery",
                table: "fuel_registers",
                column: "VehicleMachinery");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "fuel_registers");
        }
    }
}
