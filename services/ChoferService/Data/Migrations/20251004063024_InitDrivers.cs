using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChoferService.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitDrivers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "public");

            migrationBuilder.CreateTable(
                name: "drivers",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    full_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    license_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    capabilities = table.Column<short>(type: "smallint", nullable: false, comment: "1=Liviana, 2=Pesada, 3=Ambas"),
                    availability = table.Column<short>(type: "smallint", nullable: false, comment: "1=Disponible, 2=Ocupado, 3=FueraServicio"),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_drivers", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_drivers_availability",
                schema: "public",
                table: "drivers",
                column: "availability");

            migrationBuilder.CreateIndex(
                name: "IX_drivers_capabilities",
                schema: "public",
                table: "drivers",
                column: "capabilities");

            migrationBuilder.CreateIndex(
                name: "IX_drivers_license_number_unique",
                schema: "public",
                table: "drivers",
                column: "license_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_drivers_user_id_unique",
                schema: "public",
                table: "drivers",
                column: "user_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "drivers",
                schema: "public");
        }
    }
}
