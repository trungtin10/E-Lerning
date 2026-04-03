using System.ComponentModel.DataAnnotations;

namespace ELearning.Api.Models;

public class SupportTicketPost
{
    public int Id { get; set; }
    public int SupportTicketId { get; set; }
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual SupportTicket Ticket { get; set; } = null!;
    public virtual ApplicationUser Author { get; set; } = null!;
    public virtual ICollection<SupportTicketAttachment> Attachments { get; set; } = new List<SupportTicketAttachment>();
}
