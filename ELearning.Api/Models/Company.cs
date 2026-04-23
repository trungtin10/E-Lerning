using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace ELearning.Api.Models;

[Table("CongTy")]
public class Company
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    [Required, MaxLength(200)]
    [Column("TenCongTy")]
    public string CompanyName { get; set; } = string.Empty;

    [MaxLength(100)]
    [Column("TenMienPhu")]
    public string? SubDomain { get; set; }

    [Column("LogoUrl")]
    public string? LogoUrl { get; set; }

    [Column("TenMienRieng")]
    public string? CustomDomain { get; set; }

    [Column("TenGoiDichVu")]
    public string? ServicePlan { get; set; }

    [MaxLength(50)]
    [Column("MaSoThue")]
    public string? TaxCode { get; set; }

    [MaxLength(256)]
    [Column("EmailLienHe")]
    public string? ContactEmail { get; set; }

    [MaxLength(50)]
    [Column("SoDienThoai")]
    public string? ContactPhone { get; set; }

    [Column("SoUserToiDa")]
    public int? MaxUsers { get; set; }

    [Column("GoiDichVuId")]
    public int? ServicePlanId { get; set; }

    [Column("NgayHetHanGoi")]
    public DateTime? PlanExpiresAt { get; set; }

    [Column("DungLuongDaDungBytes")]
    public long StorageUsedBytes { get; set; }

    [Column("TrangThaiHoatDong")]
    public bool IsActive { get; set; } = true;

    [Column("NgayTao")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("NgayCapNhat")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(200)]
    [Column("NganhNghe")]
    public string? Industry { get; set; }

    public virtual ServicePlan? Plan { get; set; }
    public virtual ICollection<Department> Departments { get; set; } = new List<Department>();
    public virtual ICollection<ApplicationUser> Users { get; set; } = new List<ApplicationUser>();
    public virtual ICollection<Category> Categories { get; set; } = new List<Category>();
    public virtual ICollection<Course> Courses { get; set; } = new List<Course>();
}
