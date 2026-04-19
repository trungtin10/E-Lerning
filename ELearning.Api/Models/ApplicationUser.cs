using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ELearning.Api.Models;

[Table("NguoiDung")]
public class ApplicationUser : IdentityUser
{
    [Required, MaxLength(100)]
    [Column("HoTen")]
    public string FullName { get; set; } = string.Empty;

    [Column("AvatarUrl")]
    public string? AvatarUrl { get; set; }

    [Column("AnhBiaUrl")]
    public string? CoverPhotoUrl { get; set; }

    [MaxLength(100)]
    [Column("ChucDanh")]
    public string? JobTitle { get; set; }

    [Column("TrangThaiHoatDong")]
    public bool IsActive { get; set; } = true;

    [Column("NgayTao")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("PhongBanId")]
    public int? DepartmentId { get; set; }

    [Column("CongTyId")]
    public int? CompanyId { get; set; }

    public virtual Company? Company { get; set; }
    public virtual Department? Department { get; set; }

    /// <summary>Email liên hệ hiển thị: ưu tiên Email; nếu trống và UserName có dạng email thì dùng UserName.</summary>
    public string? GetDisplayEmail()
    {
        if (!string.IsNullOrWhiteSpace(Email)) return Email.Trim();
        var un = UserName?.Trim();
        if (!string.IsNullOrWhiteSpace(un) && un.Contains('@', StringComparison.Ordinal))
            return un;
        return null;
    }

    public virtual ICollection<Course> InstructedCourses { get; set; } = new List<Course>();
    public virtual ICollection<CourseEnrollment> Enrollments { get; set; } = new List<CourseEnrollment>();
    public virtual ICollection<QuizAttempt> QuizAttempts { get; set; } = new List<QuizAttempt>();
    public virtual ICollection<Certificate> Certificates { get; set; } = new List<Certificate>();
}
