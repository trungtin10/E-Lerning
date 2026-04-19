using ELearning.Api.Data;
using ELearning.Api.DTOs;
using ELearning.Api.Models;
using ELearning.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Hosting;
using System.Security.Claims;
using System.Web;

namespace ELearning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IAuditService _audit;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _config;
    private readonly IWebHostEnvironment _env;

    public AdminController(ApplicationDbContext context, UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, IAuditService audit, IEmailService emailService, IConfiguration config, IWebHostEnvironment env)
    {
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
        _audit = audit;
        _emailService = emailService;
        _config = config;
        _env = env;
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

    private int GetAdminCompanyId()
    {
        var companyIdClaim = User.FindFirst("CompanyId")?.Value;
        return int.TryParse(companyIdClaim, out int id) ? id : 0;
    }

    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<UserSummaryDto>>> GetCompanyUsers()
    {
        int companyId = GetAdminCompanyId();
        var users = await _userManager.Users.Include(u => u.Company).Where(u => u.CompanyId == companyId).ToListAsync();
        var userSummaries = new List<UserSummaryDto>();
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault();
            var displayEmail = user.GetDisplayEmail()
                ?? (role == "Admin" ? user.Company?.ContactEmail : null);
            userSummaries.Add(new UserSummaryDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Account = user.UserName!,
                Email = displayEmail,
                Role = role,
                CompanyName = user.Company?.CompanyName,
                SubDomain = user.Company?.SubDomain,
                IsActive = user.IsActive,
                EmailConfirmed = user.EmailConfirmed,
                IsExpired = false
            });
        }
        return Ok(userSummaries);
    }

    // API: Admin công ty tạo nhân viên
    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserByAdminDto dto)
    {
        int companyId = GetAdminCompanyId();

        if (await _userManager.FindByNameAsync(dto.Account) != null)
            return BadRequest("Tên tài khoản này đã tồn tại.");

        var user = new ApplicationUser
        {
            UserName = dto.Account,
            Email = dto.Email,
            FullName = dto.FullName,
            CompanyId = companyId,
            IsActive = true,
            EmailConfirmed = false,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded) return BadRequest(result.Errors.First().Description);

        if (!await _roleManager.RoleExistsAsync(dto.Role)) 
            await _roleManager.CreateAsync(new IdentityRole(dto.Role));
        await _userManager.AddToRoleAsync(user, dto.Role);

        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var encodedToken = HttpUtility.UrlEncode(token);
        var activationLink = $"{GetBaseUrl()}/confirm-email?userId={user.Id}&token={encodedToken}";

        try 
        {
            await _emailService.SendActivationEmailAsync(user.Email!, user.FullName, user.UserName!, dto.Password, activationLink);
        } 
        catch (Exception ex) 
        {
            await _userManager.DeleteAsync(user);
            return BadRequest("Email không hợp lệ hoặc lỗi gửi thư. Vui lòng kiểm tra lại. Lỗi: " + ex.Message);
        }

        await _audit.LogAsync("Create", "User", user.Id, null, $"{user.FullName} ({user.UserName})", $"Tạo nhân viên {dto.Role}");
        return Ok(new { Message = "Đã gửi yêu cầu xác nhận kích hoạt tài khoản!" });
    }

    [HttpPut("users/{id}")]
    public async Task<IActionResult> UpdateUser(string id, [FromBody] AdminUpdateUserDto dto)
    {
        int companyId = GetAdminCompanyId();
        var user = await _userManager.FindByIdAsync(id);
        if (user == null || user.CompanyId != companyId) return NotFound();

        user.FullName = dto.FullName ?? user.FullName;
        var email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim();
        user.Email = email;
        user.NormalizedEmail = _userManager.NormalizeEmail(email);
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(result.Errors.FirstOrDefault()?.Description);

        var currentRoles = await _userManager.GetRolesAsync(user);
        if (dto.Role != null && !currentRoles.Contains(dto.Role))
        {
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            if (!await _roleManager.RoleExistsAsync(dto.Role)) await _roleManager.CreateAsync(new IdentityRole(dto.Role));
            await _userManager.AddToRoleAsync(user, dto.Role);
        }

        await _audit.LogAsync("Update", "User", id, user.UserName, null, $"Cập nhật nhân viên {user.FullName} ({user.UserName})");
        return Ok();
    }

    [HttpPatch("users/{id}/active")]
    public async Task<IActionResult> SetUserActive(string id, [FromBody] SetUserActiveDto dto)
    {
        int companyId = GetAdminCompanyId();
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.Equals(id, currentUserId, StringComparison.Ordinal) && !dto.IsActive)
            return BadRequest("Không thể tự khóa tài khoản của chính bạn.");

        var user = await _userManager.FindByIdAsync(id);
        if (user == null || user.CompanyId != companyId) return NotFound();
        if (string.Equals(user.UserName, "superadmin", StringComparison.OrdinalIgnoreCase) && !dto.IsActive)
            return BadRequest("Không thể khóa tài khoản này.");

        user.IsActive = dto.IsActive;
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequest(result.Errors.FirstOrDefault()?.Description ?? "Không thể cập nhật trạng thái.");

        var detail = dto.IsActive ? "Mở khóa" : "Tạm khóa";
        await _audit.LogAsync("Update", "User", id, user.UserName, null, $"{detail} nhân viên {user.FullName} ({user.UserName})");
        return Ok(new { isActive = user.IsActive });
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        int companyId = GetAdminCompanyId();
        var user = await _userManager.FindByIdAsync(id);
        if (user == null || user.CompanyId != companyId) return NotFound();
        var userName = user.UserName;
        var fullName = user.FullName;
        await _userManager.DeleteAsync(user);
        await _audit.LogAsync("Delete", "User", id, userName, null, $"Xóa nhân viên {fullName}");
        return Ok();
    }

    [HttpGet("subscription-info")]
    public async Task<ActionResult<CompanySubscriptionInfoDto>> GetSubscriptionInfo()
    {
        int companyId = GetAdminCompanyId();
        // Use AsNoTracking to get fresh data from database (bypass EF cache)
        var company = await _context.Companies
            .AsNoTracking()
            .Include(c => c.Plan)
            .FirstOrDefaultAsync(c => c.Id == companyId);
        if (company == null) return NotFound();

        // If Plan navigation property is not loaded, try to load it explicitly
        if (company.Plan == null && company.ServicePlanId.HasValue)
        {
            company.Plan = await _context.ServicePlans.AsNoTracking().FirstOrDefaultAsync(p => p.Id == company.ServicePlanId.Value);
        }

        var userCount = await _context.Users.CountAsync(u => u.CompanyId == companyId);

        var transactions = await _context.Transactions
            .AsNoTracking()
            .Include(t => t.ServicePlan)
            .Where(t => t.CompanyId == companyId)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new CompanyTransactionDto
            {
                Id = t.Id,
                PlanName = t.ServicePlan.Name,
                Amount = t.Amount,
                Status = t.Status,
                CreatedAt = t.CreatedAt,
                PaymentGateway = t.PaymentGateway
            })
            .ToListAsync();

        // Determine current plan: prefer descriptive string field first (since it may contain trial info), then Plan object name, then "Free"
        string currentPlanName = company.ServicePlan ?? company.Plan?.Name ?? "Free";

        return Ok(new CompanySubscriptionInfoDto
        {
            CurrentPlan = currentPlanName,
            PlanExpiryDate = company.PlanExpiresAt,
            UserCount = userCount,
            MaxUsers = company.Plan?.MaxUsers ?? company.MaxUsers ?? 0,
            Transactions = transactions
        });
    }

    /// <summary>Admin công ty cập nhật logo (chỉ role Admin).</summary>
    [HttpPost("company-logo")]
    public async Task<IActionResult> UploadCompanyLogo(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("Không có file nào được chọn.");

        int companyId = GetAdminCompanyId();
        if (companyId <= 0)
            return BadRequest("Không xác định được công ty.");

        var company = await _context.Companies.FindAsync(companyId);
        if (company == null)
            return NotFound();

        var uploadDir = Path.Combine(_env.ContentRootPath, "uploads");
        if (!Directory.Exists(uploadDir))
            Directory.CreateDirectory(uploadDir);

        var fileName = "company_logo_" + companyId + "_" + Guid.NewGuid().ToString("N") + Path.GetExtension(file.FileName);
        var filePath = Path.Combine(uploadDir, fileName);
        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        company.LogoUrl = $"/uploads/{fileName}";
        company.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _audit.LogAsync("Update", "Company", companyId.ToString(), null, $"{company.CompanyName} ({company.SubDomain})", "Cập nhật logo công ty");
        return Ok(new { url = company.LogoUrl });
    }
}
