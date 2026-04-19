using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ELearning.Api.Models;

[Table("BaiTap")]
public class Quiz
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    [Column("KhoaHocId")]
    public int CourseId { get; set; }

    [Column("BaiHocId")]
    public int? LessonId { get; set; }

    [Column("ViTriHienThi")]
    public int SectionNumber { get; set; } = 0; // 0: Bài thi cuối khóa, 1-5: Bài tập trong từng phần của bài học

    [Required, MaxLength(200)]
    [Column("TieuDe")]
    public string Title { get; set; } = string.Empty;

    [Column("MoTa")]
    public string? Description { get; set; }

    [Column("DiemDat")]
    public int PassingScore { get; set; } = 80;

    [Column("GioiHanThoiGianPhut")]
    public int? TimeLimitMinutes { get; set; }

    public virtual Course Course { get; set; } = null!;
    public virtual Lesson? Lesson { get; set; }
    public virtual ICollection<Question> Questions { get; set; } = new List<Question>();
}

[Table("CauHoi")]
public class Question
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    [Column("BaiTapId")]
    public int QuizId { get; set; }

    [Required]
    [Column("NoiDung")]
    public string Content { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    [Column("LoaiCauHoi")]
    public string QuestionType { get; set; } = "SingleChoice";

    [Column("Diem")]
    public int Points { get; set; } = 1;
    public virtual Quiz Quiz { get; set; } = null!;
    public virtual ICollection<Answer> Answers { get; set; } = new List<Answer>();
}

[Table("DapAn")]
public class Answer
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    [Column("CauHoiId")]
    public int QuestionId { get; set; }

    [Required]
    [Column("NoiDung")]
    public string Content { get; set; } = string.Empty;

    [Column("LaDapAnDung")]
    public bool IsCorrect { get; set; } = false;
    public virtual Question Question { get; set; } = null!;
}
