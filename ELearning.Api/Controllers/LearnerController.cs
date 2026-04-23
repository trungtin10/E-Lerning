using ELearning.Api.Data;
using ELearning.Api.DTOs;
using ELearning.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ELearning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Editor,Instructor,SuperAdmin")]
public class LearnerController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly RoleManager<IdentityRole> _roleManager;

    public LearnerController(ApplicationDbContext context, RoleManager<IdentityRole> roleManager)
    {
        _context = context;
        _roleManager = roleManager;
    }

    private async Task<int?> GetUserCompanyIdAsync()
    {
        var claim = User.FindFirst("CompanyId")?.Value
            ?? User.FindFirst(c => string.Equals(c.Type, "CompanyId", StringComparison.OrdinalIgnoreCase))?.Value;
        if (int.TryParse(claim, out int cid)) return cid;
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            return user?.CompanyId;
        }
        return null;
    }

    [HttpGet("enrollments")]
    public async Task<ActionResult<List<LearnerEnrollmentDto>>> GetLearnerEnrollments(
        [FromQuery] int? courseId = null,
        [FromQuery] int? companyId = null,
        [FromQuery] string? search = null,
        [FromQuery] bool includeAllCompanyUsers = false)
    {
        var isSuperAdmin = User.IsInRole("SuperAdmin");
        int? filterCompanyId = null;
        if (!isSuperAdmin)
        {
            filterCompanyId = await GetUserCompanyIdAsync();
            if (!filterCompanyId.HasValue || filterCompanyId.Value <= 0)
                return Ok(new List<LearnerEnrollmentDto>());
            includeAllCompanyUsers = true;
        }
        else if (companyId.HasValue && companyId.Value > 0)
        {
            filterCompanyId = companyId;
            includeAllCompanyUsers = true;
        }

        // Lấy danh sách admin user ids để loại bỏ
        var adminRoleIds = await _roleManager.Roles
            .Where(r => r.Name == "Admin" || r.Name == "SuperAdmin")
            .Select(r => r.Id)
            .ToListAsync();
        var adminUserIds = adminRoleIds.Count > 0
            ? await _context.UserRoles
                .Where(ur => adminRoleIds.Contains(ur.RoleId))
                .Select(ur => ur.UserId)
                .Distinct()
                .ToListAsync()
            : new List<string>();

        // 1. Lấy danh sách User hợp lệ của công ty
        var userQuery = _context.Users.AsNoTracking()
            .Include(u => u.Company)
            .Where(u => !adminUserIds.Contains(u.Id));

        if (filterCompanyId.HasValue)
            userQuery = userQuery.Where(u => u.CompanyId == filterCompanyId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            userQuery = userQuery.Where(u =>
                (u.FullName != null && u.FullName.ToLower().Contains(term)) ||
                (u.UserName != null && u.UserName.ToLower().Contains(term)) ||
                (u.Email != null && u.Email.ToLower().Contains(term))
            );
        }

        var users = await userQuery.ToListAsync();
        var userIds = users.Select(u => u.Id).ToList();

        // 2. Lấy Enrollments
        var enrollQuery = _context.CourseEnrollments
            .AsNoTracking()
            .Include(e => e.Course)
            .Include(e => e.LessonProgresses)
            .Where(e => userIds.Contains(e.UserId));

        if (courseId.HasValue && courseId.Value > 0)
            enrollQuery = enrollQuery.Where(e => e.CourseId == courseId.Value);

        var enrollments = await enrollQuery.ToListAsync();

        // 3. Quiz & Certificate Logic
        var actualCourseIds = enrollments.Select(e => e.CourseId).Distinct().ToList();
        var quizAttemptCounts = new Dictionary<string, (int Total, int Passed)>();
        var certificateStatus = new HashSet<string>();

        if (actualCourseIds.Count > 0)
        {
            var courseQuizIds = await _context.Quizzes
                .Where(q => actualCourseIds.Contains(q.CourseId))
                .Select(q => q.Id)
                .ToListAsync();

            if (courseQuizIds.Count > 0)
            {
                var attemptsByUserCourse = await _context.QuizAttempts
                    .Where(a => courseQuizIds.Contains(a.QuizId) && userIds.Contains(a.UserId))
                    .GroupBy(a => new { a.UserId, CourseId = a.Quiz!.CourseId })
                    .Select(g => new
                    {
                        g.Key.UserId,
                        g.Key.CourseId,
                        Total = g.Count(),
                        Passed = g.Count(x => x.IsPassed)
                    })
                    .ToListAsync();
                foreach (var x in attemptsByUserCourse)
                    quizAttemptCounts[$"{x.UserId}_{x.CourseId}"] = (x.Total, x.Passed);
            }

            var certificates = await _context.Certificates
                .AsNoTracking()
                .Where(c => actualCourseIds.Contains(c.CourseId) && userIds.Contains(c.UserId))
                .Select(c => new { c.UserId, c.CourseId })
                .ToListAsync();
            foreach (var c in certificates)
                certificateStatus.Add($"{c.UserId}_{c.CourseId}");
        }

        // 4. Kết hợp dữ liệu
        var result = new List<LearnerEnrollmentDto>();
        foreach (var user in users)
        {
            var userEnrolls = enrollments.Where(e => e.UserId == user.Id).ToList();
            if (userEnrolls.Count == 0)
            {
                // Nếu đang không lọc theo khóa học cụ thể, hoặc user có search trúng thì hiện "Chưa có khóa học"
                if (!courseId.HasValue || courseId.Value <= 0)
                {
                    result.Add(new LearnerEnrollmentDto(
                        0, user.Id, user.FullName ?? user.UserName ?? "N/A", user.Email, user.UserName, user.Company?.CompanyName,
                        0, "Chưa có khóa học", null, 0, 0, "NoCourse", DateTime.MinValue, null, 0, 0, 0, 0, false, false
                    ));
                }
            }
            else
            {
                foreach (var e in userEnrolls)
                {
                    var key = $"{e.UserId}_{e.CourseId}";
                    var (quizTotal, quizPassed) = quizAttemptCounts.GetValueOrDefault(key, (0, 0));
                    var hasCert = certificateStatus.Contains(key);
                    var totalLessons = e.LessonProgresses?.Count ?? 0;
                    var completedLessons = e.LessonProgresses?.Count(p => p.IsCompleted) ?? 0;

                    result.Add(new LearnerEnrollmentDto(
                        e.Id, e.UserId, user.FullName ?? user.UserName ?? "N/A", user.Email, user.UserName, user.Company?.CompanyName,
                        e.CourseId, e.Course?.Title ?? "N/A", e.Course?.CourseCode,
                        e.ProgressPercentage, e.TotalLearningTimeMinutes, e.Status ?? "InProgress",
                        e.EnrolledAt, e.CompletedAt, completedLessons, totalLessons,
                        quizTotal, quizPassed, e.FirstLearningStartedAt.HasValue, hasCert
                    ));
                }
            }
        }

        return Ok(result.OrderByDescending(r => r.EnrolledAt).ThenBy(r => r.FullName).ToList());
    }

    /// <summary>Chi tiết tiến độ học viên trong một khóa (bài học đã hoàn thành + kết quả bài làm)</summary>
    [HttpGet("enrollments/{enrollmentId}")]
    public async Task<ActionResult<LearnerProgressDetailDto>> GetLearnerProgressDetail(int enrollmentId)
    {
        var isSuperAdmin = User.IsInRole("SuperAdmin");
        int? userCompanyId = null;
        if (!isSuperAdmin)
        {
            userCompanyId = await GetUserCompanyIdAsync();
            if (!userCompanyId.HasValue || userCompanyId.Value <= 0)
                return NotFound();
        }

        var enrollment = await _context.CourseEnrollments
            .AsNoTracking()
            .Include(e => e.User)
            .Include(e => e.Course)
            .Include(e => e.LessonProgresses).ThenInclude(p => p.Lesson)
            .FirstOrDefaultAsync(e => e.Id == enrollmentId);

        if (enrollment == null) return NotFound();
        if (!isSuperAdmin && enrollment.User?.CompanyId != userCompanyId)
            return NotFound();

        var lessonProgress = (enrollment.LessonProgresses ?? new List<LessonProgress>())
            .OrderBy(p => p.Lesson?.OrderIndex ?? 0)
            .Select(p => new LearnerLessonProgressDto(
                p.LessonId,
                p.Lesson?.Title ?? "",
                p.Lesson?.OrderIndex ?? 0,
                p.IsCompleted,
                p.CompletedAt
            )).ToList();

        var courseQuizIds = await _context.Quizzes
            .Where(q => q.CourseId == enrollment.CourseId)
            .Select(q => q.Id)
            .ToListAsync();

        var quizAttempts = new List<LearnerQuizAttemptDto>();
        if (courseQuizIds.Count > 0)
        {
            var attempts = await _context.QuizAttempts
                .Include(a => a.Quiz)
                .Where(a => a.UserId == enrollment.UserId && courseQuizIds.Contains(a.QuizId))
                .OrderByDescending(a => a.CompletedAt)
                .ToListAsync();

            var latestByQuiz = attempts.GroupBy(a => a.QuizId).Select(g => g.First()).ToList();
            quizAttempts = latestByQuiz.Select(a => new LearnerQuizAttemptDto(
                a.Id,
                a.QuizId,
                a.Quiz?.Title ?? "",
                a.Score,
                a.CorrectAnswers,
                a.TotalQuestions,
                a.IsPassed,
                a.CompletedAt
            )).ToList();
        }

        var behaviorEvents = await _context.LearnerBehaviorEvents
            .AsNoTracking()
            .Where(e => e.EnrollmentId == enrollmentId)
            .OrderByDescending(e => e.CreatedAt)
            .Take(100)
            .Select(e => new LearnerBehaviorEventDto(
                e.Id,
                e.EventType,
                e.EntityType,
                e.EntityId,
                e.Metadata,
                DateTime.SpecifyKind(e.CreatedAt, DateTimeKind.Utc)
            ))
            .ToListAsync();

        var dto = new LearnerProgressDetailDto(
            enrollment.Id,
            enrollment.User?.FullName ?? enrollment.User?.UserName ?? "N/A",
            enrollment.Course?.Title ?? "",
            enrollment.ProgressPercentage,
            enrollment.TotalLearningTimeMinutes,
            enrollment.Status ?? "InProgress",
            lessonProgress,
            quizAttempts,
            behaviorEvents
        );

        return Ok(dto);
    }

    /// <summary>Lịch sử tất cả lần làm của một bài kiểm tra (một học viên trong enrollment)</summary>
    [HttpGet("enrollments/{enrollmentId}/quizzes/{quizId}/attempts")]
    public async Task<ActionResult<List<LearnerQuizAttemptDto>>> GetQuizAttemptHistory(int enrollmentId, int quizId)
    {
        var isSuperAdmin = User.IsInRole("SuperAdmin");
        int? userCompanyId = null;
        if (!isSuperAdmin)
        {
            userCompanyId = await GetUserCompanyIdAsync();
            if (!userCompanyId.HasValue || userCompanyId.Value <= 0)
                return NotFound();
        }

        var enrollment = await _context.CourseEnrollments
            .AsNoTracking()
            .Include(e => e.User)
            .Include(e => e.Course)
            .FirstOrDefaultAsync(e => e.Id == enrollmentId);

        if (enrollment == null) return NotFound();
        if (!isSuperAdmin && enrollment.User?.CompanyId != userCompanyId) return NotFound();

        // Đảm bảo quiz thuộc đúng khóa học của enrollment
        var quiz = await _context.Quizzes.AsNoTracking().FirstOrDefaultAsync(q => q.Id == quizId);
        if (quiz == null || quiz.CourseId != enrollment.CourseId) return NotFound();

        var attempts = await _context.QuizAttempts
            .AsNoTracking()
            .Include(a => a.Quiz)
            .Where(a => a.UserId == enrollment.UserId && a.QuizId == quizId)
            .OrderByDescending(a => a.CompletedAt)
            .Select(a => new LearnerQuizAttemptDto(
                a.Id,
                a.QuizId,
                a.Quiz!.Title ?? "",
                a.Score,
                a.CorrectAnswers,
                a.TotalQuestions,
                a.IsPassed,
                a.CompletedAt
            ))
            .ToListAsync();

        return Ok(attempts);
    }
}
