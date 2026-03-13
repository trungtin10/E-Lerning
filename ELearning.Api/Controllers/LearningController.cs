using ELearning.Api.Data;
using ELearning.Api.DTOs;
using ELearning.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ELearning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LearningController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _config;

    public LearningController(ApplicationDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    private string GetBaseUrl()
    {
        var configuredDomain = _config["AppSettings:AppDomain"];
        if (!string.IsNullOrEmpty(configuredDomain)) return configuredDomain.TrimEnd('/');
        
        if (Request.Headers.TryGetValue("X-Forwarded-Host", out var forwardedHost))
        {
            var proto = Request.Headers["X-Forwarded-Proto"].FirstOrDefault() ?? "https";
            return $"{proto}://{forwardedHost}";
        }

        var host = Request.Host.Value;
        if (host.Contains("localhost:5211")) return $"{Request.Scheme}://{host.Replace("5211", "5173")}";
        return $"{Request.Scheme}://{host}";
    }

    [HttpPost("enroll")]
    public async Task<IActionResult> Enroll([FromBody] EnrollmentRequestDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var existing = await _context.CourseEnrollments
            .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == dto.CourseId);

        if (existing != null) return Ok(new { Message = "Bạn đã đăng ký khóa học này rồi." });

        var enrollment = new CourseEnrollment
        {
            UserId = userId,
            CourseId = dto.CourseId,
            EnrolledAt = DateTime.UtcNow,
            ProgressPercentage = 0,
            Status = "InProgress"
        };

        _context.CourseEnrollments.Add(enrollment);
        await _context.SaveChangesAsync();

        var lessons = await _context.Lessons
            .Where(l => l.CourseId == dto.CourseId)
            .ToListAsync();

        foreach (var lesson in lessons)
        {
            _context.LessonProgresses.Add(new LessonProgress
            {
                EnrollmentId = enrollment.Id,
                LessonId = lesson.Id,
                IsCompleted = false
            });
        }

        await _context.SaveChangesAsync();
        return Ok(new { Message = "Đăng ký thành công!", EnrollmentId = enrollment.Id });
    }

    [HttpPost("complete-lesson")]
    public async Task<IActionResult> CompleteLesson([FromBody] CompleteLessonDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        var progress = await _context.LessonProgresses
            .Include(p => p.Enrollment)
            .FirstOrDefaultAsync(p => p.LessonId == dto.LessonId && p.Enrollment.UserId == userId);

        if (progress == null) return NotFound("Không tìm thấy thông tin học tập.");

        if (!progress.IsCompleted)
        {
            progress.IsCompleted = true;
            progress.CompletedAt = DateTime.UtcNow;

            var enrollmentId = progress.EnrollmentId;
            var allLessonsInProgress = await _context.LessonProgresses
                .Where(p => p.EnrollmentId == enrollmentId)
                .ToListAsync();

            int totalLessons = allLessonsInProgress.Count;
            int completedLessons = allLessonsInProgress.Count(p => p.IsCompleted);

            var enrollment = await _context.CourseEnrollments.FindAsync(enrollmentId);
            if (enrollment != null && totalLessons > 0)
            {
                enrollment.ProgressPercentage = Math.Round(((double)completedLessons / totalLessons) * 100, 2);
                if (enrollment.ProgressPercentage >= 100)
                {
                    enrollment.Status = "Completed";
                    enrollment.CompletedAt = DateTime.UtcNow;
                }
                await _context.SaveChangesAsync();
            }
        }

        return Ok(new { Message = "Đã hoàn thành bài học!" });
    }

    [HttpGet("my-courses")]
    public async Task<IActionResult> GetMyCourses()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var enrollments = await _context.CourseEnrollments
            .Include(e => e.Course).ThenInclude(c => c.Category)
            .Where(e => e.UserId == userId)
            .OrderByDescending(e => e.EnrolledAt)
            .ToListAsync();

        var result = enrollments.Select(e => new MyEnrolledCourseDto(
            e.Course.Id,
            e.Course.CourseCode,
            e.Course.Title,
            e.Course.ThumbnailUrl,
            e.Course.Category?.Name,
            e.Course.StartDate,
            e.Course.EndDate,
            e.ProgressPercentage,
            e.Status,
            e.EnrolledAt
        )).ToList();

        return Ok(result);
    }

    [HttpGet("progress/{courseId}")]
    public async Task<ActionResult<UserCourseProgressDto>> GetProgress(int courseId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        var enrollment = await _context.CourseEnrollments
            .Include(e => e.Course)
            .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == courseId);

        if (enrollment == null) return NotFound("Bạn chưa đăng ký khóa học này.");

        var lessonsProgress = await _context.LessonProgresses
            .Include(p => p.Lesson)
            .Where(p => p.EnrollmentId == enrollment.Id)
            .OrderBy(p => p.Lesson.OrderIndex)
            .ToListAsync();

        var lessonDtos = lessonsProgress.Select(p =>
        {
            List<LessonSectionDto>? sections = null;
            if (!string.IsNullOrEmpty(p.Lesson.SectionsJson))
            {
                try
                {
                    var list = System.Text.Json.JsonSerializer.Deserialize<List<JsonSection>>(p.Lesson.SectionsJson);
                    sections = list?.Select(s => new LessonSectionDto(s.Title ?? "", s.Content, s.ShowVideo, s.ShowQuiz, s.VideoUrl)).ToList();
                }
                catch { }
            }
            if (sections == null)
            {
                sections = new List<LessonSectionDto>
                {
                    new(p.Lesson.Section1Title ?? "1. Giới thiệu bài học", p.Lesson.Overview, p.Lesson.ShowVideo1, p.Lesson.ShowQuiz1, p.Lesson.VideoUrl1),
                    new(p.Lesson.Section2Title ?? "2. Bài giảng chi tiết", p.Lesson.Content, p.Lesson.ShowVideo2, p.Lesson.ShowQuiz2, p.Lesson.VideoUrl2),
                    new(p.Lesson.Section3Title ?? "3. Phần ôn tập", p.Lesson.ReviewContent, p.Lesson.ShowVideo3, p.Lesson.ShowQuiz3, p.Lesson.VideoUrl3),
                    new(p.Lesson.Section4Title ?? "4. Câu hỏi tự luận", p.Lesson.EssayQuestion, p.Lesson.ShowVideo4, p.Lesson.ShowQuiz4, p.Lesson.VideoUrl4),
                    new(p.Lesson.Section5Title ?? "5. Tổng kết bài học", null, p.Lesson.ShowVideo5, p.Lesson.ShowQuiz5, p.Lesson.VideoUrl5)
                };
            }
            return new UserLessonProgressDto(
            p.LessonId,
            p.Lesson.Title,
            sections,
            p.Lesson.Overview,
            p.Lesson.Content,
            p.Lesson.ReviewContent,
            p.Lesson.EssayQuestion,
            p.Lesson.VideoUrl1 != null ? (p.Lesson.VideoUrl1.StartsWith("http") ? p.Lesson.VideoUrl1 : p.Lesson.VideoUrl1) : null,
            p.Lesson.VideoUrl2 != null ? (p.Lesson.VideoUrl2.StartsWith("http") ? p.Lesson.VideoUrl2 : p.Lesson.VideoUrl2) : null,
            p.Lesson.VideoUrl3 != null ? (p.Lesson.VideoUrl3.StartsWith("http") ? p.Lesson.VideoUrl3 : p.Lesson.VideoUrl3) : null,
            p.Lesson.VideoUrl4 != null ? (p.Lesson.VideoUrl4.StartsWith("http") ? p.Lesson.VideoUrl4 : p.Lesson.VideoUrl4) : null,
            p.Lesson.VideoUrl5 != null ? (p.Lesson.VideoUrl5.StartsWith("http") ? p.Lesson.VideoUrl5 : p.Lesson.VideoUrl5) : null,
            p.Lesson.ExternalVideoUrl1,
            p.Lesson.ExternalVideoUrl2,
            p.Lesson.ExternalVideoUrl3,
            p.Lesson.ExternalVideoUrl4,
            p.Lesson.ExternalVideoUrl5,
            p.Lesson.ShowVideo1,
            p.Lesson.ShowVideo2,
            p.Lesson.ShowVideo3,
            p.Lesson.ShowVideo4,
            p.Lesson.ShowVideo5,
            p.Lesson.ShowQuiz1,
            p.Lesson.ShowQuiz2,
            p.Lesson.ShowQuiz3,
            p.Lesson.ShowQuiz4,
            p.Lesson.ShowQuiz5,
            p.Lesson.Section1Title ?? "1. Giới thiệu bài học",
            p.Lesson.Section2Title ?? "2. Bài giảng chi tiết",
            p.Lesson.Section3Title ?? "3. Phần ôn tập",
            p.Lesson.Section4Title ?? "4. Câu hỏi tự luận",
            p.Lesson.Section5Title ?? "5. Phần bổ sung",
            p.Lesson.LessonType,
            p.IsCompleted,
            p.CompletedAt
        );
        }).ToList();

        var course = enrollment.Course;
        var introVideoUrl = course.IntroVideoUrl != null
            ? (course.IntroVideoUrl.StartsWith("http") ? course.IntroVideoUrl : course.IntroVideoUrl)
            : null;

        return Ok(new UserCourseProgressDto(
            courseId,
            enrollment.Course.Title,
            enrollment.ProgressPercentage,
            lessonDtos,
            course.ShowIntroVideo,
            introVideoUrl,
            course.IntroExternalVideoUrl
        ));
    }
}
