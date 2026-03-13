using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace ELearning.Api.Models;

public class ApplicationUser : IdentityUser
{
    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    [MaxLength(100)]
    public string? JobTitle { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int? DepartmentId { get; set; }
    public int? CompanyId { get; set; }

    public virtual Company? Company { get; set; }
    public virtual Department? Department { get; set; }

    public virtual ICollection<Course> InstructedCourses { get; set; } = new List<Course>();
    public virtual ICollection<CourseEnrollment> Enrollments { get; set; } = new List<CourseEnrollment>();
    public virtual ICollection<QuizAttempt> QuizAttempts { get; set; } = new List<QuizAttempt>();
    public virtual ICollection<Certificate> Certificates { get; set; } = new List<Certificate>();
}
