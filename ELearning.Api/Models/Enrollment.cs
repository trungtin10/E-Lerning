using System.ComponentModel.DataAnnotations;

namespace ELearning.Api.Models;

public class CourseEnrollment
{
    public int Id { get; set; }
    [Required]
    public string UserId { get; set; } = string.Empty;
    public int CourseId { get; set; }
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    public double ProgressPercentage { get; set; } = 0;
    [Required, MaxLength(50)]
    public string Status { get; set; } = "InProgress";
    public DateTime? CompletedAt { get; set; }
    public virtual ApplicationUser User { get; set; } = null!;
    public virtual Course Course { get; set; } = null!;
    public virtual ICollection<LessonProgress> LessonProgresses { get; set; } = new List<LessonProgress>();
}

public class LessonProgress
{
    public int Id { get; set; }
    public int EnrollmentId { get; set; }
    public int LessonId { get; set; }
    public bool IsCompleted { get; set; } = false;
    public DateTime? CompletedAt { get; set; }
    public virtual CourseEnrollment Enrollment { get; set; } = null!;
    public virtual Lesson Lesson { get; set; } = null!;
}

public class QuizAttempt
{
    public int Id { get; set; }
    public int QuizId { get; set; }
    [Required]
    public string UserId { get; set; } = string.Empty;
    public int Score { get; set; }
    public bool IsPassed { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
    public virtual Quiz Quiz { get; set; } = null!;
    public virtual ApplicationUser User { get; set; } = null!;
}

public class Certificate
{
    public int Id { get; set; }
    [Required]
    public string UserId { get; set; } = string.Empty;
    public int CourseId { get; set; }
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public string? CertificateUrl { get; set; }
    public virtual ApplicationUser User { get; set; } = null!;
    public virtual Course Course { get; set; } = null!;
}
