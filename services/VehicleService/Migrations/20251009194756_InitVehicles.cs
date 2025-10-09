using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VehicleService.Migrations
{
    /// <inheritdoc />
    public partial class InitVehicles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "public");

            migrationBuilder.CreateTable(
                name: "driver_vehicle",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    driver_id = table.Column<Guid>(type: "uuid", nullable: false),
                    vehicle_id = table.Column<Guid>(type: "uuid", nullable: false),
                    assigned_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    unassigned_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_driver_vehicle", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "vehicles",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    plate = table.Column<string>(type: "text", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    brand = table.Column<string>(type: "text", nullable: false),
                    model = table.Column<string>(type: "text", nullable: false),
                    year = table.Column<int>(type: "integer", nullable: false),
                    capacity_liters = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    odometer_km = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    status = table.Column<short>(type: "smallint", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vehicles", x => x.id);
                    table.CheckConstraint("CK_vehicles_year", "year BETWEEN 1980 AND 2026");
                });

            migrationBuilder.CreateIndex(
                name: "IX_driver_vehicle_driver",
                schema: "public",
                table: "driver_vehicle",
                column: "driver_id");

            migrationBuilder.CreateIndex(
                name: "UQ_driver_vehicle_active",
                schema: "public",
                table: "driver_vehicle",
                column: "vehicle_id",
                unique: true,
                filter: "\"unassigned_at\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_vehicles_plate_unique",
                schema: "public",
                table: "vehicles",
                column: "plate",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_vehicles_status",
                schema: "public",
                table: "vehicles",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_vehicles_type",
                schema: "public",
                table: "vehicles",
                column: "type");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "driver_vehicle",
                schema: "public");

            migrationBuilder.DropTable(
                name: "vehicles",
                schema: "public");
        }
    }
}
