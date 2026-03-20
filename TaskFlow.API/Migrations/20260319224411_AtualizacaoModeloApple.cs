using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskFlow.API.Migrations
{
    /// <inheritdoc />
    public partial class AtualizacaoModeloApple : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Text",
                table: "Products",
                newName: "Storage");

            migrationBuilder.RenameColumn(
                name: "Priority",
                table: "Products",
                newName: "Price");

            migrationBuilder.RenameColumn(
                name: "Done",
                table: "Products",
                newName: "InStock");

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Products",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Color",
                table: "Products",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "Products",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Color",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "Products");

            migrationBuilder.RenameColumn(
                name: "Storage",
                table: "Products",
                newName: "Text");

            migrationBuilder.RenameColumn(
                name: "Price",
                table: "Products",
                newName: "Priority");

            migrationBuilder.RenameColumn(
                name: "InStock",
                table: "Products",
                newName: "Done");
        }
    }
}
