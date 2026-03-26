using System.ComponentModel.DataAnnotations;

namespace ELearning.Api.Models;

/// <summary>Ghi nhận hành vi chi tiết của học viên khi học (xem bài, xem video, làm quiz...)</summary>
public class LearnerBehaviorEvent
{
    public long Id { get; set; }
    [Required, MaxLength(450)]
    public string UserId { get; set; } = string.Empty;
    public int CourseId { get; set; }
    public int? EnrollmentId { get; set; }
    [Required, MaxLength(50)]
    public string EventType { get; set; } = string.Empty; // LessonViewed, SectionViewed, LessonCompleted, VideoStarted, VideoCompleted, QuizSubmitted, PageEnter
    [MaxLength(50)]
    public string? EntityType { get; set; } // Lesson, Section, Quiz
    [MaxLength(100)]
    public string? EntityId { get; set; } // lessonId, "lessonId_section", quizId
    [MaxLength(500)]
    public string? Metadata { get; set; } // JSON: { "lessonTitle", "sectionTitle", "score", "durationSeconds", ... }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual ApplicationUser? User { get; set; }
    public virtual Course? Course { get; set; }
    public virtual CourseEnrollment? Enrollment { get; set; }
}
