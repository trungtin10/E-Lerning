using System.ComponentModel.DataAnnotations;

namespace ELearning.Api.Models;

public class UserNotification
{
    public long Id { get; set; }
    [Required, MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }

    [MaxLength(30)]
    public string Type { get; set; } = "System"; // System, Announcement, Course, Quiz, Ticket...

    [MaxLength(20)]
    public string Severity { get; set; } = "Info"; // Info/Warning/Critical

    public bool IsRead { get; set; } = false;
    public DateTime? ReadAt { get; set; }

    public string? LinkUrl { get; set; }
    public string? PayloadJson { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual ApplicationUser? User { get; set; }
}

