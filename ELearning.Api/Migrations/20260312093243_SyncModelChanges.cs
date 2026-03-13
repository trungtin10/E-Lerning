using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ELearning.Api.Migrations
{
    /// <inheritdoc />
    public partial class SyncModelChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "VideoUrl",
                table: "Lessons",
                newName: "VideoUrl5");

            migrationBuilder.AddColumn<int>(
                name: "LessonId",
                table: "Quizzes",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SectionNumber",
                table: "Quizzes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ExternalVideoUrl1",
                table: "Lessons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalVideoUrl2",
                table: "Lessons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalVideoUrl3",
                table: "Lessons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalVideoUrl4",
                table: "Lessons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalVideoUrl5",
                table: "Lessons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Section5Title",
                table: "Lessons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ShowQuiz1",
                table: "Lessons",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ShowQuiz2",
                table: "Lessons",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ShowQuiz3",
                table: "Lessons",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ShowQuiz4",
                table: "Lessons",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ShowQuiz5",
                table: "Lessons",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ShowVideo1",
                table: "Lessons",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ShowVideo2",
                table: "Lessons",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ShowVideo3",
                table: "Lessons",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ShowVideo4",
                table: "Lessons",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ShowVideo5",
                table: "Lessons",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "VideoUrl1",
                table: "Lessons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VideoUrl2",
                table: "Lessons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VideoUrl3",
                table: "Lessons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VideoUrl4",
                table: "Lessons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IntroExternalVideoUrl",
                table: "Courses",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IntroVideoUrl",
                table: "Courses",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ShowIntroVideo",
                table: "Courses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Quizzes_LessonId",
                table: "Quizzes",
                column: "LessonId");

            migrationBuilder.AddForeignKey(
                name: "FK_Quizzes_Lessons_LessonId",
                table: "Quizzes",
                column: "LessonId",
                principalTable: "Lessons",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Quizzes_Lessons_LessonId",
                table: "Quizzes");

            migrationBuilder.DropIndex(
                name: "IX_Quizzes_LessonId",
                table: "Quizzes");

            migrationBuilder.DropColumn(
                name: "LessonId",
                table: "Quizzes");

            migrationBuilder.DropColumn(
                name: "SectionNumber",
                table: "Quizzes");

            migrationBuilder.DropColumn(
                name: "ExternalVideoUrl1",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "ExternalVideoUrl2",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "ExternalVideoUrl3",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "ExternalVideoUrl4",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "ExternalVideoUrl5",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "Section5Title",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "ShowQuiz1",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "ShowQuiz2",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "ShowQuiz3",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "ShowQuiz4",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "ShowQuiz5",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "ShowVideo1",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "ShowVideo2",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "ShowVideo3",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "ShowVideo4",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "ShowVideo5",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "VideoUrl1",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "VideoUrl2",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "VideoUrl3",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "VideoUrl4",
                table: "Lessons");

            migrationBuilder.DropColumn(
                name: "IntroExternalVideoUrl",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "IntroVideoUrl",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "ShowIntroVideo",
                table: "Courses");

            migrationBuilder.RenameColumn(
                name: "VideoUrl5",
                table: "Lessons",
                newName: "VideoUrl");
        }
    }
}
