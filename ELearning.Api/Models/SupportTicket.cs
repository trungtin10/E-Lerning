using System.ComponentModel.DataAnnotations;

namespace ELearning.Api.Models;

public class SupportTicket
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;
    [Required, MaxLength(200)]
    public string Subject { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    [MaxLength(20)]
    public string Status { get; set; } = "Open"; // Open, InProgress, Resolved, Closed
    [MaxLength(20)]
    public string Priority { get; set; } = "Normal"; // Low, Normal, High, Urgent
    [MaxLength(500)]
    public string? AdminReply { get; set; }
    [MaxLength(450)]
    public string? RepliedByUserId { get; set; }
    public DateTime? RepliedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastActivityAt { get; set; } = DateTime.UtcNow;

    public virtual Company Company { get; set; } = null!;
    public virtual ApplicationUser Author { get; set; } = null!;
    public virtual ICollection<SupportTicketPost> Posts { get; set; } = new List<SupportTicketPost>();
}
