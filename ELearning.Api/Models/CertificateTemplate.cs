using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ELearning.Api.Models
{
    [Table("MauChungChi")]
    public class CertificateTemplate
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }

        [Required, MaxLength(200)]
        [Column("TenMau")]
        public string Name { get; set; } = string.Empty;

        [Column("NoiDungMau")]
        public string? ContentHtml { get; set; } // HTML/CSS template if needed

        [Column("AnhNenUrl")]
        public string? BackgroundImageUrl { get; set; }

        [Column("ChuKyUrl")]
        public string? SignatureUrl { get; set; }

        [Column("TenNguoiKy")]
        public string? SignerName { get; set; }

        [Column("ChucDanhNguoiKy")]
        public string? SignerTitle { get; set; }

        [Column("CongTyId")]
        public int? CompanyId { get; set; }

        [Column("NgayTao")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual Company? Company { get; set; }
    }

}
