using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ELearning.Api.Models;

[Table("PhongBan")]
public class Department
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    [Required, MaxLength(100)]
    [Column("TenPhongBan")]
    public string Name { get; set; } = string.Empty;

    [Column("MoTa")]
    public string? Description { get; set; }

    [Column("CongTyId")]
    public int CompanyId { get; set; }
    public virtual Company Company { get; set; } = null!;
    public virtual ICollection<ApplicationUser> Users { get; set; } = new List<ApplicationUser>();
}

[Table("DanhMuc")]
public class Category
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    [Required, MaxLength(100)]
    [Column("TenDanhMuc")]
    public string Name { get; set; } = string.Empty;

    [Column("MoTa")]
    public string? Description { get; set; }

    [Column("CongTyId")]
    public int? CompanyId { get; set; }
    public virtual Company? Company { get; set; }
    public virtual ICollection<Course> Courses { get; set; } = new List<Course>();
}
