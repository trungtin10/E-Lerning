using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ELearning.Api.Models;

[Table("ThongBaoHeThong")]
public class Announcement
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    [Required, MaxLength(200)]
    [Column("TieuDe")]
    public string Title { get; set; } = string.Empty;

    [Column("NoiDung")]
    public string Content { get; set; } = string.Empty;

    [MaxLength(30)]
    [Column("LoaiDoiTuong")]
    public string TargetType { get; set; } = "All"; // All, AllCompanies, SuperAdminOnly

    [MaxLength(20)]
    [Column("KieuHienThi")]
    public string DisplayType { get; set; } = "Banner"; // Banner, Popup

    [Column("CongTyId")]
    public int? TargetCompanyId { get; set; }

    [MaxLength(200)]
    [Column("VaiTroNhan")]
    public string? TargetRoles { get; set; }

    [MaxLength(20)]
    [Column("MucDo")]
    public string Severity { get; set; } = "Info";

    [Column("DoUuTien")]
    public int Priority { get; set; } = 0;

    [Column("DuongDan")]
    public string? LinkUrl { get; set; }

    [Column("NgayBatDau")]
    public DateTime StartAt { get; set; }

    [Column("NgayKetThuc")]
    public DateTime? EndAt { get; set; }

    [Column("TrangThaiHoatDong")]
    public bool IsActive { get; set; } = true;

    [Column("NgayTao")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(450)]
    [Column("NguoiTaoId")]
    public string? CreatedByUserId { get; set; }
}

[Table("TrangThaiThongBao")]
public class AnnouncementUserState
{
    [Key]
    [Column("Id")]
    public long Id { get; set; }

    [Column("ThongBaoId")]
    public int AnnouncementId { get; set; }

    [Required, MaxLength(450)]
    [Column("NguoiDungId")]
    public string UserId { get; set; } = string.Empty;

    [Column("NgayAn")]
    public DateTime? DismissedAt { get; set; }

    [Column("NgayXacNhan")]
    public DateTime? AcknowledgedAt { get; set; }

    [Column("NgayTao")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual Announcement? Announcement { get; set; }
    public virtual ApplicationUser? User { get; set; }
}
