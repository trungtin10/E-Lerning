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

        var host = Request.Host.Value ?? string.Empty;
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

        // Lấy tất cả bài học của khóa (đồng bộ với course/2), tạo LessonProgress nếu chưa có
        var allLessons = await _context.Lessons
            .Where(l => l.CourseId == courseId)
            .OrderBy(l => l.OrderIndex)
            .ToListAsync();

        var existingProgress = await _context.LessonProgresses
            .Where(p => p.EnrollmentId == enrollment.Id)
            .ToDictionaryAsync(p => p.LessonId);

        foreach (var lesson in allLessons)
        {
            if (!existingProgress.ContainsKey(lesson.Id))
            {
                var lp = new LessonProgress { EnrollmentId = enrollment.Id, LessonId = lesson.Id, IsCompleted = false };
                _context.LessonProgresses.Add(lp);
                existingProgress[lesson.Id] = lp;
            }
        }
        await _context.SaveChangesAsync();

        var lessonDtos = allLessons.Select(lesson =>
        {
            var p = existingProgress.TryGetValue(lesson.Id, out var prog) ? prog : null;
            var isCompleted = p?.IsCompleted ?? false;
            var completedAt = p?.CompletedAt;
            List<LessonSectionDto>? sections = null;
            if (!string.IsNullOrEmpty(lesson.SectionsJson))
            {
                try
                {
                    var jsonOpts = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var list = System.Text.Json.JsonSerializer.Deserialize<List<JsonSection>>(lesson.SectionsJson, jsonOpts);
                    sections = list?.Select(s => new LessonSectionDto(s.Title ?? "", s.Content, s.ShowVideo, s.ShowQuiz, s.VideoUrl)).ToList();
                }
                catch { }
            }
            if (sections == null)
            {
                var hasContent = !string.IsNullOrWhiteSpace(lesson.Overview) || !string.IsNullOrWhiteSpace(lesson.Content) || !string.IsNullOrWhiteSpace(lesson.ReviewContent) || !string.IsNullOrWhiteSpace(lesson.EssayQuestion);
                var hasMedia = lesson.VideoUrl1 != null || lesson.VideoUrl2 != null || lesson.VideoUrl3 != null || lesson.VideoUrl4 != null || lesson.VideoUrl5 != null;
                var hasQuiz = lesson.ShowQuiz1 || lesson.ShowQuiz2 || lesson.ShowQuiz3 || lesson.ShowQuiz4 || lesson.ShowQuiz5;
                if (!hasContent && !hasMedia && !hasQuiz)
                {
                    sections = new List<LessonSectionDto> { new("1. Phần nội dung", null, false, false, null) };
                }
                else
                {
                    sections = new List<LessonSectionDto>
                    {
                        new(lesson.Section1Title ?? "1. Giới thiệu bài học", lesson.Overview, lesson.ShowVideo1, lesson.ShowQuiz1, lesson.VideoUrl1),
                        new(lesson.Section2Title ?? "2. Bài giảng chi tiết", lesson.Content, lesson.ShowVideo2, lesson.ShowQuiz2, lesson.VideoUrl2),
                        new(lesson.Section3Title ?? "3. Phần ôn tập", lesson.ReviewContent, lesson.ShowVideo3, lesson.ShowQuiz3, lesson.VideoUrl3),
                        new(lesson.Section4Title ?? "4. Câu hỏi tự luận", lesson.EssayQuestion, lesson.ShowVideo4, lesson.ShowQuiz4, lesson.VideoUrl4),
                        new(lesson.Section5Title ?? "5. Tổng kết bài học", null, lesson.ShowVideo5, lesson.ShowQuiz5, lesson.VideoUrl5)
                    };
                }
            }
            return new UserLessonProgressDto(
            lesson.Id,
            lesson.Title,
            sections,
            lesson.Overview,
            lesson.Content,
            lesson.ReviewContent,
            lesson.EssayQuestion,
            lesson.VideoUrl1 != null ? (lesson.VideoUrl1.StartsWith("http") ? lesson.VideoUrl1 : lesson.VideoUrl1) : null,
            lesson.VideoUrl2 != null ? (lesson.VideoUrl2.StartsWith("http") ? lesson.VideoUrl2 : lesson.VideoUrl2) : null,
            lesson.VideoUrl3 != null ? (lesson.VideoUrl3.StartsWith("http") ? lesson.VideoUrl3 : lesson.VideoUrl3) : null,
            lesson.VideoUrl4 != null ? (lesson.VideoUrl4.StartsWith("http") ? lesson.VideoUrl4 : lesson.VideoUrl4) : null,
            lesson.VideoUrl5 != null ? (lesson.VideoUrl5.StartsWith("http") ? lesson.VideoUrl5 : lesson.VideoUrl5) : null,
            lesson.ExternalVideoUrl1,
            lesson.ExternalVideoUrl2,
            lesson.ExternalVideoUrl3,
            lesson.ExternalVideoUrl4,
            lesson.ExternalVideoUrl5,
            lesson.ShowVideo1,
            lesson.ShowVideo2,
            lesson.ShowVideo3,
            lesson.ShowVideo4,
            lesson.ShowVideo5,
            lesson.ShowQuiz1,
            lesson.ShowQuiz2,
            lesson.ShowQuiz3,
            lesson.ShowQuiz4,
            lesson.ShowQuiz5,
            lesson.Section1Title ?? "1. Giới thiệu bài học",
            lesson.Section2Title ?? "2. Bài giảng chi tiết",
            lesson.Section3Title ?? "3. Phần ôn tập",
            lesson.Section4Title ?? "4. Câu hỏi tự luận",
            lesson.Section5Title ?? "5. Phần bổ sung",
            lesson.LessonType,
            isCompleted,
            completedAt
        );
        }).ToList();

        var course = enrollment.Course;
        var introVideoUrl = course.IntroVideoUrl != null
            ? (course.IntroVideoUrl.StartsWith("http") ? course.IntroVideoUrl : course.IntroVideoUrl)
            : null;

        var completedCount = lessonDtos.Count(l => l.IsCompleted);
        var totalCount = lessonDtos.Count;
        var progressPct = totalCount > 0 ? Math.Round((double)completedCount / totalCount * 100, 2) : enrollment.ProgressPercentage;
        if (totalCount > 0 && Math.Abs(enrollment.ProgressPercentage - progressPct) > 0.01)
        {
            enrollment.ProgressPercentage = progressPct;
            await _context.SaveChangesAsync();
        }

        return Ok(new UserCourseProgressDto(
            courseId,
            enrollment.Course.Title,
            enrollment.Course.CourseCode,
            enrollment.Course.StartDate,
            progressPct,
            lessonDtos,
            course.ShowIntroVideo,
            introVideoUrl,
            course.IntroExternalVideoUrl,
            course.Description
        ));
    }
}
