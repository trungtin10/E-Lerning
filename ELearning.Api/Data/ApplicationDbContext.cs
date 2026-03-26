using ELearning.Api.Models;
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

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>(entity =>
        {
            entity.HasOne(u => u.Company)
                .WithMany(c => c.Users)
                .HasForeignKey(u => u.CompanyId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(u => u.Department)
                .WithMany(d => d.Users)
                .HasForeignKey(u => u.DepartmentId)
                .OnDelete(DeleteBehavior.NoAction);
        });

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

        builder.Entity<QuizAttemptAnswer>(entity =>
        {
            entity.HasOne(qa => qa.QuizAttempt)
                .WithMany(a => a.SelectedAnswers)
                .HasForeignKey(qa => qa.QuizAttemptId)
                .OnDelete(DeleteBehavior.Cascade);
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
        });

        builder.Entity<LearnerBehaviorEvent>(entity =>
        {
            entity.HasIndex(e => new { e.UserId, e.CourseId, e.CreatedAt });
            entity.HasOne(e => e.Enrollment)
                .WithMany()
                .HasForeignKey(e => e.EnrollmentId)
                .OnDelete(DeleteBehavior.SetNull);
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
    }
}
