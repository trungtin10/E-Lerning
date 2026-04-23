using ELearning.Api.Data;
using ELearning.Api.Models;
using ELearning.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ELearning.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CertificateController : BaseApiController
    {
        private readonly ICertificateService _certService;

        public CertificateController(ApplicationDbContext context, IConfiguration config, ICertificateService certService)
            : base(context, config)
        {
            _certService = certService;
        }

        [HttpGet("templates")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<ActionResult<IEnumerable<CertificateTemplate>>> GetTemplates()
        {
            var companyId = await GetUserCompanyIdAsync();
            var query = _context.CertificateTemplates.AsQueryable();
            if (companyId.HasValue) query = query.Where(t => t.CompanyId == companyId);
            return await query.ToListAsync();
        }

        [HttpPost("templates")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<ActionResult<CertificateTemplate>> CreateTemplate([FromBody] CertificateTemplate template)
        {
            var companyId = await GetUserCompanyIdAsync();
            template.CompanyId = companyId;
            template.CreatedAt = DateTime.UtcNow;
            _context.CertificateTemplates.Add(template);
            await _context.SaveChangesAsync();
            return Ok(template);
        }

        [HttpPost("generate/{courseId}")]
        public async Task<IActionResult> GenerateCertificate(int courseId)
        {
            var userId = CurrentUserId;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var result = await _certService.CheckAndIssueCertificateAsync(userId, courseId);
            if (result.Success) return Ok(new { Message = result.Message, Url = result.Url, Code = result.Code });
            return BadRequest(result.Message);
        }

        // CẤP CHỨNG CHỈ THỦ CÔNG (ADMIN)
        [HttpPost("issue-manual")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> IssueManual([FromBody] IssueManualRequest request)
        {
            var result = await _certService.IssueCertificateManualAsync(request.UserId, request.CourseId);
            if (result.Success) return Ok(new { Message = result.Message, Url = result.Url, Code = result.Code });
            return BadRequest(result.Message);
        }

        // CẤP CHỨNG CHỈ HÀNG LOẠT (ADMIN)
        [HttpPost("batch-issue")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public async Task<IActionResult> BatchIssue([FromBody] List<IssueManualRequest> requests)
        {
            int successCount = 0;
            foreach (var req in requests)
            {
                var result = await _certService.IssueCertificateManualAsync(req.UserId, req.CourseId);
                if (result.Success) successCount++;
            }
            return Ok(new { Message = $"Đã cấp thành công {successCount}/{requests.Count} chứng chỉ." });
        }

        [HttpGet("download/{id}")]
        public async Task<IActionResult> DownloadCertificate(int id)
        {
            try
            {
                var pdfBytes = await _certService.GenerateCertificatePdfAsync(id);
                return File(pdfBytes, "application/pdf", $"Certificate_{id}.pdf");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("my-certificates")]
        public async Task<ActionResult> GetMyCertificates()
        {
            var userId = CurrentUserId;
            var certs = await _context.Certificates
                .Include(c => c.Course)
                .Where(c => c.UserId == userId)
                .OrderByDescending(c => c.IssuedAt)
                .Select(c => new {
                    c.Id,
                    CourseTitle = c.Course.Title,
                    c.IssuedAt,
                    c.CertificateUrl,
                    c.CertificateCode
                })
                .ToListAsync();
            return Ok(certs);
        }
    }

    public class IssueManualRequest
    {
        public string UserId { get; set; } = string.Empty;
        public int CourseId { get; set; }
    }
}
