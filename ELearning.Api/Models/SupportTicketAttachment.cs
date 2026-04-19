using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ELearning.Api.Models;

[Table("DinhKemHoTro")]
public class SupportTicketAttachment
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    [Column("PhanHoiHoTroId")]
    public int SupportTicketPostId { get; set; }

    [Required, MaxLength(500)]
    [Column("DuongDanFile")]
    public string FileUrl { get; set; } = string.Empty;

    public virtual SupportTicketPost Post { get; set; } = null!;
}
