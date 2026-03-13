using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ELearning.Api.Migrations
{
    public partial class AddLessonSectionsJson : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SectionsJson",
                table: "Lessons",
                type: "nvarchar(max)",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SectionsJson",
                table: "Lessons");
        }
    }
}
