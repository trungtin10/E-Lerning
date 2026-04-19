using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ELearning.Api.Models;

[Table("GiaoDich")]
public class Transaction
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    [Column("CongTyId")]
    public int CompanyId { get; set; }

    [Column("GoiDichVuId")]
    public int ServicePlanId { get; set; }

    [Column("SoTien")]
    public decimal Amount { get; set; }

    [MaxLength(10)]
    [Column("DienTe")]
    public string Currency { get; set; } = "VND";

    [MaxLength(50)]
    [Column("TrangThai")]
    public string Status { get; set; } = "Pending"; // Pending, Completed, Failed, Refunded

    [MaxLength(100)]
    [Column("CongThanhToan")]
    public string? PaymentGateway { get; set; }

    [MaxLength(200)]
    [Column("MaThamChieu")]
    public string? TransactionRef { get; set; }

    [Column("NgayThanhToan")]
    public DateTime? PaymentDate { get; set; }

    [Column("HanSuDungMoi")]
    public DateTime? PlanExpiresAt { get; set; }

    [Column("ChuKyThang")]
    public int BillingCycleMonths { get; set; } = 1; // 1=monthly, 12=yearly

    [Column("NgayTao")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(500)]
    [Column("GhiChu")]
    public string? Notes { get; set; }

    public virtual Company Company { get; set; } = null!;
    public virtual ServicePlan ServicePlan { get; set; } = null!;
}
