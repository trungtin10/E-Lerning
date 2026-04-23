using ELearning.Api.Data;
using ELearning.Api.DTOs;
using ELearning.Api.Models;
using ELearning.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ELearning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LearningController : BaseApiController
{
    private readonly IAuditService _audit;
    private readonly ICertificateService _certService;

    public LearningController(ApplicationDbContext context, IConfiguration config, IAuditService audit, ICertificateService certService)
        : base(context, config)
    {
        _audit = audit;
        _certService = certService;
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
        var course = await _context.Courses.FindAsync(dto.CourseId);
        await _audit.LogAsync("Enroll", "CourseEnrollment", enrollment.Id.ToString(), null, course?.Title ?? dto.CourseId.ToString(), "Đăng ký khóa học");
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
                    await _context.SaveChangesAsync();
                    
                    // Trigger cấp chứng chỉ tự động
                    await _certService.CheckAndIssueCertificateAsync(userId!, enrollment.CourseId);
                }
                else
                {
                    await _context.SaveChangesAsync();
                }
            }
        }

        var lesson = await _context.Lessons.FindAsync(dto.LessonId);
        await _audit.LogAsync("Complete", "LessonProgress", dto.LessonId.ToString(), null, lesson?.Title ?? "", "Hoàn thành bài học");
        return Ok(new { Message = "Đã hoàn thành bài học!" });
    }

    /// <summary>Ghi nhận hành vi học viên (xem bài, xem video, làm quiz...)</summary>
    [HttpPost("track-event")]
    public async Task<IActionResult> TrackBehaviorEvent([FromBody] TrackBehaviorEventDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var courseId = dto.CourseId;
        if (courseId <= 0) return BadRequest("CourseId required");

        var enrollment = await _context.CourseEnrollments
            .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == courseId);
        if (enrollment == null) return NotFound("Bạn chưa đăng ký khóa học này.");

        var evt = new LearnerBehaviorEvent
        {
            UserId = userId,
            CourseId = courseId,
            EnrollmentId = enrollment.Id,
            EventType = dto.EventType,
            EntityType = dto.EntityType,
            EntityId = dto.EntityId,
            Metadata = dto.Metadata?.Length > 500 ? dto.Metadata[..500] : dto.Metadata
        };
        _context.LearnerBehaviorEvents.Add(evt);
        await _context.SaveChangesAsync();
        return Ok(new { Id = evt.Id });
    }

    /// <summary>Ghi nhận thời gian học thực tế khi học viên thoát khỏi trang học</summary>
    [HttpPost("record-session")]
    public async Task<IActionResult> RecordLearningSession([FromBody] RecordLearningSessionDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var enrollment = await _context.CourseEnrollments
            .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == dto.CourseId);
        if (enrollment == null) return NotFound("Bạn chưa đăng ký khóa học này.");

        if (dto.Minutes > 0)
        {
            enrollment.TotalLearningTimeMinutes += dto.Minutes;
            await _context.SaveChangesAsync();
        }
        return Ok(new { Message = "Đã lưu thời gian học.", TotalMinutes = enrollment.TotalLearningTimeMinutes });
    }

    /// <summary>Danh sách tổng thời gian học của học viên trong khóa (cho Admin) - chỉ hiện user thuộc công ty của khóa học</summary>
    [HttpGet("learning-times/{courseId}")]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin,Editor,Instructor,SuperAdmin")]
    public async Task<ActionResult<List<LearningTimeSummaryDto>>> GetCourseLearningTimes(int courseId)
    {
        var course = await _context.Courses.AsNoTracking().FirstOrDefaultAsync(c => c.Id == courseId);
        if (course == null) return NotFound();

        var query = _context.CourseEnrollments
            .Include(e => e.User)
            .Where(e => e.CourseId == courseId);

        if (course.CompanyId.HasValue && course.CompanyId.Value > 0)
        {
            query = query.Where(e => e.User != null && e.User.CompanyId == course.CompanyId.Value);
        }

        var enrollments = await query
            .OrderByDescending(e => e.TotalLearningTimeMinutes)
            .ToListAsync();

        var result = enrollments.Select(e => new LearningTimeSummaryDto(
            e.User?.FullName ?? e.User?.UserName ?? "N/A",
            e.TotalLearningTimeMinutes
        )).ToList();
        return Ok(result);
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

        var certificates = await _context.Certificates
            .Where(c => c.UserId == userId)
            .ToDictionaryAsync(c => c.CourseId, c => c.Id);

        var enrolledIds = enrollments.Select(e => e.CourseId).ToHashSet();
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
            e.EnrolledAt,
            true,
            certificates.TryGetValue(e.CourseId, out var certId) ? certId : null
        )).ToList();

        // Thêm khóa học thuộc công ty user (chưa đăng ký) - đồng bộ hiển thị
        var companyId = await GetUserCompanyIdAsync();
        if (companyId.HasValue && companyId.Value > 0)
        {
            var companyCourses = await _context.Courses
                .Include(c => c.Category)
                .Where(c => c.CompanyId == companyId && c.IsPublished && !enrolledIds.Contains(c.Id))
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            foreach (var c in companyCourses)
            {
                result.Add(new MyEnrolledCourseDto(
                    c.Id,
                    c.CourseCode,
                    c.Title,
                    c.ThumbnailUrl,
                    c.Category?.Name,
                    c.StartDate,
                    c.EndDate,
                    0,
                    "Available",
                    null,
                    false,
                    null
                ));
            }
        }

        return Ok(result);
    }

    [HttpGet("progress/{courseId}")]
    public async Task<ActionResult<UserCourseProgressDto>> GetProgress(int courseId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var course = await _context.Courses.FirstOrDefaultAsync(c => c.Id == courseId);
        if (course == null) return NotFound("Không tìm thấy khóa học.");

        var enrollment = await _context.CourseEnrollments
            .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == courseId);

        // Auto-enroll: khóa học thuộc công ty của user thì vào học ngay (không cần bấm đăng ký)
        if (enrollment == null)
        {
            var companyId = await GetUserCompanyIdAsync();
            if (companyId.HasValue && companyId.Value > 0)
            {
                var courseEntity = await _context.Courses.AsNoTracking().FirstOrDefaultAsync(c => c.Id == courseId);
                if (courseEntity != null && courseEntity.IsPublished && courseEntity.CompanyId == companyId.Value)
                {
                    enrollment = new CourseEnrollment
                    {
                        CourseId = courseId,
                        UserId = userId,
                        EnrolledAt = DateTime.UtcNow,
                        Status = "InProgress",
                        ProgressPercentage = 0
                    };
                    _context.CourseEnrollments.Add(enrollment);
                    await _context.SaveChangesAsync();
                }
            }
        }
        if (enrollment == null) return NotFound("Bạn chưa đăng ký khóa học này.");

        // Ghi nhận thời điểm bắt đầu học (lần đầu truy cập trang học)
        if (!enrollment.FirstLearningStartedAt.HasValue)
        {
            enrollment.FirstLearningStartedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

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
                    sections = list?.Select(s =>
                    {
                        var urls = (s.VideoUrls != null && s.VideoUrls.Count > 0)
                            ? s.VideoUrls
                            : (!string.IsNullOrEmpty(s.VideoUrl) ? new List<string> { s.VideoUrl } : null);
                        return new LessonSectionDto(s.Title ?? "", s.Content, s.ShowVideo, s.ShowQuiz, s.ShowDocs, s.VideoUrl, urls, s.DocUrls);
                    }).ToList();
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
                    sections = new List<LessonSectionDto> { new("1. Phần nội dung", null, false, false, false) };
                }
                else
                {
                    sections = new List<LessonSectionDto>
                    {
                        new(lesson.Section1Title ?? "1. Giới thiệu bài học", lesson.Overview, lesson.ShowVideo1, lesson.ShowQuiz1, false, lesson.VideoUrl1),
                        new(lesson.Section2Title ?? "2. Bài giảng chi tiết", lesson.Content, lesson.ShowVideo2, lesson.ShowQuiz2, false, lesson.VideoUrl2),
                        new(lesson.Section3Title ?? "3. Phần ôn tập", lesson.ReviewContent, lesson.ShowVideo3, lesson.ShowQuiz3, false, lesson.VideoUrl3),
                        new(lesson.Section4Title ?? "4. Câu hỏi tự luận", lesson.EssayQuestion, lesson.ShowVideo4, lesson.ShowQuiz4, false, lesson.VideoUrl4),
                        new(lesson.Section5Title ?? "5. Tổng kết bài học", null, lesson.ShowVideo5, lesson.ShowQuiz5, false, lesson.VideoUrl5)
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
            course.Title,
            course.CourseCode,
            course.StartDate,
            course.EndDate,
            progressPct,
            lessonDtos,
            course.ShowIntroVideo,
            introVideoUrl,
            course.IntroExternalVideoUrl,
            course.Description,
            course.IntroSectionsJson
        ));
    }
}
