using System.ComponentModel.DataAnnotations;

namespace ELearning.Api.Models;

public class ServicePlan
{
    public int Id { get; set; }
    [Required, MaxLength(50)]
    public string Name { get; set; } = string.Empty; // Basic, Pro, Enterprise
    [MaxLength(500)]
    public string? Description { get; set; }
    public int MaxUsers { get; set; }
    public int StorageLimitGB { get; set; }
    public decimal PriceMonthly { get; set; }
    public decimal PriceYearly { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<Company> Companies { get; set; } = new List<Company>();
}
