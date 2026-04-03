using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ELearning.Api.Migrations
{
    /// <inheritdoc />
    public partial class SupportTicketForumPosts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastActivityAt",
                table: "SupportTickets",
                type: "datetime2",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE SupportTickets SET LastActivityAt = UpdatedAt WHERE LastActivityAt IS NULL;
                """);

            migrationBuilder.AlterColumn<DateTime>(
                name: "LastActivityAt",
                table: "SupportTickets",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "SupportTicketPosts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SupportTicketId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    Body = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupportTicketPosts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SupportTicketPosts_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SupportTicketPosts_SupportTickets_SupportTicketId",
                        column: x => x.SupportTicketId,
                        principalTable: "SupportTickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SupportTicketAttachments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SupportTicketPostId = table.Column<int>(type: "int", nullable: false),
                    FileUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupportTicketAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SupportTicketAttachments_SupportTicketPosts_SupportTicketPostId",
                        column: x => x.SupportTicketPostId,
                        principalTable: "SupportTicketPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SupportTickets_UserId",
                table: "SupportTickets",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SupportTicketAttachments_SupportTicketPostId",
                table: "SupportTicketAttachments",
                column: "SupportTicketPostId");

            migrationBuilder.CreateIndex(
                name: "IX_SupportTicketPosts_SupportTicketId",
                table: "SupportTicketPosts",
                column: "SupportTicketId");

            migrationBuilder.CreateIndex(
                name: "IX_SupportTicketPosts_UserId",
                table: "SupportTicketPosts",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_SupportTickets_AspNetUsers_UserId",
                table: "SupportTickets",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");

            migrationBuilder.Sql("""
                INSERT INTO SupportTicketPosts (SupportTicketId, UserId, Body, CreatedAt)
                SELECT Id, UserId, Content, CreatedAt FROM SupportTickets t
                WHERE NOT EXISTS (SELECT 1 FROM SupportTicketPosts p WHERE p.SupportTicketId = t.Id);

                INSERT INTO SupportTicketPosts (SupportTicketId, UserId, Body, CreatedAt)
                SELECT st.Id, COALESCE(st.RepliedByUserId, st.UserId), st.AdminReply, COALESCE(st.RepliedAt, st.UpdatedAt)
                FROM SupportTickets st
                WHERE st.AdminReply IS NOT NULL AND LTRIM(RTRIM(st.AdminReply)) <> ''
                AND (SELECT COUNT(*) FROM SupportTicketPosts p WHERE p.SupportTicketId = st.Id) = 1;

                UPDATE st SET LastActivityAt = COALESCE(
                    (SELECT MAX(CreatedAt) FROM SupportTicketPosts p WHERE p.SupportTicketId = st.Id),
                    st.UpdatedAt)
                FROM SupportTickets st;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SupportTickets_AspNetUsers_UserId",
                table: "SupportTickets");

            migrationBuilder.DropTable(
                name: "SupportTicketAttachments");

            migrationBuilder.DropTable(
                name: "SupportTicketPosts");

            migrationBuilder.DropIndex(
                name: "IX_SupportTickets_UserId",
                table: "SupportTickets");

            migrationBuilder.DropColumn(
                name: "LastActivityAt",
                table: "SupportTickets");
        }
    }
}
