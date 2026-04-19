using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ELearning.Api.Models;

[Table("KhoaHoc")]
public class Course
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    [Required, MaxLength(50)]
    [Column("MaKhoaHoc")]
    public string CourseCode { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    [Column("TieuDe")]
    public string Title { get; set; } = string.Empty;

    [Column("MoTa")]
    public string? Description { get; set; }

    [Column("ThumbnailUrl")]
    public string? ThumbnailUrl { get; set; }

    [Column("JsonGiớiThiệu")]
    public string? IntroSectionsJson { get; set; }

    [Column("HienThiVideoIntro")]
    public bool ShowIntroVideo { get; set; } = false;

    [Column("IntroVideoUrl")]
    public string? IntroVideoUrl { get; set; }

    [Column("IntroExternalVideoUrl")]
    public string? IntroExternalVideoUrl { get; set; }

    [Column("JsonTaiLieuIntro")]
    public string? IntroDocUrlsJson { get; set; }

    [Column("HienThiTaiLieuIntro")]
    public bool ShowIntroDocs { get; set; } = false;

    [Column("DaXuatBan")]
    public bool IsPublished { get; set; } = false;

    [Column("NgayBatDau")]
    public DateTime StartDate { get; set; } = DateTime.UtcNow;

    [Column("NgayKetThuc")]
    public DateTime? EndDate { get; set; }

    [Column("DanhMucId")]
    public int CategoryId { get; set; }

    [Column("GiangVienId")]
    public string? InstructorId { get; set; }

    [Column("CongTyId")]
    public int? CompanyId { get; set; }

    [Column("NgayTao")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("NgayCapNhat")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual Category Category { get; set; } = null!;
    public virtual ApplicationUser? Instructor { get; set; }
    public virtual Company? Company { get; set; }
    public virtual ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
    public virtual ICollection<CourseEnrollment> Enrollments { get; set; } = new List<CourseEnrollment>();
    public virtual ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
}

[Table("BaiHoc")]
public class Lesson
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    [Column("KhoaHocId")]
    public int CourseId { get; set; }

    [Required, MaxLength(200)]
    [Column("TieuDe")]
    public string Title { get; set; } = string.Empty;

    public string? Section1Title { get; set; } = "1. Giới thiệu bài học";
    public string? Section2Title { get; set; } = "2. Bài giảng chi tiết";
    public string? Section3Title { get; set; } = "3. Phần ôn tập";
    public string? Section4Title { get; set; } = "4. Câu hỏi tự luận";
    public string? Section5Title { get; set; } = "5. Bài tập trắc nghiệm";

    public string? Overview { get; set; }
    public string? Content { get; set; }
    public string? ReviewContent { get; set; }
    public string? EssayQuestion { get; set; }

    public string? VideoUrl1 { get; set; }
    public string? VideoUrl2 { get; set; }
    public string? VideoUrl3 { get; set; }
    public string? VideoUrl4 { get; set; }
    public string? VideoUrl5 { get; set; }

    public string? ExternalVideoUrl1 { get; set; }
    public string? ExternalVideoUrl2 { get; set; }
    public string? ExternalVideoUrl3 { get; set; }
    public string? ExternalVideoUrl4 { get; set; }
    public string? ExternalVideoUrl5 { get; set; }

    public bool ShowVideo1 { get; set; } = false;
    public bool ShowVideo2 { get; set; } = false;
    public bool ShowVideo3 { get; set; } = false;
    public bool ShowVideo4 { get; set; } = false;
    public bool ShowVideo5 { get; set; } = false;

    // CÔNG TẮC BÀI TẬP TRẮC NGHIỆM CHO TỪNG MỤC
    public bool ShowQuiz1 { get; set; } = false;
    public bool ShowQuiz2 { get; set; } = false;
    public bool ShowQuiz3 { get; set; } = false;
    public bool ShowQuiz4 { get; set; } = false;
    public bool ShowQuiz5 { get; set; } = false;

    /// <summary>JSON array of sections when using dynamic sections. Format: [{title,content,showVideo,showQuiz,videoUrl},...]</summary>
    public string? SectionsJson { get; set; }

    public DateTime? ScheduledDate { get; set; }

    [Required, MaxLength(50)]
    public string LessonType { get; set; } = "Video";
    public int DurationInMinutes { get; set; } = 0;
    public int OrderIndex { get; set; }

    public virtual Course Course { get; set; } = null!;
    public virtual ICollection<LessonProgress> Progresses { get; set; } = new List<LessonProgress>();
    public virtual ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
}
