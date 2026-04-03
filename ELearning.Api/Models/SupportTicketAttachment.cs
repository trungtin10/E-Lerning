using System.ComponentModel.DataAnnotations;

namespace ELearning.Api.Models;

public class SupportTicketAttachment
{
    public int Id { get; set; }
    public int SupportTicketPostId { get; set; }
    [Required, MaxLength(500)]
    public string FileUrl { get; set; } = string.Empty;

    public virtual SupportTicketPost Post { get; set; } = null!;
}
