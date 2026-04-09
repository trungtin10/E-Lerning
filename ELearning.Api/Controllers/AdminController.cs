using ELearning.Api.Data;
using ELearning.Api.DTOs;
using ELearning.Api.Models;
using ELearning.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

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

    public AdminController(ApplicationDbContext context, UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, IAuditService audit)
    {
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
        _audit = audit;
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
            Email = dto.Email, // SỬA: Dùng email khách nhập
            FullName = dto.FullName,
            CompanyId = companyId, // Tự động gán vào công ty của Admin
            IsActive = true,
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded) return BadRequest(result.Errors.First().Description);

        // Gán Role (Student hoặc Instructor)
        await _userManager.AddToRoleAsync(user, dto.Role);

        await _audit.LogAsync("Create", "User", user.Id, null, $"{user.FullName} ({user.UserName})", $"Tạo nhân viên {dto.Role}");
        return Ok(new { Message = "Tạo nhân viên thành công!" });
    }

    [HttpPut("users/{id}")]
    public async Task<IActionResult> UpdateUser(string id, [FromBody] AdminUpdateUserDto dto)
    {
        int companyId = GetAdminCompanyId();
        var user = await _userManager.FindByIdAsync(id);
        if (user == null || user.CompanyId != companyId) return NotFound();

        user.FullName = dto.FullName;
        var email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim();
        user.Email = email;
        user.NormalizedEmail = _userManager.NormalizeEmail(email);
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(result.Errors.FirstOrDefault()?.Description);

        var currentRoles = await _userManager.GetRolesAsync(user);
        if (!currentRoles.Contains(dto.Role))
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
        var company = await _context.Companies.Include(c => c.Plan).FirstOrDefaultAsync(c => c.Id == companyId);
        if (company == null) return NotFound();

        var userCount = await _context.Users.CountAsync(u => u.CompanyId == companyId);

        var transactions = await _context.Transactions
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

        return Ok(new CompanySubscriptionInfoDto
        {
            CurrentPlan = company.Plan?.Name ?? company.ServicePlan,
            PlanExpiryDate = company.PlanExpiresAt,
            UserCount = userCount,
            MaxUsers = company.Plan?.MaxUsers ?? company.MaxUsers ?? 0,
            Transactions = transactions
        });
    }
}
