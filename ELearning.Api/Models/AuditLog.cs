using System.ComponentModel.DataAnnotations;

namespace ELearning.Api.Models;

public class AuditLog
{
    public long Id { get; set; }
    [MaxLength(450)]
    public string? UserId { get; set; }
    [MaxLength(100)]
    public string? UserName { get; set; }
    [Required, MaxLength(50)]
    public string Action { get; set; } = string.Empty; // Create, Update, Delete, Downgrade, etc.
    [MaxLength(100)]
    public string? EntityType { get; set; } // Company, User, Plan, etc.
    [MaxLength(100)]
    public string? EntityId { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    [MaxLength(100)]
    public string? IpAddress { get; set; }
    [MaxLength(500)]
    public string? Details { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
