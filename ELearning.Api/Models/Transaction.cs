using System.ComponentModel.DataAnnotations;

namespace ELearning.Api.Models;

public class Transaction
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public int ServicePlanId { get; set; }
    public decimal Amount { get; set; }
    [MaxLength(10)]
    public string Currency { get; set; } = "VND";
    [MaxLength(50)]
    public string Status { get; set; } = "Pending"; // Pending, Completed, Failed, Refunded
    [MaxLength(100)]
    public string? PaymentGateway { get; set; }
    [MaxLength(200)]
    public string? TransactionRef { get; set; }
    public DateTime? PaymentDate { get; set; }
    public DateTime? PlanExpiresAt { get; set; }
    public int BillingCycleMonths { get; set; } = 1; // 1=monthly, 12=yearly
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [MaxLength(500)]
    public string? Notes { get; set; }

    public virtual Company Company { get; set; } = null!;
    public virtual ServicePlan ServicePlan { get; set; } = null!;
}
