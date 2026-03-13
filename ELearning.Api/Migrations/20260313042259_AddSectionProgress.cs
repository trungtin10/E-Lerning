using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ELearning.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSectionProgress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SectionProgresses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    SectionId = table.Column<int>(type: "int", nullable: false),
                    VideoWatched = table.Column<bool>(type: "bit", nullable: false),
                    ContentRead = table.Column<bool>(type: "bit", nullable: false),
                    QuizCompleted = table.Column<bool>(type: "bit", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SectionProgresses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SectionProgresses_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SectionProgresses_LessonSections_SectionId",
                        column: x => x.SectionId,
                        principalTable: "LessonSections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SectionProgresses_SectionId",
                table: "SectionProgresses",
                column: "SectionId");

            migrationBuilder.CreateIndex(
                name: "IX_SectionProgresses_UserId_SectionId",
                table: "SectionProgresses",
                columns: new[] { "UserId", "SectionId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SectionProgresses");
        }
    }
}
