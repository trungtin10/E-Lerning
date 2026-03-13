using ELearning.Api.Data;
using ELearning.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ELearning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CertificateController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _env;

    public CertificateController(ApplicationDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    // 1. CẤP CHỨNG CHỈ TỰ ĐỘNG
    [HttpPost("generate/{courseId}")]
    public async Task<IActionResult> GenerateCertificate(int courseId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        // Kiểm tra điều kiện: Hoàn thành 100% khóa học
        var enrollment = await _context.CourseEnrollments
            .Include(e => e.Course)
            .Include(e => e.User)
            .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == courseId);

        if (enrollment == null || enrollment.Status != "Completed")
            return BadRequest("Bạn chưa hoàn thành khóa học này.");

        // Kiểm tra xem đã có chứng chỉ chưa
        var existing = await _context.Certificates
            .FirstOrDefaultAsync(c => c.UserId == userId && c.CourseId == courseId);
        if (existing != null) return Ok(new { Message = "Chứng chỉ đã tồn tại.", Url = existing.CertificateUrl });

        // LOGIC TẠO FILE PDF (Giả lập lưu đường dẫn)
        // Trong thực tế sẽ dùng thư viện QuestPDF để vẽ ảnh/pdf
        string fileName = $"Cert_{userId}_{courseId}.pdf";
        string filePath = $"/uploads/certificates/{fileName}";

        var certificate = new Certificate
        {
            UserId = userId!,
            CourseId = courseId,
            IssuedAt = DateTime.UtcNow,
            CertificateUrl = filePath
        };

        _context.Certificates.Add(certificate);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Cấp chứng chỉ thành công!", Url = filePath });
    }

    // 2. LẤY DANH SÁCH CHỨNG CHỈ CỦA TÔI
    [HttpGet("my-certificates")]
    public async Task<ActionResult> GetMyCertificates()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var certs = await _context.Certificates
            .Include(c => c.Course)
            .Where(c => c.UserId == userId)
            .Select(c => new {
                c.Id,
                CourseTitle = c.Course.Title,
                c.IssuedAt,
                c.CertificateUrl
            })
            .ToListAsync();
        return Ok(certs);
    }
}
