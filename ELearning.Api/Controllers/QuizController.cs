using ELearning.Api.Data;
using ELearning.Api.DTOs;
using ELearning.Api.Models;
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

    public QuizController(ApplicationDbContext context)
    {
        _context = context;
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
            var innerMsg = ex.InnerException != null ? $"\nChi tiết: {ex.InnerException.Message}" : "";
            return StatusCode(500, $"Lỗi server khi lấy Quiz: {ex.Message}{innerMsg}");
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
        catch (Exception ex) { return StatusCode(500, ex.Message); }
    }

    [HttpPut("update/{id}")]
    public async Task<IActionResult> UpdateQuiz(int id, [FromBody] UpdateQuizDto dto)
    {
        var quiz = await _context.Quizzes.FindAsync(id);
        if (quiz == null) return NotFound();
        quiz.PassingScore = dto.PassingScore;
        quiz.TimeLimitMinutes = dto.TimeLimitMinutes;
        await _context.SaveChangesAsync();
        return Ok(new { Message = "Đã lưu cài đặt bài kiểm tra!" });
    }

    [HttpDelete("questions/{id}")]
    public async Task<IActionResult> DeleteQuestion(int id)
    {
        var q = await _context.Questions.FindAsync(id);
        if (q == null) return NotFound();
        _context.Questions.Remove(q);
        await _context.SaveChangesAsync();
        return Ok();
    }
}
