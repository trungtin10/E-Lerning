using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ELearning.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAnnouncementsUserStateAndNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_QuizAttemptAnswers_Answers_SelectedAnswerId",
                table: "QuizAttemptAnswers");

            migrationBuilder.DropForeignKey(
                name: "FK_QuizAttemptAnswers_Questions_QuestionId",
                table: "QuizAttemptAnswers");

            migrationBuilder.AddColumn<int>(
                name: "Priority",
                table: "Announcements",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Severity",
                table: "Announcements",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "TargetCompanyId",
                table: "Announcements",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetRoles",
                table: "Announcements",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AnnouncementUserStates",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AnnouncementId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    DismissedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AcknowledgedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnnouncementUserStates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AnnouncementUserStates_Announcements_AnnouncementId",
                        column: x => x.AnnouncementId,
                        principalTable: "Announcements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AnnouncementUserStates_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LearnerBehaviorEvents",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    CourseId = table.Column<int>(type: "int", nullable: false),
                    EnrollmentId = table.Column<int>(type: "int", nullable: true),
                    EventType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    EntityType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    EntityId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Metadata = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearnerBehaviorEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LearnerBehaviorEvents_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LearnerBehaviorEvents_CourseEnrollments_EnrollmentId",
                        column: x => x.EnrollmentId,
                        principalTable: "CourseEnrollments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_LearnerBehaviorEvents_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserNotifications",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Type = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Severity = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsRead = table.Column<bool>(type: "bit", nullable: false),
                    ReadAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LinkUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PayloadJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserNotifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserNotifications_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementUserStates_AnnouncementId_UserId",
                table: "AnnouncementUserStates",
                columns: new[] { "AnnouncementId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementUserStates_UserId",
                table: "AnnouncementUserStates",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_LearnerBehaviorEvents_CourseId",
                table: "LearnerBehaviorEvents",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_LearnerBehaviorEvents_EnrollmentId",
                table: "LearnerBehaviorEvents",
                column: "EnrollmentId");

            migrationBuilder.CreateIndex(
                name: "IX_LearnerBehaviorEvents_UserId_CourseId_CreatedAt",
                table: "LearnerBehaviorEvents",
                columns: new[] { "UserId", "CourseId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_UserNotifications_UserId_IsRead_CreatedAt",
                table: "UserNotifications",
                columns: new[] { "UserId", "IsRead", "CreatedAt" });

            migrationBuilder.AddForeignKey(
                name: "FK_QuizAttemptAnswers_Answers_SelectedAnswerId",
                table: "QuizAttemptAnswers",
                column: "SelectedAnswerId",
                principalTable: "Answers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_QuizAttemptAnswers_Questions_QuestionId",
                table: "QuizAttemptAnswers",
                column: "QuestionId",
                principalTable: "Questions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_QuizAttemptAnswers_Answers_SelectedAnswerId",
                table: "QuizAttemptAnswers");

            migrationBuilder.DropForeignKey(
                name: "FK_QuizAttemptAnswers_Questions_QuestionId",
                table: "QuizAttemptAnswers");

            migrationBuilder.DropTable(
                name: "AnnouncementUserStates");

            migrationBuilder.DropTable(
                name: "LearnerBehaviorEvents");

            migrationBuilder.DropTable(
                name: "UserNotifications");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "Announcements");

            migrationBuilder.DropColumn(
                name: "Severity",
                table: "Announcements");

            migrationBuilder.DropColumn(
                name: "TargetCompanyId",
                table: "Announcements");

            migrationBuilder.DropColumn(
                name: "TargetRoles",
                table: "Announcements");

            migrationBuilder.AddForeignKey(
                name: "FK_QuizAttemptAnswers_Answers_SelectedAnswerId",
                table: "QuizAttemptAnswers",
                column: "SelectedAnswerId",
                principalTable: "Answers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_QuizAttemptAnswers_Questions_QuestionId",
                table: "QuizAttemptAnswers",
                column: "QuestionId",
                principalTable: "Questions",
                principalColumn: "Id");
        }
    }
}
