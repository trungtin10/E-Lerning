using System.ComponentModel.DataAnnotations;

namespace ELearning.Api.Models;

public class Announcement
{
    public int Id { get; set; }
    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    [MaxLength(30)]
    public string TargetType { get; set; } = "All"; // All, AllCompanies, SuperAdminOnly
    [MaxLength(20)]
    public string DisplayType { get; set; } = "Banner"; // Banner, Popup
    /// <summary>Target theo CompanyId (null = tất cả)</summary>
    public int? TargetCompanyId { get; set; }
    /// <summary>Target theo role (CSV, null/empty = tất cả). Ví dụ: \"Learner,Instructor\"</summary>
    [MaxLength(200)]
    public string? TargetRoles { get; set; }
    /// <summary>Mức độ: Info/Warning/Critical</summary>
    [MaxLength(20)]
    public string Severity { get; set; } = "Info";
    /// <summary>Ưu tiên hiển thị (số lớn ưu tiên cao hơn)</summary>
    public int Priority { get; set; } = 0;
    public string? LinkUrl { get; set; }
    public DateTime StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [MaxLength(450)]
    public string? CreatedByUserId { get; set; }
}

/// <summary>Trạng thái đã xem/đã tắt/đã xác nhận của từng user đối với announcement</summary>
public class AnnouncementUserState
{
    public long Id { get; set; }
    public int AnnouncementId { get; set; }
    [Required, MaxLength(450)]
    public string UserId { get; set; } = string.Empty;
    public DateTime? DismissedAt { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual Announcement? Announcement { get; set; }
    public virtual ApplicationUser? User { get; set; }
}
