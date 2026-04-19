using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ELearning.Api.Models;

/// <summary>Ghi nhận hành vi chi tiết của học viên khi học (xem bài, xem video, làm quiz...)</summary>
[Table("HanhViHocVien")]
public class LearnerBehaviorEvent
{
    [Key]
    [Column("Id")]
    public long Id { get; set; }

    [Required, MaxLength(450)]
    [Column("NguoiDungId")]
    public string UserId { get; set; } = string.Empty;

    [Column("KhoaHocId")]
    public int CourseId { get; set; }

    [Column("DangKyId")]
    public int? EnrollmentId { get; set; }

    [Required, MaxLength(50)]
    [Column("LoaiSuKien")]
    public string EventType { get; set; } = string.Empty; // LessonViewed, SectionViewed, LessonCompleted, VideoStarted, VideoCompleted, QuizSubmitted, PageEnter

    [MaxLength(50)]
    [Column("LoaiDoiTuong")]
    public string? EntityType { get; set; } // Lesson, Section, Quiz

    [MaxLength(100)]
    [Column("DoiTuongId")]
    public string? EntityId { get; set; } // lessonId, "lessonId_section", quizId

    [MaxLength(500)]
    [Column("DuLieuMoRong")]
    public string? Metadata { get; set; } // JSON: { "lessonTitle", "sectionTitle", "score", "durationSeconds", ... }

    [Column("NgayTao")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual ApplicationUser? User { get; set; }
    public virtual Course? Course { get; set; }
    public virtual CourseEnrollment? Enrollment { get; set; }
}
