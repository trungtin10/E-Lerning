using ELearning.Api.Data;
using ELearning.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ELearning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AnalyticsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AnalyticsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // BÁO CÁO CHO ADMIN CÔNG TY
    [HttpGet("company-report")]
    public async Task<IActionResult> GetCompanyReport()
    {
        var companyIdClaim = User.FindFirst("CompanyId")?.Value;
        if (!int.TryParse(companyIdClaim, out int companyId)) return BadRequest();

        // 1. Tỷ lệ hoàn thành trung bình
        var avgProgress = await _context.CourseEnrollments
            .Where(e => e.User.CompanyId == companyId)
            .AverageAsync(e => (double?)e.ProgressPercentage) ?? 0;

        // 2. Thống kê theo phòng ban
        var departmentStats = await _context.Departments
            .Where(d => d.CompanyId == companyId)
            .Select(d => new {
                DepartmentName = d.Name,
                UserCount = d.Users.Count,
                AvgProgress = d.Users.SelectMany(u => u.Enrollments).Average(e => (double?)e.ProgressPercentage) ?? 0
            })
            .ToListAsync();

        // 3. Khóa học phổ biến nhất
        var topCourses = await _context.Courses
            .Where(c => c.CompanyId == companyId)
            .OrderByDescending(c => c.Enrollments.Count)
            .Take(5)
            .Select(c => new { c.Title, EnrolledCount = c.Enrollments.Count })
            .ToListAsync();

        return Ok(new {
            AverageProgress = Math.Round(avgProgress, 2),
            DepartmentStats = departmentStats,
            TopCourses = topCourses
        });
    }
}
