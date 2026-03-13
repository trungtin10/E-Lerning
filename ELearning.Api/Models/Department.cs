using System.ComponentModel.DataAnnotations;

namespace ELearning.Api.Models;

public class Department
{
    public int Id { get; set; }
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int CompanyId { get; set; }
    public virtual Company Company { get; set; } = null!;
    public virtual ICollection<ApplicationUser> Users { get; set; } = new List<ApplicationUser>();
}

public class Category
{
    public int Id { get; set; }
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? CompanyId { get; set; }
    public virtual Company? Company { get; set; }
    public virtual ICollection<Course> Courses { get; set; } = new List<Course>();
}
