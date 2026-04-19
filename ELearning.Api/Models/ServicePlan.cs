using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace ELearning.Api.Models;

[Table("GoiDichVu")]
public class ServicePlan
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    [Required, MaxLength(50)]
    [Column("TenGoi")]
    public string Name { get; set; } = string.Empty; // Basic, Pro, Enterprise

    [MaxLength(500)]
    [Column("MoTa")]
    public string? Description { get; set; }

    [Column("SoUserToiDa")]
    public int MaxUsers { get; set; }

    [Column("GioiHanLuuTruGB")]
    public int StorageLimitGB { get; set; }

    [Column("GiaHangThang")]
    public decimal PriceMonthly { get; set; }

    [Column("GiaHangNam")]
    public decimal PriceYearly { get; set; }

    [Column("TrangThaiHoatDong")]
    public bool IsActive { get; set; } = true;

    [Column("ThuTuHienThi")]
    public int SortOrder { get; set; }

    [Column("NgayTao")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("NgayCapNhat")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<Company> Companies { get; set; } = new List<Company>();
}
