using ELearning.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ELearning.Api.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Company> Companies { get; set; } = null!;
    public DbSet<ServicePlan> ServicePlans { get; set; } = null!;
    public DbSet<Transaction> Transactions { get; set; } = null!;
    public DbSet<AuditLog> AuditLogs { get; set; } = null!;
    public DbSet<SupportTicket> SupportTickets { get; set; } = null!;
    public DbSet<SupportTicketPost> SupportTicketPosts { get; set; } = null!;
    public DbSet<SupportTicketAttachment> SupportTicketAttachments { get; set; } = null!;
    public DbSet<Announcement> Announcements { get; set; } = null!;
    public DbSet<AnnouncementUserState> AnnouncementUserStates { get; set; } = null!;
    public DbSet<UserNotification> UserNotifications { get; set; } = null!;
    public DbSet<Department> Departments { get; set; } = null!;
    public DbSet<Category> Categories { get; set; } = null!;
    public DbSet<Course> Courses { get; set; } = null!;
    public DbSet<Lesson> Lessons { get; set; } = null!;
    public DbSet<Quiz> Quizzes { get; set; } = null!;
    public DbSet<Question> Questions { get; set; } = null!;
    public DbSet<Answer> Answers { get; set; } = null!;
    public DbSet<CourseEnrollment> CourseEnrollments { get; set; } = null!;
    public DbSet<LessonProgress> LessonProgresses { get; set; } = null!;
    public DbSet<QuizAttempt> QuizAttempts { get; set; } = null!;
    public DbSet<QuizAttemptAnswer> QuizAttemptAnswers { get; set; } = null!;
    public DbSet<Certificate> Certificates { get; set; } = null!;
    public DbSet<LearnerBehaviorEvent> LearnerBehaviorEvents { get; set; } = null!;
    public DbSet<CourseDiscussion> CourseDiscussions { get; set; } = null!;
    public DbSet<UserNote> UserNotes { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // --- VIỆT HÓA IDENTITY TABLES ---
        builder.Entity<ApplicationUser>(entity =>
        {
            entity.ToTable("NguoiDung");
            entity.Property(u => u.Id).HasColumnName("Id");
            entity.Property(u => u.UserName).HasColumnName("TenDangNhap");
            entity.Property(u => u.NormalizedUserName).HasColumnName("TenDangNhapChuanHoa");
            entity.Property(u => u.Email).HasColumnName("Email");
            entity.Property(u => u.NormalizedEmail).HasColumnName("EmailChuanHoa");
            entity.Property(u => u.EmailConfirmed).HasColumnName("DaXacThucEmail");
            entity.Property(u => u.PasswordHash).HasColumnName("MatKhauHash");
            entity.Property(u => u.SecurityStamp).HasColumnName("DauVanTayBaoMat");
            entity.Property(u => u.ConcurrencyStamp).HasColumnName("DauVanTayDongThoi");
            entity.Property(u => u.PhoneNumber).HasColumnName("SoDienThoai");
            entity.Property(u => u.PhoneNumberConfirmed).HasColumnName("DaXacThucSDT");
            entity.Property(u => u.TwoFactorEnabled).HasColumnName("XacThucHaiLop");
            entity.Property(u => u.LockoutEnd).HasColumnName("ThoiGianBiKhoa");
            entity.Property(u => u.LockoutEnabled).HasColumnName("CoTheBiKhoa");
            entity.Property(u => u.AccessFailedCount).HasColumnName("SoLanDangNhapSai");
            
            // Cho phép trùng Email ở cấp độ Entity Framework
            entity.HasIndex(u => u.NormalizedEmail).HasDatabaseName("EmailIndex").IsUnique(false);
            entity.HasIndex(u => u.Email).IsUnique(false);

            // Custom ApplicationUser properties
            entity.Property(u => u.FullName).HasColumnName("HoTen");
            entity.Property(u => u.AvatarUrl).HasColumnName("AvatarUrl");
            entity.Property(u => u.CoverPhotoUrl).HasColumnName("AnhBiaUrl");
            entity.Property(u => u.JobTitle).HasColumnName("ChucDanh");
            entity.Property(u => u.CompanyId).HasColumnName("CongTyId");
            entity.Property(u => u.DepartmentId).HasColumnName("PhongBanId");
            entity.Property(u => u.IsActive).HasColumnName("TrangThaiHoatDong");
            entity.Property(u => u.CreatedAt).HasColumnName("NgayTao");

            entity.HasOne(u => u.Company)
                .WithMany(c => c.Users)
                .HasForeignKey(u => u.CompanyId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(u => u.Department)
                .WithMany(d => d.Users)
                .HasForeignKey(u => u.DepartmentId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // Mapping các bảng Identity còn lại
        builder.Entity<IdentityRole>(entity => entity.ToTable("VaiTro"));
        builder.Entity<IdentityUserRole<string>>(entity => entity.ToTable("NguoiDungVaiTro"));
        builder.Entity<IdentityUserClaim<string>>(entity => entity.ToTable("NguoiDungYeuCau"));
        builder.Entity<IdentityUserLogin<string>>(entity => entity.ToTable("NguoiDungDangNhap"));
        builder.Entity<IdentityRoleClaim<string>>(entity => entity.ToTable("VaiTroYeuCau"));
        builder.Entity<IdentityUserToken<string>>(entity => entity.ToTable("NguoiDungToken"));

        // --- CẤU HÌNH CÁC THỰC THỂ KHÁC ---
        builder.Entity<Course>(entity =>
        {
            entity.HasOne(c => c.Instructor)
                .WithMany(u => u.InstructedCourses)
                .HasForeignKey(c => c.InstructorId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(c => c.Company)
                .WithMany(co => co.Courses)
                .HasForeignKey(c => c.CompanyId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        builder.Entity<Lesson>(entity =>
        {
            entity.HasOne(l => l.Course)
                .WithMany(c => c.Lessons)
                .HasForeignKey(l => l.CourseId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        builder.Entity<Quiz>(entity =>
        {
            entity.HasOne(q => q.Lesson)
                .WithMany(l => l.Quizzes)
                .HasForeignKey(q => q.LessonId)
                .OnDelete(DeleteBehavior.SetNull); // Nếu bài học bị xóa, bài tập vẫn giữ lại hoặc xử lý tùy ý
        });

        builder.Entity<CourseEnrollment>(entity =>
        {
            entity.HasOne(ce => ce.Course)
                .WithMany(c => c.Enrollments)
                .HasForeignKey(ce => ce.CourseId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        builder.Entity<LessonProgress>(entity =>
        {
            entity.HasOne(lp => lp.Lesson)
                .WithMany(l => l.Progresses)
                .HasForeignKey(lp => lp.LessonId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        builder.Entity<QuizAttempt>(entity =>
        {
            entity.HasOne(qa => qa.User)
                .WithMany(u => u.QuizAttempts)
                .HasForeignKey(qa => qa.UserId)
                .OnDelete(DeleteBehavior.NoAction);
        });



        builder.Entity<Certificate>(entity =>
        {
            entity.HasOne(c => c.Course)
                .WithMany()
                .HasForeignKey(c => c.CourseId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        builder.Entity<Company>(entity =>
        {
            entity.HasOne(c => c.Plan)
                .WithMany(p => p.Companies)
                .HasForeignKey(c => c.ServicePlanId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<ServicePlan>(entity =>
        {
            entity.Property(e => e.PriceMonthly).HasPrecision(18, 2);
            entity.Property(e => e.PriceYearly).HasPrecision(18, 2);
        });

        builder.Entity<Transaction>(entity =>
        {
            entity.Property(e => e.Amount).HasPrecision(18, 2);
            entity.HasOne(t => t.Company)
                .WithMany()
                .HasForeignKey(t => t.CompanyId)
                .OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(t => t.ServicePlan)
                .WithMany()
                .HasForeignKey(t => t.ServicePlanId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        builder.Entity<SupportTicket>(entity =>
        {
            entity.HasOne(t => t.Company)
                .WithMany()
                .HasForeignKey(t => t.CompanyId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(t => t.Author)
                .WithMany()
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        builder.Entity<SupportTicketPost>(entity =>
        {
            entity.HasOne(p => p.Ticket)
                .WithMany(t => t.Posts)
                .HasForeignKey(p => p.SupportTicketId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(p => p.Author)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        builder.Entity<SupportTicketAttachment>(entity =>
        {
            entity.HasOne(a => a.Post)
                .WithMany(p => p.Attachments)
                .HasForeignKey(a => a.SupportTicketPostId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<LearnerBehaviorEvent>(entity =>
        {
            entity.HasIndex(e => new { e.UserId, e.CourseId, e.CreatedAt });
            
            entity.HasOne(e => e.Enrollment)
                .WithMany()
                .HasForeignKey(e => e.EnrollmentId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.Course)
                .WithMany()
                .HasForeignKey(e => e.CourseId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        builder.Entity<QuizAttemptAnswer>(entity =>
        {
            entity.HasOne(qa => qa.QuizAttempt)
                .WithMany(a => a.SelectedAnswers)
                .HasForeignKey(qa => qa.QuizAttemptId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(qa => qa.Question)
                .WithMany()
                .HasForeignKey(qa => qa.QuestionId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(qa => qa.SelectedAnswer)
                .WithMany()
                .HasForeignKey(qa => qa.SelectedAnswerId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        builder.Entity<AnnouncementUserState>(entity =>
        {
            entity.HasIndex(x => new { x.AnnouncementId, x.UserId }).IsUnique();
            entity.HasOne(x => x.Announcement)
                .WithMany()
                .HasForeignKey(x => x.AnnouncementId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<UserNotification>(entity =>
        {
            entity.HasIndex(n => new { n.UserId, n.IsRead, n.CreatedAt });
            entity.HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<CourseDiscussion>(entity =>
        {
            entity.HasOne(d => d.User)
                .WithMany()
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(d => d.Parent)
                .WithMany(p => p.Replies)
                .HasForeignKey(d => d.ParentId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        builder.Entity<UserNote>(entity =>
        {
            entity.HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.NoAction);
        });
    }
}
