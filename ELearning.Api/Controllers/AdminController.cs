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
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public AdminController(ApplicationDbContext context, UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
    {
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
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
            userSummaries.Add(new UserSummaryDto(user.Id, user.FullName, user.UserName!, roles.FirstOrDefault(), user.Company?.CompanyName, user.Company?.SubDomain, user.IsActive, user.EmailConfirmed));
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

        return Ok(new { Message = "Tạo nhân viên thành công!" });
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        int companyId = GetAdminCompanyId();
        var user = await _userManager.FindByIdAsync(id);
        if (user == null || user.CompanyId != companyId) return NotFound();
        await _userManager.DeleteAsync(user);
        return Ok();
    }
}
