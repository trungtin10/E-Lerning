using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ELearning.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTotalLearningTimeMinutes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TotalLearningTimeMinutes",
                table: "CourseEnrollments",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TotalLearningTimeMinutes",
                table: "CourseEnrollments");
        }
    }
}
