using System.ComponentModel.DataAnnotations;

namespace ELearning.Api.Models;

public class Company
{
    public int Id { get; set; }
    [Required, MaxLength(200)]
    public string CompanyName { get; set; } = string.Empty;
    [MaxLength(100)]
    public string? SubDomain { get; set; }
    public string? LogoUrl { get; set; }
    public string? CustomDomain { get; set; }
    public string? ServicePlan { get; set; }

    [MaxLength(50)]
    public string? TaxCode { get; set; }
    [MaxLength(256)]
    public string? ContactEmail { get; set; }
    [MaxLength(50)]
    public string? ContactPhone { get; set; }
    public int? MaxUsers { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow; // Thêm Ngày cập nhật

    public virtual ICollection<Department> Departments { get; set; } = new List<Department>();
    public virtual ICollection<ApplicationUser> Users { get; set; } = new List<ApplicationUser>();
    public virtual ICollection<Category> Categories { get; set; } = new List<Category>();
    public virtual ICollection<Course> Courses { get; set; } = new List<Course>();
}
