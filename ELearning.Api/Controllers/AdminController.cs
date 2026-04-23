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
public class AdminController : BaseApiController
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IAuditService _audit;
    private readonly IEmailService _emailService;
    private readonly IWebHostEnvironment _env;
    private readonly IFileUploadService _fileUpload;

    public AdminController(ApplicationDbContext context, UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, IAuditService audit, IEmailService emailService, IConfiguration config, IWebHostEnvironment env, IFileUploadService fileUpload)
        : base(context, config)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _audit = audit;
        _emailService = emailService;
        _env = env;
        _fileUpload = fileUpload;
    }

    private async Task<int> GetAdminCompanyId()
    {
        return await GetUserCompanyIdAsync() ?? 0;
    }

    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<UserSummaryDto>>> GetCompanyUsers()
    {
        int companyId = await GetAdminCompanyId();
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
                IsExpired = !user.EmailConfirmed && (DateTime.UtcNow - user.CreatedAt).TotalHours > 24,
                Status = !user.IsActive ? "Đã khóa" : (!user.EmailConfirmed ? "Chưa kích hoạt" : "Hoạt động")
            });
        }
        return Ok(userSummaries);
    }

    // API: Admin công ty tạo nhân viên
    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserByAdminDto dto)
    {
        int companyId = await GetAdminCompanyId();

        if (await _userManager.FindByNameAsync(dto.Account) != null)
            return BadRequest("Tên tài khoản này đã tồn tại.");

        var user = new ApplicationUser
        {
            Id = GenerateCleanUserId(dto.Account), // Tạo ID ngắn gọn, không dùng GUID
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

        // ÉP BUỘC DaXacThucEmail = 0 (Chờ kích hoạt)
        await _context.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE NguoiDung SET DaXacThucEmail = 0 WHERE Id = {user.Id}");

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
        catch (Exception) 
        {
            await _userManager.DeleteAsync(user);
            return BadRequest("Địa chỉ Email không chính xác hoặc không tồn tại. Vui lòng kiểm tra lại.");
        }

        await _audit.LogAsync("Create", "User", user.Id, null, $"{user.FullName} ({user.UserName})", $"Tạo nhân viên {dto.Role}");
        return Ok(new { Message = "Đã gửi yêu cầu xác nhận kích hoạt tài khoản!" });
    }

    [HttpPut("users/{id}")]
    public async Task<IActionResult> UpdateUser(string id, [FromBody] AdminUpdateUserDto dto)
    {
        int companyId = await GetAdminCompanyId();
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
        int companyId = await GetAdminCompanyId();
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
        int companyId = await GetAdminCompanyId();
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
        int companyId = await GetAdminCompanyId();
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
        // Determine current plan: prefer descriptive string field first (since it may contain trial info), then Plan object name, then "Free"
        string currentPlanName = company.ServicePlan ?? company.Plan?.Name ?? "Free";

        var breakdown = await _fileUpload.GetCompanyStorageBreakdownAsync(companyId);

        return Ok(new CompanySubscriptionInfoDto
        {
            CurrentPlan = currentPlanName,
            PlanExpiryDate = company.PlanExpiresAt,
            UserCount = userCount,
            MaxUsers = company.Plan?.MaxUsers ?? company.MaxUsers ?? 0,
            StorageUsedBytes = breakdown.TotalBytes,
            VideoStorageBytes = breakdown.VideoBytes,
            ImageStorageBytes = breakdown.ImageBytes,
            DocumentStorageBytes = breakdown.DocumentBytes,
            StorageLimitGB = company.Plan?.StorageLimitGB ?? 0,
            Transactions = transactions
        });
    }

    /// <summary>Admin công ty cập nhật logo (chỉ role Admin).</summary>
    [HttpPost("company-logo")]
    public async Task<IActionResult> UploadCompanyLogo(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("Không có file nào được chọn.");

        int companyId = await GetAdminCompanyId();
        if (companyId <= 0)
            return BadRequest("Không xác định được công ty.");

        var company = await _context.Companies.FindAsync(companyId);
        if (company == null)
            return NotFound();

        var companyFolder = $"company_{companyId}";
        company.LogoUrl = await _fileUpload.SaveFileAsync(file, companyId, "branding", $"company_logo_{companyId}");
        company.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _audit.LogAsync("Update", "Company", companyId.ToString(), null, $"{company.CompanyName} ({company.SubDomain})", "Cập nhật logo công ty");
        return Ok(new { url = company.LogoUrl });
    }
    [HttpGet("dashboard-stats")]
    public async Task<ActionResult> GetDashboardStats()
    {
        int companyId = await GetAdminCompanyId();
        if (companyId <= 0) return BadRequest("Không xác định được công ty.");

        var totalUsers = await _userManager.Users.CountAsync(u => u.CompanyId == companyId);
        var activeUsers = await _userManager.Users.CountAsync(u => u.CompanyId == companyId && u.IsActive);
        var totalCourses = await _context.Courses.CountAsync(c => c.CompanyId == companyId);
        var pendingTickets = await _context.SupportTickets.CountAsync(t => t.CompanyId == companyId && t.Status == "Open");
        
        var recentActivities = await _context.AuditLogs
            .Where(a => a.UserId != null)
            .Join(_context.Users.Where(u => u.CompanyId == companyId), a => a.UserId, u => u.Id, (a, u) => a)
            .OrderByDescending(a => a.CreatedAt)
            .Take(5)
            .Select(a => new { Title = a.Action, Description = a.Details, a.CreatedAt, EntityType = a.EntityType })
            .ToListAsync();

        var company = await _context.Companies.Include(c => c.Plan).FirstOrDefaultAsync(c => c.Id == companyId);
        
        return Ok(new {
            totalUsers,
            activeUsers,
            totalCourses,
            pendingTickets,
            storageUsedBytes = company?.StorageUsedBytes ?? 0,
            storageLimitGB = company?.Plan?.StorageLimitGB ?? 0,
            recentActivities
        });
    }
}
