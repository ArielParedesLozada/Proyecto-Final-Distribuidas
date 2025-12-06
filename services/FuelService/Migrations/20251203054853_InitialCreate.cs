using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FuelService.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FuelConsumption",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RouteId = table.Column<Guid>(type: "uuid", nullable: false),
                    VehicleMachinery = table.Column<int>(type: "integer", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Timestamp = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    EstimatedFuelConsumptionLiters = table.Column<double>(type: "double precision", nullable: false),
                    RealFuelConsumptionLiters = table.Column<double>(type: "double precision", nullable: false),
                    RealDistanceKm = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FuelConsumption", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FuelConsumption_CompletedAt",
                table: "FuelConsumption",
                column: "CompletedAt");

            migrationBuilder.CreateIndex(
                name: "IX_FuelConsumption_RouteId",
                table: "FuelConsumption",
                column: "RouteId");

            migrationBuilder.CreateIndex(
                name: "IX_FuelConsumption_Timestamp",
                table: "FuelConsumption",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_FuelConsumption_VehicleMachinery",
                table: "FuelConsumption",
                column: "VehicleMachinery");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FuelConsumption");
        }
    }
}
