using ELearning.Api.Data;
using ELearning.Api.DTOs;
using ELearning.Api.Models;
using ELearning.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Web;

namespace ELearning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin")]
public class SuperAdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IWebHostEnvironment _env;
    private readonly IEmailService _emailService;

    private readonly IConfiguration _config;

    public SuperAdminController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IWebHostEnvironment env,
        IEmailService emailService,
        IConfiguration config)
    {
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
        _env = env;
        _emailService = emailService;
        _config = config;
    }

    // Lấy domain động, ưu tiên AppDomain trong config để hỗ trợ ngrok ổn định
    private string GetBaseUrl()
    {
        var configuredDomain = _config["AppSettings:AppDomain"];
        if (!string.IsNullOrEmpty(configuredDomain))
        {
            return configuredDomain.TrimEnd('/');
        }

        // Fallback sang tự động nhận diện nếu không có config
        if (Request.Headers.TryGetValue("X-Forwarded-Host", out var forwardedHost))
        {
            var proto = Request.Headers["X-Forwarded-Proto"].FirstOrDefault() ?? "https";
            return $"{proto}://{forwardedHost}";
        }

        var host = Request.Host.Value;
        if (host.Contains("localhost:5211"))
        {
            return $"{Request.Scheme}://{host.Replace("5211", "5173")}";
        }

        return $"{Request.Scheme}://{host}";
    }

    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<UserSummaryDto>>> GetAllUsers([FromQuery] string? subDomain = null)
    {
        var query = _userManager.Users.Include(u => u.Company).AsQueryable();

        if (subDomain == "system")
        {
            query = query.Where(u => u.CompanyId == null);
        }
        else if (!string.IsNullOrEmpty(subDomain))
        {
            query = query.Where(u => u.Company != null && u.Company.SubDomain == subDomain);
        }
        else
        {
            var adminRoles = new[] { "Admin", "SuperAdmin" };
            var adminRoleIds = await _roleManager.Roles
                .Where(r => adminRoles.Contains(r.Name))
                .Select(r => r.Id)
                .ToListAsync();

            var adminUserIds = await _context.UserRoles
                .Where(ur => adminRoleIds.Contains(ur.RoleId))
                .Select(ur => ur.UserId)
                .ToListAsync();

            query = query.Where(u => adminUserIds.Contains(u.Id));
        }

        var users = await query.OrderByDescending(u => u.CreatedAt).ToListAsync();
        var userSummaries = new List<UserSummaryDto>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            bool isExpired = !user.EmailConfirmed && (DateTime.UtcNow - user.CreatedAt).TotalHours > 24;

            userSummaries.Add(new UserSummaryDto(
                user.Id,
                user.FullName,
                user.UserName!,
                roles.FirstOrDefault(),
                user.Company?.CompanyName,
                user.Company?.SubDomain,
                user.IsActive,
                user.EmailConfirmed,
                isExpired
            ));
        }
        return Ok(userSummaries);
    }

    [HttpPost("users/{userId}/resend-activation")]
    public async Task<IActionResult> ResendActivation(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();
        if (user.EmailConfirmed) return BadRequest("Tài khoản này đã được kích hoạt.");

        user.CreatedAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var encodedToken = HttpUtility.UrlEncode(token);
        var activationLink = $"{GetBaseUrl()}/confirm-email?userId={user.Id}&token={encodedToken}";

        try
        {
            await _emailService.SendActivationEmailAsync(user.Email!, user.FullName, user.UserName!, "********", activationLink);
            return Ok(new { Message = "Đã gửi lại email kích hoạt thành công!" });
        }
        catch (Exception ex) 
        { 
            return BadRequest("Không thể gửi email kích hoạt. Vui lòng kiểm tra lại địa chỉ email hoặc thử lại sau. Chi tiết: " + ex.Message); 
        }
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserBySuperAdminDto dto)
    {
        try
        {
            if (await _userManager.FindByNameAsync(dto.Account) != null) return BadRequest("Tên tài khoản này đã tồn tại.");

            var user = new ApplicationUser
            { 
                UserName = dto.Account, 
                Email = dto.Email,
                FullName = dto.FullName, 
                CompanyId = dto.CompanyId, 
                IsActive = true, 
                EmailConfirmed = false, 
                CreatedAt = DateTime.UtcNow 
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded) return BadRequest(result.Errors.First().Description);

            if (!await _roleManager.RoleExistsAsync(dto.Role)) await _roleManager.CreateAsync(new IdentityRole(dto.Role));
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
                // Rollback user nếu gửi mail lỗi
                await _userManager.DeleteAsync(user);
                return BadRequest("Email không tồn tại hoặc không thể gửi thư. Vui lòng kiểm tra lại. Lỗi: " + ex.Message);
            }

            return Ok(new { Message = "Thành công!" });
        }
        catch (Exception ex) { return StatusCode(500, ex.Message); }
    }

    [HttpGet("dashboard-stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetDashboardStats()
    {
        var totalCompanies = await _context.Companies.Where(c => c.SubDomain != "admin").CountAsync();
        var activeCompanies = await _context.Companies.Where(c => c.SubDomain != "admin" && c.IsActive).CountAsync();
        var totalUsers = await _userManager.Users.CountAsync();
        var totalCourses = await _context.Courses.CountAsync();
        var pendingActivations = await _userManager.Users.Where(u => !u.EmailConfirmed).CountAsync();
        var recentCompanies = await _context.Companies.Where(c => c.SubDomain != "admin").OrderByDescending(c => c.CreatedAt).Take(5).Select(c => new RecentActivityDto(c.CompanyName, $"Đã đăng ký gói {c.ServicePlan}", c.CreatedAt, "Company")).ToListAsync();
        return Ok(new DashboardStatsDto(totalCompanies, activeCompanies, totalUsers, totalCourses, pendingActivations, recentCompanies));
    }

    [HttpPost("register-tenant")]
    public async Task<IActionResult> RegisterTenant([FromForm] RegisterTenantFormDto form)
    {
        try
        {
            if (await _context.Companies.AnyAsync(c => c.SubDomain == form.SubDomain)) return BadRequest("Tên miền này đã tồn tại.");
            if (await _userManager.FindByNameAsync(form.Account) != null) return BadRequest("Tên tài khoản này đã tồn tại.");

            string? logoUrl = null;
            if (form.LogoFile != null && form.LogoFile.Length > 0)
            {
                var uploadDir = Path.Combine(_env.ContentRootPath, "uploads");
                if (!Directory.Exists(uploadDir)) Directory.CreateDirectory(uploadDir);
                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(form.LogoFile.FileName);
                var filePath = Path.Combine(uploadDir, fileName);
                using (var stream = new FileStream(filePath, FileMode.Create)) { await form.LogoFile.CopyToAsync(stream); }
                logoUrl = $"/uploads/{fileName}";
            }

            var company = new Company { CompanyName = form.CompanyName, SubDomain = form.SubDomain, ContactEmail = form.ContactEmail, LogoUrl = logoUrl, ServicePlan = form.ServicePlan ?? "Basic", IsActive = false, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            _context.Companies.Add(company);
            await _context.SaveChangesAsync();

            var user = new ApplicationUser { UserName = form.Account, Email = form.ContactEmail, FullName = "Admin " + form.CompanyName, CompanyId = company.Id, IsActive = true, EmailConfirmed = false, CreatedAt = DateTime.UtcNow };
            var result = await _userManager.CreateAsync(user, form.Password);
            if (!result.Succeeded) { _context.Companies.Remove(company); await _context.SaveChangesAsync(); return BadRequest(result.Errors.First().Description); }

            await _roleManager.CreateAsync(new IdentityRole("Admin"));
            await _userManager.AddToRoleAsync(user, "Admin");

            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var encodedToken = HttpUtility.UrlEncode(token);
            var activationLink = $"{GetBaseUrl()}/confirm-email?userId={user.Id}&token={encodedToken}";
            try 
            { 
                await _emailService.SendActivationEmailAsync(user.Email!, user.FullName, user.UserName!, form.Password, activationLink); 
            } 
            catch (Exception ex) 
            { 
                // Rollback: Xóa user và company vừa tạo nếu gửi mail lỗi
                await _userManager.DeleteAsync(user);
                _context.Companies.Remove(company);
                await _context.SaveChangesAsync();
                return BadRequest("Email không tồn tại hoặc không gửi được thư kích hoạt. Vui lòng kiểm tra lại. Lỗi: " + ex.Message);
            }

            return Ok(new { Message = "Thành công!" });
        }
        catch (Exception ex) { return StatusCode(500, $"Lỗi hệ thống: {ex.Message}"); }
    }

    [HttpPost("assign-admin")]
    public async Task<IActionResult> AssignAdmin([FromBody] CreateCompanyAdminDto dto)
    {
        try
        {
            var company = await _context.Companies.FindAsync(dto.CompanyId);
            if (company == null) return NotFound("Không tìm thấy công ty.");
            if (await _userManager.FindByNameAsync(dto.Account) != null) return BadRequest("Tên tài khoản này đã tồn tại.");

            var user = new ApplicationUser { UserName = dto.Account, Email = dto.Email, FullName = dto.FullName, CompanyId = company.Id, IsActive = true, EmailConfirmed = false, CreatedAt = DateTime.UtcNow };
            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded) return BadRequest(result.Errors.First().Description);

            await _roleManager.CreateAsync(new IdentityRole("Admin"));
            await _userManager.AddToRoleAsync(user, "Admin");

            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var encodedToken = HttpUtility.UrlEncode(token);
            var activationLink = $"{GetBaseUrl()}/confirm-email?userId={user.Id}&token={encodedToken}";
            try 
            { 
                await _emailService.SendActivationEmailAsync(user.Email!, user.FullName, user.UserName!, dto.Password, activationLink); 
            } 
            catch (Exception ex) 
            { 
                // Rollback: Xóa user vừa tạo nếu gửi mail lỗi
                await _userManager.DeleteAsync(user);
                return BadRequest("Email không tồn tại hoặc không gửi được thư kích hoạt. Vui lòng kiểm tra lại. Lỗi: " + ex.Message);
            }

            return Ok(new { Message = "Đã gửi email kích hoạt!" });
        }
        catch (Exception ex) { return StatusCode(500, $"Lỗi hệ thống: {ex.Message}"); }
    }

    [HttpGet("confirm-activation")]
    [AllowAnonymous]
    public async Task<IActionResult> ConfirmActivation(string userId, string token)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();
        var result = await _userManager.ConfirmEmailAsync(user, token);
        if (result.Succeeded)
        {
            if (user.CompanyId.HasValue)
            {
                var company = await _context.Companies.FindAsync(user.CompanyId.Value);
                if (company != null) { company.IsActive = true; await _context.SaveChangesAsync(); }
            }
            return Ok("Kích hoạt thành công!");
        }
        return BadRequest("Lỗi kích hoạt.");
    }

    [HttpGet("companies")]
    public async Task<ActionResult<IEnumerable<CompanyDto>>> GetCompanies()
    {
        var baseUrl = GetBaseUrl();
        return await _context.Companies
            .Where(c => c.SubDomain != "admin" && !c.CompanyName.Contains("Hệ Thống"))
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new CompanyDto(c.Id, c.CompanyName, c.SubDomain, c.LogoUrl != null ? baseUrl + c.LogoUrl : null, c.CustomDomain, c.ServicePlan, c.ContactEmail, c.IsActive, c.Users.Count, c.CreatedAt, c.UpdatedAt))
            .ToListAsync();
    }

    [HttpPut("companies/{id}")]
    public async Task<IActionResult> UpdateCompany(int id, [FromForm] UpdateCompanyFormDto form)
    {
        try
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null) return NotFound();
            if (company.SubDomain != form.SubDomain && await _context.Companies.AnyAsync(c => c.SubDomain == form.SubDomain)) return BadRequest("Tên miền này đã tồn tại.");
            company.CompanyName = form.CompanyName;
            company.SubDomain = form.SubDomain;
            company.ContactEmail = form.ContactEmail;
            company.ServicePlan = form.ServicePlan;
            company.UpdatedAt = DateTime.UtcNow;
            if (form.LogoFile != null && form.LogoFile.Length > 0)
            {
                var uploadDir = Path.Combine(_env.ContentRootPath, "uploads");
                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(form.LogoFile.FileName);
                var filePath = Path.Combine(uploadDir, fileName);
                using (var stream = new FileStream(filePath, FileMode.Create)) { await form.LogoFile.CopyToAsync(stream); }
                company.LogoUrl = $"/uploads/{fileName}";
            }
            await _context.SaveChangesAsync();
            return Ok();
        }
        catch (Exception ex) { return StatusCode(500, ex.Message); }
    }

    [HttpDelete("users/{userId}")]
    public async Task<IActionResult> DeleteUser(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();
        if (user.UserName == "superadmin") return BadRequest("Không thể xóa SuperAdmin.");
        
        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors.FirstOrDefault()?.Description ?? "Lỗi khi xóa người dùng.");
        }
        
        return Ok();
    }

    [HttpDelete("companies/{id}")]
    public async Task<IActionResult> DeleteCompany(int id)
    {
        try
        {
            var company = await _context.Companies.Include(c => c.Users).Include(c => c.Courses).ThenInclude(crs => crs.Lessons).Include(c => c.Categories).Include(c => c.Departments).FirstOrDefaultAsync(c => c.Id == id);
            if (company == null) return NotFound();
            foreach (var course in company.Courses) { _context.Lessons.RemoveRange(course.Lessons); }
            _context.Courses.RemoveRange(company.Courses);
            foreach (var user in company.Users.ToList()) { await _userManager.DeleteAsync(user); }
            _context.Categories.RemoveRange(company.Categories);
            _context.Departments.RemoveRange(company.Departments);
            _context.Companies.Remove(company);
            await _context.SaveChangesAsync();
            return Ok();
        }
        catch (Exception ex) { return StatusCode(500, ex.Message); }
    }
}
