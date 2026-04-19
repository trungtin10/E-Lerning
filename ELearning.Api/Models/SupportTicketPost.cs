using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ELearning.Api.Models;

[Table("PhanHoiHoTro")]
public class SupportTicketPost
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    [Column("YeuCauHoTroId")]
    public int SupportTicketId { get; set; }

    [MaxLength(450)]
    [Column("NguoiDungId")]
    public string UserId { get; set; } = string.Empty;

    [Column("NoiDung")]
    public string Body { get; set; } = string.Empty;

    [Column("NgayTao")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual SupportTicket Ticket { get; set; } = null!;
    public virtual ApplicationUser Author { get; set; } = null!;
    public virtual ICollection<SupportTicketAttachment> Attachments { get; set; } = new List<SupportTicketAttachment>();
}
