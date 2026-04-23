using ELearning.Api.Data;
using ELearning.Api.DTOs;
using ELearning.Api.Models;
using ELearning.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using System.Security.Claims;
using System.Web;

namespace ELearning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin")]
public class SuperAdminController : BaseApiController
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IWebHostEnvironment _env;
    private readonly IEmailService _emailService;
    private readonly IAuditService _audit;
    private readonly IFileUploadService _fileUpload;

    public SuperAdminController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IWebHostEnvironment env,
        IEmailService emailService,
        IConfiguration config,
        IAuditService audit,
        IFileUploadService fileUpload)
        : base(context, config)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _env = env;
        _emailService = emailService;
        _audit = audit;
        _fileUpload = fileUpload;
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
                IsExpired = isExpired,
                Status = !user.IsActive ? "Đã khóa" : (!user.EmailConfirmed ? "Chưa kích hoạt" : "Hoạt động")
            });
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
                Id = GenerateCleanUserId(dto.Account),
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

            // ÉP BUỘC DaXacThucEmail = 0 (Chờ kích hoạt)
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE NguoiDung SET DaXacThucEmail = 0 WHERE Id = {user.Id}");

            if (!await _roleManager.RoleExistsAsync(dto.Role)) await _roleManager.CreateAsync(new IdentityRole(dto.Role));
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
                // Rollback user nếu gửi mail lỗi
                await _userManager.DeleteAsync(user);
                return BadRequest("Địa chỉ Email không chính xác hoặc không tồn tại. Vui lòng kiểm tra lại.");
            }

            return Ok(new { Message = "Thành công!" });
        }
        catch (Exception ex) 
        { 
            var detailedMsg = ex.InnerException != null ? $"{ex.Message} -> {ex.InnerException.Message}" : ex.Message;
            return StatusCode(500, detailedMsg); 
        }
    }

    [HttpGet("dashboard-stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetDashboardStats()
    {
        var totalCompanies = await _context.Companies.Where(c => c.SubDomain != "admin").CountAsync();
        var activeCompanies = await _context.Companies.Where(c => c.SubDomain != "admin" && c.IsActive).CountAsync();
        var totalUsers = await _userManager.Users.CountAsync();
        var totalCourses = await _context.Courses.CountAsync();
        var pendingActivations = await _userManager.Users.Where(u => !u.EmailConfirmed).CountAsync();
        var totalStorage = await _context.Companies.SumAsync(c => c.StorageUsedBytes);
        var recentCompanies = await _context.Companies.Where(c => c.SubDomain != "admin").OrderByDescending(c => c.CreatedAt).Take(5).Select(c => new RecentActivityDto(c.CompanyName, $"Đã đăng ký gói {c.ServicePlan ?? "Basic"}", c.CreatedAt, "Company")).ToListAsync();
        return Ok(new DashboardStatsDto(totalCompanies, activeCompanies, totalUsers, totalCourses, pendingActivations, totalStorage, recentCompanies));
    }

    [HttpGet("dashboard-analytics")]
    public async Task<ActionResult<DashboardAnalyticsDto>> GetDashboardAnalytics([FromQuery] int months = 6)
    {
        try
        {
            var startDate = DateTime.UtcNow.AddMonths(-months);
            
            // 1. Biểu đồ tăng trưởng người dùng
            var userLogs = await _context.Users
                .AsNoTracking()
                .Where(u => u.CreatedAt >= startDate)
                .Select(u => new { u.CreatedAt })
                .ToListAsync();

            var userGrowth = userLogs
                .GroupBy(u => new { u.CreatedAt.Year, u.CreatedAt.Month })
                .Select(g => new GrowthPointDto($"{g.Key.Year}-{g.Key.Month:D2}", g.Count()))
                .OrderBy(x => x.Month)
                .ToList();

            // 2. Biểu đồ tăng trưởng công ty
            var companyLogs = await _context.Companies
                .AsNoTracking()
                .Where(c => c.SubDomain != "admin" && c.CreatedAt >= startDate)
                .Select(c => new { c.CreatedAt })
                .ToListAsync();

            var companyGrowth = companyLogs
                .GroupBy(c => new { c.CreatedAt.Year, c.CreatedAt.Month })
                .Select(g => new GrowthPointDto($"{g.Key.Year}-{g.Key.Month:D2}", g.Count()))
                .OrderBy(x => x.Month)
                .ToList();

            // 3. Top công ty theo số lượng người dùng
            var topByUsers = await _context.Companies
                .AsNoTracking()
                .Where(c => c.SubDomain != "admin")
                .OrderByDescending(c => c.Users.Count)
                .Take(10)
                .Select(c => new TopCompanyDto(c.Id, c.CompanyName, c.Users.Count))
                .ToListAsync();

            // 4. Top công ty theo dung lượng lưu trữ
            var topByStorage = await _context.Companies
                .AsNoTracking()
                .Where(c => c.SubDomain != "admin")
                .OrderByDescending(c => c.StorageUsedBytes)
                .Take(10)
                .Select(c => new TopCompanyDto(c.Id, c.CompanyName, (int)(c.StorageUsedBytes / 1024 / 1024)))
                .ToListAsync();

            // 5. Danh sách dung lượng chi tiết
            var storageList = await _context.Companies
                .AsNoTracking()
                .Where(c => c.SubDomain != "admin")
                .OrderByDescending(c => c.StorageUsedBytes)
                .Take(20)
                .Select(c => new CompanyStorageDto(c.Id, c.CompanyName, c.StorageUsedBytes, c.Plan != null ? c.Plan.StorageLimitGB : 10))
                .ToListAsync();

            return Ok(new DashboardAnalyticsDto(userGrowth, companyGrowth, topByUsers, topByStorage, storageList));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Dashboard analytics failed", message = ex.Message, detail = ex.InnerException?.Message });
        }
    }

    [HttpPost("register-tenant")]
    public async Task<IActionResult> RegisterTenant([FromForm] RegisterTenantFormDto form)
    {
        // Kiểm tra định dạng Email
        if (string.IsNullOrWhiteSpace(form.ContactEmail) || !System.Text.RegularExpressions.Regex.IsMatch(form.ContactEmail, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
            return BadRequest("Địa chỉ Email không chính xác hoặc không tồn tại.");

        try
        {
            if (await _context.Companies.AnyAsync(c => c.SubDomain == form.SubDomain))
                return Conflict("Công ty/subdomain này đã kích hoạt rồi.");
            if (await _userManager.FindByNameAsync(form.Account) != null)
                return Conflict("Tài khoản admin này đã kích hoạt rồi.");
            if (!string.IsNullOrEmpty(form.ContactEmail) && await _context.Users.AnyAsync(u => u.Email == form.ContactEmail))
                return Conflict("Địa chỉ Email này đã được sử dụng bởi một tài khoản khác.");

            var company = new Company { CompanyName = form.CompanyName, SubDomain = form.SubDomain, ContactEmail = form.ContactEmail, LogoUrl = null, ServicePlan = form.ServicePlan ?? "Basic", IsActive = false, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            _context.Companies.Add(company);
            await _context.SaveChangesAsync();

            // Initialize company folder structure
            _fileUpload.EnsureCompanyFolder(company.Id);

            if (form.LogoFile != null && form.LogoFile.Length > 0)
            {
                company.LogoUrl = await _fileUpload.SaveFileAsync(form.LogoFile, company.Id, "branding");
                await _context.SaveChangesAsync();
            }

            // Dùng thử: set gói + hết hạn theo ngày (KHÔNG tạo giao dịch)
            var trialDays = form.ServicePlanDurationDays;
            if (trialDays > 0)
            {
                // Nếu không truyền ServicePlanId thì default Basic
                ServicePlan? plan = null;
                if (form.ServicePlanId.HasValue)
                    plan = await _context.ServicePlans.FindAsync(form.ServicePlanId.Value);
                if (plan == null)
                    plan = await _context.ServicePlans.FirstOrDefaultAsync(p => p.Name == "Basic");

                if (plan != null)
                {
                    var expiresAt = DateTime.UtcNow.AddDays(trialDays);
                    company.ServicePlanId = plan.Id;
                    company.ServicePlan = $"Free ({trialDays} ngày dùng thử)";
                    company.MaxUsers = plan.MaxUsers;
                    company.PlanExpiresAt = expiresAt;
                }
            }
            else if (form.ServicePlanId.HasValue)
            {
                // Trường hợp có thanh toán/chu kỳ tháng: tạo giao dịch như trước
                var plan = await _context.ServicePlans.FindAsync(form.ServicePlanId.Value);
                if (plan != null)
                {
                    var months = form.BillingCycleMonths > 0 ? form.BillingCycleMonths : 1;
                    var amount = form.AmountPaid ?? (months >= 12 ? plan.PriceYearly : plan.PriceMonthly);
                    var expiresAt = DateTime.UtcNow.AddMonths(months);

                    var tx = new Transaction
                    {
                        CompanyId = company.Id,
                        ServicePlanId = plan.Id,
                        Amount = amount,
                        Currency = "VND",
                        Status = "Completed",
                        PaymentGateway = form.PaymentMethod ?? "Direct",
                        TransactionRef = "ADMIN_CREATED",
                        PaymentDate = DateTime.UtcNow,
                        PlanExpiresAt = expiresAt,
                        BillingCycleMonths = months,
                        CreatedAt = DateTime.UtcNow,
                        Notes = $"Tạo giao dịch tự động khi đăng ký công ty {company.CompanyName}"
                    };
                    _context.Transactions.Add(tx);

                    company.ServicePlanId = plan.Id;
                    company.ServicePlan = plan.Name;
                    company.MaxUsers = plan.MaxUsers;
                    company.PlanExpiresAt = expiresAt;
                }
            }

            var user = new ApplicationUser { Id = GenerateCleanUserId(form.Account), UserName = form.Account, Email = form.ContactEmail, FullName = "Admin " + form.CompanyName, CompanyId = company.Id, IsActive = true, EmailConfirmed = false, CreatedAt = DateTime.UtcNow };
            var result = await _userManager.CreateAsync(user, form.Password);
            if (!result.Succeeded) { _context.Companies.Remove(company); await _context.SaveChangesAsync(); return BadRequest(result.Errors.First().Description); }

            // ÉP BUỘC cập nhật CongTyId vào DB (Mặc định là 0 - Chưa kích hoạt)
            // TrangThaiHoatDong = 1 (Tài khoản khả dụng), DaXacThucEmail = 0 (Chờ kích hoạt)
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE NguoiDung SET CongTyId = {company.Id}, TrangThaiHoatDong = 1, DaXacThucEmail = 0 WHERE Id = {user.Id}");

            if (!await _roleManager.RoleExistsAsync("Admin"))
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
                return BadRequest("Địa chỉ Email không chính xác hoặc không tồn tại. Vui lòng kiểm tra lại.");
            }

            await _audit.LogAsync("Create", "Company", company.Id.ToString(), null, $"{company.CompanyName} ({company.SubDomain})", "Đăng ký tenant mới");
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
            if (string.IsNullOrWhiteSpace(dto.Email) || !System.Text.RegularExpressions.Regex.IsMatch(dto.Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                return BadRequest("Địa chỉ Email không chính xác hoặc không tồn tại.");

            var user = new ApplicationUser { Id = GenerateCleanUserId(dto.Account), UserName = dto.Account, Email = dto.Email, FullName = dto.FullName, CompanyId = company.Id, IsActive = true, EmailConfirmed = false, CreatedAt = DateTime.UtcNow };
            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded) return BadRequest(result.Errors.First().Description);

            // ÉP BUỘC DaXacThucEmail = 0 (Chờ kích hoạt)
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE NguoiDung SET DaXacThucEmail = 0 WHERE Id = {user.Id}");

            await _roleManager.CreateAsync(new IdentityRole("Admin"));
            await _userManager.AddToRoleAsync(user, "Admin");

            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var encodedToken = HttpUtility.UrlEncode(token);
            var activationLink = $"{GetBaseUrl()}/confirm-email?userId={user.Id}&token={encodedToken}";
            try 
            { 
                await _emailService.SendActivationEmailAsync(user.Email!, user.FullName, user.UserName!, dto.Password, activationLink); 
            } 
            catch (Exception)
            { 
                // Rollback: Xóa user vừa tạo nếu gửi mail lỗi
                await _userManager.DeleteAsync(user);
                return BadRequest("Địa chỉ Email không chính xác hoặc không tồn tại. Vui lòng kiểm tra lại.");
            }

            if (string.IsNullOrWhiteSpace(company.ContactEmail) && !string.IsNullOrWhiteSpace(dto.Email))
            {
                company.ContactEmail = dto.Email.Trim();
                company.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            await _audit.LogAsync("Create", "User", user.Id, null, $"{user.FullName} ({user.UserName})", $"Gán Admin cho công ty {company.CompanyName}");
            return Ok(new { Message = "Đã gửi email kích hoạt!" });
        }
        catch (Exception ex) { return StatusCode(500, $"Lỗi hệ thống: {ex.Message}"); }
    }

    [HttpGet("confirm-activation")]
    [AllowAnonymous]
    public async Task<IActionResult> ConfirmActivation(string userId, string token)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound("Người dùng không tồn tại.");

        var result = await _userManager.ConfirmEmailAsync(user, token);
        if (result.Succeeded)
        {
            // 1. Kích hoạt người dùng (Dùng SQL trực tiếp cho chắc chắn)
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE NguoiDung SET TrangThaiHoatDong = 1, DaXacThucEmail = 1 WHERE Id = {userId}");

            // 2. Tìm ID Công ty từ nhiều nguồn để không bị sót
            var companyId = user.CompanyId;
            if (!companyId.HasValue)
            {
                // Nếu UserManager không thấy, ta truy vấn trực tiếp DB
                companyId = await _context.Users.AsNoTracking()
                    .Where(u => u.Id == userId)
                    .Select(u => u.CompanyId)
                    .FirstOrDefaultAsync();
            }

            if (companyId.HasValue && companyId > 0)
            {
                // 3. ÉP BUỘC cập nhật trạng thái Công ty sang 1 (Dấu V xanh)
                await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"UPDATE CongTy SET TrangThaiHoatDong = 1, NgayCapNhat = {DateTime.UtcNow} WHERE Id = {companyId.Value}");
                
                // Lưu lại cả qua Entity Framework để đồng bộ cache
                var company = await _context.Companies.FindAsync(companyId.Value);
                if (company != null) {
                    company.IsActive = true;
                    await _context.SaveChangesAsync();
                }
            }

            return Ok("Kích hoạt tài khoản và hệ thống công ty thành công!");
        }
        return BadRequest("Mã xác nhận không hợp lệ hoặc đã hết hạn.");
    }

    [HttpGet("companies")]
    public async Task<ActionResult<IEnumerable<CompanyDto>>> GetCompanies([FromQuery] bool hasEnrollmentsOnly = false)
    {
        var baseUrl = GetBaseUrl();
        var query = _context.Companies.Include(c => c.Users).AsNoTracking();

        if (hasEnrollmentsOnly)
        {
            query = query.Where(c => _context.CourseEnrollments.Any(e => e.User != null && e.User.CompanyId == c.Id));
        }

        var companies = await query.OrderByDescending(c => c.CreatedAt).ToListAsync();
        var result = new List<CompanyDto>();

        foreach (var c in companies)
        {
            var breakdown = await _fileUpload.GetCompanyStorageBreakdownAsync(c.Id);
            var hasPaid = await _context.Transactions.AnyAsync(t => t.CompanyId == c.Id && t.Status == "Completed");

            result.Add(new CompanyDto(
                c.Id,
                c.CompanyName,
                c.SubDomain,
                c.LogoUrl != null ? baseUrl + c.LogoUrl : null,
                c.CustomDomain,
                c.ServicePlan,
                c.ServicePlanId,
                c.PlanExpiresAt,
                hasPaid,
                c.ContactEmail,
                c.IsActive,
                c.Users.Count,
                c.IsActive ? "Đang hoạt động" : "Chưa kích hoạt",
                c.Industry,
                breakdown.Total,
                breakdown.Videos,
                breakdown.Images,
                breakdown.Documents,
                c.CreatedAt,
                c.UpdatedAt));
        }

        return Ok(result);
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
            company.Industry = form.Industry;
            company.UpdatedAt = DateTime.UtcNow;

            if (form.IsActive.HasValue) 
            {
                company.IsActive = form.IsActive.Value;
                // Khóa/Mở khóa toàn bộ user của công ty này
                await _context.Users
                    .Where(u => u.CompanyId == company.Id)
                    .ExecuteUpdateAsync(s => s.SetProperty(u => u.IsActive, form.IsActive.Value));
            }

            if (form.TrialDays.HasValue && form.TrialDays.Value > 0)
            {
                var trialDays = form.TrialDays.Value;
                company.PlanExpiresAt = DateTime.UtcNow.AddDays(trialDays);
                if (!string.IsNullOrWhiteSpace(company.ServicePlan))
                {
                    var plan = await _context.ServicePlans.AsNoTracking()
                        .FirstOrDefaultAsync(p => p.Name == company.ServicePlan);
                    if (plan != null)
                    {
                        company.ServicePlanId = plan.Id;
                        company.MaxUsers = plan.MaxUsers;
                    }
                }
            }

            if (form.LogoFile != null && form.LogoFile.Length > 0)
            {
                company.LogoUrl = await _fileUpload.SaveFileAsync(form.LogoFile, company.Id, "branding");
            }
            await _context.SaveChangesAsync();
            await _audit.LogAsync("Update", "Company", id.ToString(), null, $"{company.CompanyName} ({company.SubDomain})");
            return Ok();
        }
        catch (Exception ex) { return StatusCode(500, ex.Message); }
    }

    [HttpPut("users/{id}")]
    public async Task<IActionResult> UpdateUser(string id, [FromBody] AdminUpdateUserDto dto)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();
        
        // Chỉ ngăn chặn việc xóa hoặc đổi Role của chính mình nếu là SuperAdmin duy nhất (optional), 
        // nhưng ở đây người dùng muốn SỬA được Gmail nên ta bỏ chặn.
        // if (user.UserName == "superadmin") return BadRequest("Không thể sửa SuperAdmin."); 

        if (!string.IsNullOrWhiteSpace(dto.FullName)) user.FullName = dto.FullName;
        var email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim();
        user.Email = email;
        user.NormalizedEmail = _userManager.NormalizeEmail(email);
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(result.Errors.FirstOrDefault()?.Description);

        var currentRoles = await _userManager.GetRolesAsync(user);
        if (!string.IsNullOrWhiteSpace(dto.Role) && !currentRoles.Contains(dto.Role))
        {
            // Bảo vệ: Không cho phép đổi Role của tài khoản 'superadmin' gốc để tránh mất quyền quản trị tối cao
            if (user.UserName?.ToLower() != "superadmin")
            {
                await _userManager.RemoveFromRolesAsync(user, currentRoles);
                if (!await _roleManager.RoleExistsAsync(dto.Role)) await _roleManager.CreateAsync(new IdentityRole(dto.Role));
                await _userManager.AddToRoleAsync(user, dto.Role);
            }
        }

        await _audit.LogAsync("Update", "User", id, user.UserName, null, $"Cập nhật user {user.FullName} ({user.UserName})");
        return Ok();
    }

    [HttpPatch("users/{id}/active")]
    public async Task<IActionResult> SetUserActive(string id, [FromBody] SetUserActiveDto dto)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.Equals(id, currentUserId, StringComparison.Ordinal) && !dto.IsActive)
            return BadRequest("Không thể tự khóa tài khoản của chính bạn.");

        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();
        if (string.Equals(user.UserName, "superadmin", StringComparison.OrdinalIgnoreCase) && !dto.IsActive)
            return BadRequest("Không thể khóa tài khoản superadmin.");

        user.IsActive = dto.IsActive;
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequest(result.Errors.FirstOrDefault()?.Description ?? "Không thể cập nhật trạng thái.");

        // Nếu người dùng là Admin của một công ty, khóa/mở khóa công ty và toàn bộ tài khoản user thuộc công ty đó
        if (user.CompanyId.HasValue && await _userManager.IsInRoleAsync(user, "Admin"))
        {
            var company = await _context.Companies.FindAsync(user.CompanyId.Value);
            if (company != null)
            {
                company.IsActive = dto.IsActive;
                company.UpdatedAt = DateTime.UtcNow;
                
                // Khóa/mở khóa tất cả user (kể cả admin)
                await _context.Users
                    .Where(u => u.CompanyId == company.Id)
                    .ExecuteUpdateAsync(s => s.SetProperty(u => u.IsActive, dto.IsActive));
                    
                await _context.SaveChangesAsync();
            }
        }

        var detail = dto.IsActive ? "Mở khóa" : "Tạm khóa";
        await _audit.LogAsync("Update", "User", id, user.UserName, null, $"{detail} tài khoản {user.FullName} ({user.UserName})");
        return Ok(new { isActive = user.IsActive });
    }

    [HttpDelete("users/{userId}")]
    public async Task<IActionResult> DeleteUser(string userId)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound();
            if (user.UserName == "superadmin") return BadRequest("Không thể xóa SuperAdmin.");

            // NOTE: Manual cleanup removed as requested. User will execute SQL.
            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(result.Errors.FirstOrDefault()?.Description ?? "Lỗi khi xóa người dùng.");
            }
            
            await _audit.LogAsync("Delete", "User", userId, user.UserName, null, $"Xóa user {user.FullName} ({user.UserName})");
            return Ok();
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi hệ thống khi xóa user: {ex.Message}");
        }
    }

    [HttpDelete("companies/{id}")]
    public async Task<IActionResult> DeleteCompany(int id)
    {
        try
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null) return NotFound();

            var companyName = company.CompanyName;
            var subDomain = company.SubDomain;

            // Dọn dẹp dữ liệu liên quan để tránh lỗi khóa ngoại (FK) và dữ liệu mồ côi
            var courseIds = await _context.Courses.Where(c => c.CompanyId == id).Select(c => c.Id).ToListAsync();
            var userIds = await _context.Users.Where(u => u.CompanyId == id).Select(u => u.Id).ToListAsync();

            // 1. Xóa các Giao dịch và Hỗ trợ
            _context.Transactions.RemoveRange(_context.Transactions.Where(t => t.CompanyId == id));
            
            var tickets = await _context.SupportTickets.Where(t => t.CompanyId == id).ToListAsync();
            var ticketIds = tickets.Select(t => t.Id).ToList();
            var ticketPosts = _context.SupportTicketPosts.Where(p => ticketIds.Contains(p.SupportTicketId));
            var postIds = await ticketPosts.Select(p => p.Id).ToListAsync();
            _context.SupportTicketAttachments.RemoveRange(_context.SupportTicketAttachments.Where(a => postIds.Contains(a.SupportTicketPostId)));
            _context.SupportTicketPosts.RemoveRange(ticketPosts);
            _context.SupportTickets.RemoveRange(tickets);

            // 2. Xóa các thực thể liên quan đến học tập của User thuộc công ty
            if (userIds.Count > 0)
            {
                var enrollments = _context.CourseEnrollments.Where(e => userIds.Contains(e.UserId));
                var enrollmentIds = await enrollments.Select(e => e.Id).ToListAsync();
                
                _context.LessonProgresses.RemoveRange(_context.LessonProgresses.Where(lp => enrollmentIds.Contains(lp.EnrollmentId)));
                _context.LearnerBehaviorEvents.RemoveRange(_context.LearnerBehaviorEvents.Where(be => userIds.Contains(be.UserId) || (be.EnrollmentId.HasValue && enrollmentIds.Contains(be.EnrollmentId.Value))));
                
                var attempts = _context.QuizAttempts.Where(a => userIds.Contains(a.UserId));
                var attemptIds = await attempts.Select(a => a.Id).ToListAsync();
                _context.QuizAttemptAnswers.RemoveRange(_context.QuizAttemptAnswers.Where(aa => attemptIds.Contains(aa.QuizAttemptId)));
                _context.QuizAttempts.RemoveRange(attempts);

                _context.Certificates.RemoveRange(_context.Certificates.Where(c => userIds.Contains(c.UserId)));
                _context.UserNotifications.RemoveRange(_context.UserNotifications.Where(n => userIds.Contains(n.UserId)));
                _context.AnnouncementUserStates.RemoveRange(_context.AnnouncementUserStates.Where(s => userIds.Contains(s.UserId)));
                _context.UserNotes.RemoveRange(_context.UserNotes.Where(n => userIds.Contains(n.UserId)));
                _context.CourseDiscussions.RemoveRange(_context.CourseDiscussions.Where(d => userIds.Contains(d.UserId)));
                
                _context.CourseEnrollments.RemoveRange(enrollments);
            }

            // 3. Xóa dữ liệu liên quan đến Khóa học của công ty
            if (courseIds.Count > 0)
            {
                var quizzes = _context.Quizzes.Where(q => courseIds.Contains(q.CourseId));
                var quizIds = await quizzes.Select(q => q.Id).ToListAsync();
                var questions = _context.Questions.Where(q => quizIds.Contains(q.QuizId));
                var questionIds = await questions.Select(q => q.Id).ToListAsync();
                
                _context.Answers.RemoveRange(_context.Answers.Where(a => questionIds.Contains(a.QuestionId)));
                _context.Questions.RemoveRange(questions);
                _context.Quizzes.RemoveRange(quizzes);
                _context.Lessons.RemoveRange(_context.Lessons.Where(l => courseIds.Contains(l.CourseId)));
                
                // Enrollment cho các khóa học này (đối với user công ty khác nếu có ghi danh)
                var externalEnrollments = _context.CourseEnrollments.Where(e => courseIds.Contains(e.CourseId));
                var externalIds = await externalEnrollments.Select(e => e.Id).ToListAsync();
                _context.LessonProgresses.RemoveRange(_context.LessonProgresses.Where(lp => externalIds.Contains(lp.EnrollmentId)));
                _context.CourseEnrollments.RemoveRange(externalEnrollments);
                
                _context.Courses.RemoveRange(_context.Courses.Where(c => courseIds.Contains(c.Id)));
            }

            // 4. Xóa Thông báo nhắm đến công ty
            _context.Announcements.RemoveRange(_context.Announcements.Where(a => a.TargetCompanyId == id));

            // 5. Xóa Người dùng (Nhân viên)
            var usersToDelete = _context.Users.Where(u => u.CompanyId == id);
            _context.Users.RemoveRange(usersToDelete);

            // 6. Xóa các phòng ban và danh mục
            _context.Departments.RemoveRange(_context.Departments.Where(d => d.CompanyId == id));
            _context.Categories.RemoveRange(_context.Categories.Where(c => c.CompanyId == id));

            // 7. Xóa mẫu chứng chỉ
            _context.CertificateTemplates.RemoveRange(_context.CertificateTemplates.Where(t => t.CompanyId == id));

            // 8. Cuối cùng mới xóa Công ty
            _context.Companies.Remove(company);

            await _context.SaveChangesAsync();
            
            // Xóa thư mục vật lý chứa file của công ty
            var companyPath = Path.Combine(_env.ContentRootPath, "uploads", id.ToString());
            if (Directory.Exists(companyPath))
            {
                try { Directory.Delete(companyPath, true); } catch { /* bỏ qua lỗi xóa folder */ }
            }

            await _audit.LogAsync("Delete", "Company", id.ToString(), $"{companyName} ({subDomain})", null, $"Xóa công ty {companyName} và toàn bộ dữ liệu liên quan");
            return Ok();
        }
        catch (Exception ex)
        {
            var innerMsg = ex.InnerException != null ? ex.InnerException.Message : "";
            return StatusCode(500, $"Lỗi hệ thống khi xóa công ty: {ex.Message}. Chi tiết: {innerMsg}");
        }
    }
    [HttpPost("maintenance/reorganize-uploads")]
    public async Task<IActionResult> ReorganizeUploads()
    {
        try
        {
            int movedCount = 0;
            var uploadsRoot = Path.Combine(_env.ContentRootPath, "uploads");

            // 1. Reorganize Company Logos
            var companies = await _context.Companies.Where(c => !string.IsNullOrEmpty(c.LogoUrl)).ToListAsync();
            foreach (var company in companies)
            {
                // If it's a flat path like /uploads/logo.png, move it
                if (company.LogoUrl != null && company.LogoUrl.Count(f => f == '/') == 2) 
                {
                    var oldPath = Path.Combine(_env.ContentRootPath, company.LogoUrl.TrimStart('/'));
                    if (System.IO.File.Exists(oldPath))
                    {
                        company.LogoUrl = await MoveFileToNewStructure(oldPath, company.Id, "branding");
                        movedCount++;
                    }
                }
            }

            // 2. Reorganize Course Thumbnails and Intro Videos
            var courses = await _context.Courses.ToListAsync();
            foreach (var course in courses)
            {
                if (!string.IsNullOrEmpty(course.ThumbnailUrl) && !course.ThumbnailUrl.StartsWith("http") && course.ThumbnailUrl.Count(f => f == '/') == 2)
                {
                    var oldPath = Path.Combine(_env.ContentRootPath, course.ThumbnailUrl.TrimStart('/'));
                    if (System.IO.File.Exists(oldPath))
                    {
                        course.ThumbnailUrl = await MoveFileToNewStructure(oldPath, course.CompanyId, "thumbnails");
                        movedCount++;
                    }
                }
                if (!string.IsNullOrEmpty(course.IntroVideoUrl) && !course.IntroVideoUrl.StartsWith("http") && course.IntroVideoUrl.Count(f => f == '/') == 2)
                {
                    var oldPath = Path.Combine(_env.ContentRootPath, course.IntroVideoUrl.TrimStart('/'));
                    if (System.IO.File.Exists(oldPath))
                    {
                        course.IntroVideoUrl = await MoveFileToNewStructure(oldPath, course.CompanyId, "videos");
                        movedCount++;
                    }
                }
            }

            // 3. Reorganize User Avatars and Covers
            var users = await _context.Users.ToListAsync();
            foreach (var user in users)
            {
                if (!string.IsNullOrEmpty(user.AvatarUrl) && user.AvatarUrl.Count(f => f == '/') == 2)
                {
                    var oldPath = Path.Combine(_env.ContentRootPath, user.AvatarUrl.TrimStart('/'));
                    if (System.IO.File.Exists(oldPath))
                    {
                        user.AvatarUrl = await MoveFileToNewStructure(oldPath, user.CompanyId, "avatars");
                        movedCount++;
                    }
                }
                if (!string.IsNullOrEmpty(user.CoverPhotoUrl) && user.CoverPhotoUrl.Count(f => f == '/') == 2)
                {
                    var oldPath = Path.Combine(_env.ContentRootPath, user.CoverPhotoUrl.TrimStart('/'));
                    if (System.IO.File.Exists(oldPath))
                    {
                        user.CoverPhotoUrl = await MoveFileToNewStructure(oldPath, user.CompanyId, "covers");
                        movedCount++;
                    }
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Đã tổ chức lại {movedCount} tệp tin thành công.", movedCount });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi bảo trì: {ex.Message}");
        }
    }

    private async Task<string> MoveFileToNewStructure(string oldPath, int? companyId, string subDir)
    {
        string companyFolder = companyId.HasValue && companyId.Value > 0 ? companyId.Value.ToString() : "system";

        var fileName = Path.GetFileName(oldPath);
        var newDir = Path.Combine(_env.ContentRootPath, "uploads", companyFolder, subDir);
        
        if (!Directory.Exists(newDir)) Directory.CreateDirectory(newDir);
        
        var newPath = Path.Combine(newDir, fileName);
        
        // If file already exists in new location, just return the new URL
        if (!System.IO.File.Exists(newPath))
        {
            System.IO.File.Move(oldPath, newPath);
        }
        
        return $"/uploads/{companyFolder}/{subDir}/{fileName}";
    }

    /// <summary>Dọn dẹp thư mục uploads: xóa thư mục rỗng và tạo lại cấu trúc cho từng khoá học.</summary>
    [HttpPost("cleanup-uploads")]
    public async Task<IActionResult> CleanupUploads()
    {
        try
        {
            var companies = await _context.Companies.ToListAsync();
            int foldersCreated = 0;

            foreach (var company in companies)
            {
                // Đảm bảo thư mục gốc công ty tồn tại
                _fileUpload.EnsureCompanyFolder(company.Id);

                // Đảm bảo mỗi khoá học có thư mục đúng chuẩn
                var courses = await _context.Courses
                    .Where(c => c.CompanyId == company.Id)
                    .ToListAsync();

                foreach (var course in courses)
                {
                    _fileUpload.EnsureCourseFolder(company.Id, course.Id);
                    foldersCreated++;
                }

                // Xóa thư mục rỗng thừa
                _fileUpload.CleanupEmptyFolders(company.Id);
            }

            return Ok(new { message = $"Đã dọn dẹp xong. Tạo/kiểm tra {foldersCreated} thư mục khóa học.", foldersCreated });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi cleanup: {ex.Message}");
        }
    }
}
