using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ELearning.Api.Models;

[Table("NhatKyHeThong")]
public class AuditLog
{
    [Key]
    [Column("Id")]
    public long Id { get; set; }

    [MaxLength(450)]
    [Column("NguoiDungId")]
    public string? UserId { get; set; }

    [MaxLength(100)]
    [Column("TenDangNhap")]
    public string? UserName { get; set; }

    [Required, MaxLength(50)]
    [Column("HanhDong")]
    public string Action { get; set; } = string.Empty; // Create, Update, Delete, Downgrade, etc.

    [MaxLength(100)]
    [Column("LoaiDoiTuong")]
    public string? EntityType { get; set; } // Company, User, Plan, etc.

    [MaxLength(100)]
    [Column("DoiTuongId")]
    public string? EntityId { get; set; }

    [Column("GiaTriCu")]
    public string? OldValue { get; set; }

    [Column("GiaTriMoi")]
    public string? NewValue { get; set; }

    [MaxLength(100)]
    [Column("DiaChiIP")]
    public string? IpAddress { get; set; }

    [MaxLength(500)]
    [Column("ChiTiet")]
    public string? Details { get; set; }

    [Column("NgayTao")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
