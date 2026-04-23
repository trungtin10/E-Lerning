using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ELearning.Api.Models;

[Table("DangKyHoc")]
public class CourseEnrollment
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    [Required]
    [Column("HocVienId")]
    public string UserId { get; set; } = string.Empty;

    [Column("KhoaHocId")]
    public int CourseId { get; set; }

    [Column("NgayDangKy")]
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;

    [Column("NgayBatDauHoc")]
    public DateTime? FirstLearningStartedAt { get; set; }

    [Column("TongThoiGianHocPhut")]
    public int TotalLearningTimeMinutes { get; set; } = 0;

    [Column("TiLeHoanThanh")]
    public double ProgressPercentage { get; set; } = 0;

    [Required, MaxLength(50)]
    [Column("TrangThai")]
    public string Status { get; set; } = "InProgress";

    [Column("NgayHoanThanh")]
    public DateTime? CompletedAt { get; set; }

    public virtual ApplicationUser User { get; set; } = null!;
    public virtual Course Course { get; set; } = null!;
    public virtual ICollection<LessonProgress> LessonProgresses { get; set; } = new List<LessonProgress>();
}

[Table("TienDoHocTap")]
public class LessonProgress
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    [Column("DangKyHocId")]
    public int EnrollmentId { get; set; }

    [Column("BaiHocId")]
    public int LessonId { get; set; }

    [Column("DaHoanThanh")]
    public bool IsCompleted { get; set; } = false;

    [Column("NgayHoanThanh")]
    public DateTime? CompletedAt { get; set; }

    public virtual CourseEnrollment Enrollment { get; set; } = null!;
    public virtual Lesson Lesson { get; set; } = null!;
}

[Table("KetQuaKiemTra")]
public class QuizAttempt
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    [Column("BaiTapId")]
    public int QuizId { get; set; }

    [Required]
    [Column("HocVienId")]
    public string UserId { get; set; } = string.Empty;

    [Column("DiemSo")]
    public int Score { get; set; }

    [Column("SoCauDung")]
    public int CorrectAnswers { get; set; }

    [Column("TongSoCauHoi")]
    public int TotalQuestions { get; set; }

    [Column("KetQuaDat")]
    public bool IsPassed { get; set; }

    [Column("NgayBatDau")]
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    [Column("NgayHoanThanh")]
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;

    public virtual Quiz Quiz { get; set; } = null!;
    public virtual ApplicationUser User { get; set; } = null!;
    public virtual ICollection<QuizAttemptAnswer> SelectedAnswers { get; set; } = new List<QuizAttemptAnswer>();
}

[Table("DapAnKetQua")]
public class QuizAttemptAnswer
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    [Column("KetQuaKiemTraId")]
    public int QuizAttemptId { get; set; }

    [Column("CauHoiId")]
    public int QuestionId { get; set; }

    [Column("DapAnId")]
    public int SelectedAnswerId { get; set; }

    public virtual QuizAttempt QuizAttempt { get; set; } = null!;
    public virtual Question Question { get; set; } = null!;
    public virtual Answer SelectedAnswer { get; set; } = null!;
}

[Table("ChungChi")]
public class Certificate
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    [Required]
    [Column("HocVienId")]
    public string UserId { get; set; } = string.Empty;

    [Column("KhoaHocId")]
    public int CourseId { get; set; }

    [MaxLength(50)]
    [Column("MaChungChi")]
    public string? CertificateCode { get; set; }

    [Column("MauChungChiId")]
    public int? TemplateId { get; set; }

    [Column("NgayCap")]
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;

    [Column("FileUrl")]
    public string? CertificateUrl { get; set; }

    public virtual ApplicationUser User { get; set; } = null!;
    public virtual Course Course { get; set; } = null!;
    public virtual CertificateTemplate? Template { get; set; }
}
