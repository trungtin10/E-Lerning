using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ELearning.Api.Models;

[Table("ThongBaoCaNhan")]
public class UserNotification
{
    [Key]
    [Column("Id")]
    public long Id { get; set; }

    [Required, MaxLength(450)]
    [Column("NguoiDungId")]
    public string UserId { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    [Column("TieuDe")]
    public string Title { get; set; } = string.Empty;

    [Column("NoiDung")]
    public string? Content { get; set; }

    [MaxLength(30)]
    [Column("LoaiThongBao")]
    public string Type { get; set; } = "System"; // System, Announcement, Course, Quiz, Ticket...

    [MaxLength(20)]
    [Column("MucDo")]
    public string Severity { get; set; } = "Info"; // Info/Warning/Critical

    [Column("DaDoc")]
    public bool IsRead { get; set; } = false;

    [Column("NgayDoc")]
    public DateTime? ReadAt { get; set; }

    [Column("DuongDan")]
    public string? LinkUrl { get; set; }

    [Column("DuLieuJson")]
    public string? PayloadJson { get; set; }

    [Column("NgayTao")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual ApplicationUser? User { get; set; }
}

