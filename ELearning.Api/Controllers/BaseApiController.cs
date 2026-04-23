using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ELearning.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace ELearning.Api.Controllers
{
    public class BaseApiController : ControllerBase
    {
        protected readonly ApplicationDbContext _context;
        protected readonly IConfiguration _config;

        public BaseApiController(ApplicationDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        protected string GetBaseUrl()
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

        protected async Task<int?> GetUserCompanyIdAsync()
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

        protected string? CurrentUserId => User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        protected string GenerateCleanUserId(string account)
        {
            // Tạo ID ngắn gọn: lấy tên tài khoản (bỏ phần email nếu có) + 4 ký tự ngẫu nhiên.
            // Ví dụ: admin-a1b2, hocvien-4f2d
            var baseId = account.Split('@')[0].ToLower().Trim().Replace(" ", "-");
            var suffix = Guid.NewGuid().ToString("N").Substring(0, 4);
            return $"{baseId}-{suffix}";
        }
    }
}
