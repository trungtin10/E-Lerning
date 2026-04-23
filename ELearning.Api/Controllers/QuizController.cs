using ELearning.Api.Data;
using ELearning.Api.DTOs;
using ELearning.Api.Models;
using ELearning.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ELearning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class QuizController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _audit;
    private readonly ICertificateService _certService;

    public QuizController(ApplicationDbContext context, IAuditService audit, ICertificateService certService)
    {
        _context = context;
        _audit = audit;
        _certService = certService;
    }

    [HttpGet("{courseId}")]
    public async Task<ActionResult<QuizDataDto>> GetQuiz(int courseId, [FromQuery] int section = 0, [FromQuery] int? lessonId = null)
    {
        try 
        {
            // Kiểm tra Course hoặc Lesson có tồn tại không trước khi làm việc với Quiz
            var courseExists = await _context.Courses.AnyAsync(c => c.Id == courseId);
            if (!courseExists) return NotFound($"Không tìm thấy khóa học với ID {courseId}");

            if (lessonId.HasValue && lessonId.Value > 0)
            {
                var lessonExists = await _context.Lessons.AnyAsync(l => l.Id == lessonId.Value);
                if (!lessonExists) return NotFound($"Không tìm thấy bài học với ID {lessonId}");
            }

            var quiz = await _context.Quizzes
                .Include(q => q.Questions)
                .ThenInclude(q => q.Answers)
                .FirstOrDefaultAsync(q => q.CourseId == courseId && q.SectionNumber == section && q.LessonId == lessonId);

            if (quiz == null)
            {
                quiz = new Quiz 
                { 
                    CourseId = courseId, 
                    LessonId = (lessonId.HasValue && lessonId.Value > 0) ? lessonId : null,
                    SectionNumber = section,
                    Title = section == 0 ? "Bài thi kết thúc khóa học" : $"Bài tập Phần {section}" 
                };
                _context.Quizzes.Add(quiz);
                await _context.SaveChangesAsync();
                
                // Nạp lại với các liên kết (tránh lỗi null ở các thuộc tính ảo nếu cần)
                quiz = await _context.Quizzes
                    .Include(q => q.Questions)
                    .FirstOrDefaultAsync(q => q.Id == quiz.Id);
            }

            if (quiz == null) return StatusCode(500, "Không thể khởi tạo bài tập.");

            var questionDtos = quiz.Questions.Select(q => new QuestionDto(
                q.Id,
                q.Content,
                q.QuestionType,
                q.Answers != null ? q.Answers.Select(a => new AnswerDto(a.Id, a.Content, a.IsCorrect)).ToList() : new List<AnswerDto>()
            )).ToList();

            return Ok(new QuizDataDto(
                quiz.Id,
                quiz.Title,
                quiz.PassingScore,
                quiz.TimeLimitMinutes,
                questionDtos
            ));
        }
        catch (Exception ex) 
        {
            var msg = ex.InnerException?.Message ?? ex.Message;
            return StatusCode(500, new { error = $"Lỗi server khi lấy Quiz: {msg}" });
        }
    }

    [HttpPost("questions")]
    public async Task<IActionResult> UpsertQuestion([FromBody] UpsertQuestionDto dto)
    {
        try
        {
            Question? question;
            if (dto.Id.HasValue && dto.Id > 0)
            {
                question = await _context.Questions.Include(q => q.Answers).FirstOrDefaultAsync(q => q.Id == dto.Id);
                if (question == null) return NotFound();
                question.Content = dto.Content;
                question.QuestionType = dto.QuestionType;
                _context.Answers.RemoveRange(question.Answers);
            }
            else
            {
                question = new Question { QuizId = dto.QuizId, Content = dto.Content, QuestionType = dto.QuestionType };
                _context.Questions.Add(question);
            }

            foreach (var ans in dto.Answers)
            {
                _context.Answers.Add(new Answer { Question = question, Content = ans.Content, IsCorrect = ans.IsCorrect });
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Đã lưu câu hỏi thành công!" });
        }
        catch (Exception ex) { return StatusCode(500, new { error = ex.InnerException?.Message ?? ex.Message }); }
    }

    [HttpPut("update/{id}")]
    public async Task<IActionResult> UpdateQuiz(int id, [FromBody] UpdateQuizDto dto)
    {
        var quiz = await _context.Quizzes.FindAsync(id);
        if (quiz == null) return NotFound();
        quiz.PassingScore = dto.PassingScore;
        quiz.TimeLimitMinutes = dto.TimeLimitMinutes;
        await _context.SaveChangesAsync();
        await _audit.LogAsync("Update", "Quiz", id.ToString(), null, quiz.Title, "Cập nhật cài đặt bài kiểm tra");
        return Ok(new { Message = "Đã lưu cài đặt bài kiểm tra!" });
    }

    [HttpDelete("questions/{id}")]
    public async Task<IActionResult> DeleteQuestion(int id)
    {
        var q = await _context.Questions.FindAsync(id);
        if (q == null) return NotFound();
        var content = q.Content;
        _context.Questions.Remove(q);
        await _context.SaveChangesAsync();
        await _audit.LogAsync("Delete", "Question", id.ToString(), content, null, "Xóa câu hỏi quiz");
        return Ok();
    }

    [HttpPost("submit")]
    public async Task<ActionResult<QuizResultDto>> SubmitQuiz([FromBody] SubmitQuizDto dto)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var quiz = await _context.Quizzes
            .Include(q => q.Questions)
            .ThenInclude(q => q.Answers)
            .FirstOrDefaultAsync(q => q.Id == dto.QuizId);
        if (quiz == null) return NotFound("Không tìm thấy bài kiểm tra.");

        int correct = 0;
        foreach (var ua in dto.SelectedAnswers)
        {
            var question = quiz.Questions.FirstOrDefault(q => q.Id == ua.QuestionId);
            if (question == null) continue;
            var correctAnswer = question.Answers.FirstOrDefault(a => a.IsCorrect);
            if (correctAnswer != null && ua.AnswerId == correctAnswer.Id) correct++;
        }
        int total = quiz.Questions.Count;
        int score = total > 0 ? (int)Math.Round((double)correct / total * 100) : 0;
        bool isPassed = score >= quiz.PassingScore;

        var attempt = new QuizAttempt
        {
            QuizId = quiz.Id,
            UserId = userId,
            Score = score,
            CorrectAnswers = correct,
            TotalQuestions = total,
            IsPassed = isPassed,
            StartedAt = DateTime.UtcNow.AddMinutes(-5),
            CompletedAt = DateTime.UtcNow
        };
        _context.QuizAttempts.Add(attempt);
        await _context.SaveChangesAsync();

        foreach (var ua in dto.SelectedAnswers)
        {
            var question = quiz.Questions.FirstOrDefault(q => q.Id == ua.QuestionId);
            if (question == null) continue;
            var answerExists = question.Answers.Any(a => a.Id == ua.AnswerId);
            if (!answerExists) continue;
            _context.QuizAttemptAnswers.Add(new QuizAttemptAnswer
            {
                QuizAttemptId = attempt.Id,
                QuestionId = ua.QuestionId,
                SelectedAnswerId = ua.AnswerId
            });
        }
        await _context.SaveChangesAsync();
        await _audit.LogAsync("Submit", "QuizAttempt", attempt.Id.ToString(), null, $"{score}% ({correct}/{total})", "Nộp bài kiểm tra");

        // Nếu là bài thi cuối khóa và đạt điểm, thử cấp chứng chỉ tự động
        if (quiz.SectionNumber == 0 && isPassed)
        {
            await _certService.CheckAndIssueCertificateAsync(userId, quiz.CourseId);
        }

        return Ok(new QuizResultDto(score, isPassed, correct, total));
    }

    /// <summary>Danh sách TẤT CẢ bài trắc nghiệm trong khóa - đồng bộ từ cấu trúc bài học + quiz đã có trong DB</summary>
    [HttpGet("{courseId}/quizzes-with-results")]
    [Authorize(Roles = "Admin,Editor,Instructor,SuperAdmin")]
    public async Task<ActionResult<List<QuizWithResultsSummaryDto>>> GetQuizzesWithResults(int courseId)
    {
        var course = await _context.Courses.Include(c => c.Lessons).FirstOrDefaultAsync(c => c.Id == courseId);
        if (course == null) return NotFound();

        var lessons = (course.Lessons ?? new List<Lesson>()).OrderBy(l => l.OrderIndex).ToList();
        var lessonOrder = lessons.ToDictionary(l => l.Id, l => lessons.IndexOf(l) + 1);

        // Chỉ hiện bài trắc nghiệm đã có trong DB và đã tạo câu hỏi (có nội dung)
        var existingQuizzes = await _context.Quizzes
            .Where(q => q.CourseId == courseId && q.Questions.Any())
            .ToListAsync();
        var existingByKey = existingQuizzes
            .GroupBy(q => (q.LessonId, q.SectionNumber))
            .ToDictionary(g => g.Key, g => g.First());
        var courseQuizIds = existingQuizzes.Select(q => q.Id).ToHashSet();
        var attemptCounts = courseQuizIds.Count > 0
            ? await _context.QuizAttempts
                .Where(a => courseQuizIds.Contains(a.QuizId))
                .GroupBy(a => a.QuizId)
                .Select(g => new { QuizId = g.Key, Count = g.Select(x => x.UserId).Distinct().Count() })
                .ToDictionaryAsync(x => x.QuizId, x => x.Count)
            : new Dictionary<int, int>();

        var result = new List<QuizWithResultsSummaryDto>();
        foreach (var kv in existingByKey.OrderBy(x => x.Key.Item1 ?? int.MaxValue).ThenBy(x => x.Key.Item2))
        {
            var (lessonId, sectionNumber) = kv.Key;
            // Bỏ qua quiz không gắn bài học (hiển thị "Mục 1", "Mục 2" - chưa tạo đúng cách)
            if (sectionNumber != 0 && !lessonId.HasValue) continue;
            var quiz = kv.Value;
            var displayTitle = sectionNumber == 0
                ? "Bài thi kết thúc khóa học"
                : lessonId.HasValue && lessonOrder.TryGetValue(lessonId.Value, out var idx)
                    ? $"Bài {idx} - Mục {sectionNumber}"
                    : $"Mục {sectionNumber}";
            var attemptCount = attemptCounts.GetValueOrDefault(quiz.Id, 0);
            result.Add(new QuizWithResultsSummaryDto(quiz.Id, lessonId, sectionNumber, displayTitle, attemptCount));
        }

        return Ok(result);
    }

    [HttpGet("{courseId}/results")]
    [Authorize(Roles = "Admin,Editor,Instructor,SuperAdmin")]
    public async Task<ActionResult<List<QuizResultSummaryDto>>> GetQuizResults(int courseId, [FromQuery] int section = 0, [FromQuery] int? lessonId = null)
    {
        var quiz = await _context.Quizzes
            .Include(q => q.Questions)
            .FirstOrDefaultAsync(q => q.CourseId == courseId && q.SectionNumber == section && q.LessonId == lessonId);
        if (quiz == null) return Ok(new List<QuizResultSummaryDto>());

        int totalQuestions = quiz.Questions?.Count ?? 0;
        var attempts = await _context.QuizAttempts
            .Include(a => a.User)
            .Where(a => a.QuizId == quiz.Id)
            .OrderByDescending(a => a.CompletedAt)
            .ToListAsync();

        var enrollmentByUser = await _context.CourseEnrollments
            .Where(e => e.CourseId == courseId)
            .ToDictionaryAsync(e => e.UserId);

        var latestByUser = attempts
            .GroupBy(a => a.UserId)
            .Select(g => g.First())
            .ToList();

        var now = DateTime.UtcNow;
        var result = latestByUser.Select(a =>
        {
            int correct = a.TotalQuestions > 0 ? a.CorrectAnswers : (int)Math.Round(a.Score * totalQuestions / 100.0);
            int total = a.TotalQuestions > 0 ? a.TotalQuestions : totalQuestions;
            int? timeFromStart = null;
            int? totalTimeInCourse = null;
            if (enrollmentByUser.TryGetValue(a.UserId, out var enrollment))
            {
                var startAt = enrollment.FirstLearningStartedAt ?? enrollment.EnrolledAt;
                timeFromStart = (int)Math.Round((a.CompletedAt - startAt).TotalMinutes);
                totalTimeInCourse = (int)Math.Round((now - startAt).TotalMinutes);
            }
            return new QuizResultSummaryDto(
                a.Id,
                a.User?.FullName ?? a.User?.UserName ?? "N/A",
                correct,
                total,
                timeFromStart,
                totalTimeInCourse
            );
        }).ToList();

        return Ok(result);
    }

    [HttpGet("attempt/{attemptId}/detail")]
    [Authorize(Roles = "Admin,Editor,Instructor,SuperAdmin")]
    public async Task<ActionResult<QuizAttemptDetailDto>> GetAttemptDetail(int attemptId)
    {
        var attempt = await _context.QuizAttempts
            .Include(a => a.User)
            .Include(a => a.Quiz).ThenInclude(q => q.Questions).ThenInclude(q => q.Answers)
            .Include(a => a.SelectedAnswers)
            .FirstOrDefaultAsync(a => a.Id == attemptId);
        if (attempt == null) return NotFound();

        var selectedByQuestion = attempt.SelectedAnswers?.ToDictionary(sa => sa.QuestionId, sa => sa.SelectedAnswerId) ?? new Dictionary<int, int>();

        var questionDtos = new List<QuizAttemptQuestionDto>();
        foreach (var q in attempt.Quiz?.Questions?.OrderBy(x => x.Id) ?? Enumerable.Empty<Question>())
        {
            var answers = (q.Answers ?? new List<Answer>()).Select(a => new QuizAttemptAnswerOptionDto(a.Id, a.Content, a.IsCorrect)).ToList();
            int? selectedId = selectedByQuestion.TryGetValue(q.Id, out var sid) ? sid : null;
            bool? isCorrect = null;
            if (selectedId.HasValue)
            {
                var correctAns = q.Answers?.FirstOrDefault(a => a.IsCorrect);
                isCorrect = correctAns != null && selectedId.Value == correctAns.Id;
            }
            questionDtos.Add(new QuizAttemptQuestionDto(q.Id, q.Content, answers, selectedId, isCorrect));
        }

        return Ok(new QuizAttemptDetailDto(
            attempt.Id,
            attempt.User?.FullName ?? attempt.User?.UserName ?? "N/A",
            attempt.Quiz?.Title ?? "",
            attempt.Score,
            attempt.CorrectAnswers,
            attempt.TotalQuestions,
            attempt.IsPassed,
            attempt.CompletedAt,
            questionDtos
        ));
    }
}
