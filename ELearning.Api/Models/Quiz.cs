using System.ComponentModel.DataAnnotations;

namespace ELearning.Api.Models;

public class Quiz
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public int? LessonId { get; set; }
    public int SectionNumber { get; set; } = 0; // 0: Bài thi cuối khóa, 1-5: Bài tập trong từng phần của bài học

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int PassingScore { get; set; } = 80;
    public int? TimeLimitMinutes { get; set; }

    public virtual Course Course { get; set; } = null!;
    public virtual Lesson? Lesson { get; set; }
    public virtual ICollection<Question> Questions { get; set; } = new List<Question>();
}

public class Question
{
    public int Id { get; set; }
    public int QuizId { get; set; }
    [Required]
    public string Content { get; set; } = string.Empty;
    [Required, MaxLength(50)]
    public string QuestionType { get; set; } = "SingleChoice";
    public int Points { get; set; } = 1;
    public virtual Quiz Quiz { get; set; } = null!;
    public virtual ICollection<Answer> Answers { get; set; } = new List<Answer>();
}

public class Answer
{
    public int Id { get; set; }
    public int QuestionId { get; set; }
    [Required]
    public string Content { get; set; } = string.Empty;
    public bool IsCorrect { get; set; } = false;
    public virtual Question Question { get; set; } = null!;
}
