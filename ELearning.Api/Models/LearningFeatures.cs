using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ELearning.Api.Models;

[Table("ThaoLuanKhoaHoc")]
public class CourseDiscussion
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    [Column("KhoaHocId")]
    public int CourseId { get; set; }
    public Course? Course { get; set; }

    [Column("BaiHocId")]
    public int? LessonId { get; set; }
    public Lesson? Lesson { get; set; }

    [Required]
    [Column("NguoiDungId")]
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }

    [Required]
    [Column("NoiDung")]
    public string Content { get; set; } = string.Empty;

    [Column("NgayTao")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("ChaId")]
    public int? ParentId { get; set; }
    public CourseDiscussion? Parent { get; set; }
    public List<CourseDiscussion> Replies { get; set; } = new();
}

[Table("GhiChuNguoiDung")]
public class UserNote
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    [Required]
    [Column("NguoiDungId")]
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }

    [Column("KhoaHocId")]
    public int CourseId { get; set; }
    public Course? Course { get; set; }

    [Column("BaiHocId")]
    public int? LessonId { get; set; }
    public Lesson? Lesson { get; set; }

    [Required]
    [Column("NoiDung")]
    public string Content { get; set; } = string.Empty;

    [Column("NgayTao")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("NgayCapNhatCuoi")]
    public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;
}
