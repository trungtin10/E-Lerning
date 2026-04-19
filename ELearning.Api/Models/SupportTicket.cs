using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ELearning.Api.Models;

[Table("YeuCauHoTro")]
public class SupportTicket
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    [Column("CongTyId")]
    public int CompanyId { get; set; }

    [MaxLength(450)]
    [Column("NguoiDungId")]
    public string UserId { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    [Column("ChuDe")]
    public string Subject { get; set; } = string.Empty;

    [Column("NoiDung")]
    public string Content { get; set; } = string.Empty;

    [MaxLength(20)]
    [Column("TrangThai")]
    public string Status { get; set; } = "Open"; // Open, InProgress, Resolved, Closed

    [MaxLength(20)]
    [Column("DoUuTien")]
    public string Priority { get; set; } = "Normal";

    [MaxLength(500)]
    [Column("PhanHoiAdmin")]
    public string? AdminReply { get; set; }

    [MaxLength(450)]
    [Column("NguoiTraLoiId")]
    public string? RepliedByUserId { get; set; }

    [Column("NgayTraLoi")]
    public DateTime? RepliedAt { get; set; }

    [Column("NgayTao")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("NgayCapNhat")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("HoatDongCuoi")]
    public DateTime LastActivityAt { get; set; } = DateTime.UtcNow;

    public virtual Company Company { get; set; } = null!;
    public virtual ApplicationUser Author { get; set; } = null!;
    public virtual ICollection<SupportTicketPost> Posts { get; set; } = new List<SupportTicketPost>();
}
