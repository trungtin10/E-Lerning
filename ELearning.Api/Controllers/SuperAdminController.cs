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
    private readonly IAuditService _audit;

    public SuperAdminController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IWebHostEnvironment env,
        IEmailService emailService,
        IConfiguration config,
        IAuditService audit)
    {
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
        _env = env;
        _emailService = emailService;
        _config = config;
        _audit = audit;
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

        var host = Request.Host.Value ?? string.Empty;
        if (host.Contains("localhost:5211"))
        {
            return $"{Request.Scheme}://{host.Replace("5211", "5173")}";
        }

        return $"{Request.Scheme}://{host}";
    }

    private async Task<bool> TableExistsAsync(string tableName)
    {
        var connection = _context.Database.GetDbConnection();
        try
        {
            if (connection.State != System.Data.ConnectionState.Open)
                await connection.OpenAsync();

            using var command = connection.CreateCommand();
            command.CommandText = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = @tableName";
            var param = command.CreateParameter();
            param.ParameterName = "@tableName";
            param.Value = tableName;
            command.Parameters.Add(param);

            var result = await command.ExecuteScalarAsync();
            return Convert.ToInt32(result) > 0;
        }
        finally
        {
            if (connection.State == System.Data.ConnectionState.Open)
                await connection.CloseAsync();
        }
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
        var recentCompanies = await _context.Companies.Where(c => c.SubDomain != "admin").OrderByDescending(c => c.CreatedAt).Take(5).Select(c => new RecentActivityDto(c.CompanyName, $"Đã đăng ký gói {c.ServicePlan ?? "Basic"}", c.CreatedAt, "Company")).ToListAsync();
        return Ok(new DashboardStatsDto(totalCompanies, activeCompanies, totalUsers, totalCourses, pendingActivations, recentCompanies));
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
        try
        {
            if (await _context.Companies.AnyAsync(c => c.SubDomain == form.SubDomain))
                return Conflict("Công ty/subdomain này đã kích hoạt rồi.");
            if (await _userManager.FindByNameAsync(form.Account) != null)
                return Conflict("Tài khoản admin này đã kích hoạt rồi.");

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

            // Dùng thử: set gói + hết hạn theo ngày (KHÔNG tạo giao dịch)
            var trialDays = form.ServicePlanDurationDays > 0 ? form.ServicePlanDurationDays : 7;
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
                    company.ServicePlan = plan.Name;
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

            var user = new ApplicationUser { UserName = form.Account, Email = form.ContactEmail, FullName = "Admin " + form.CompanyName, CompanyId = company.Id, IsActive = true, EmailConfirmed = false, CreatedAt = DateTime.UtcNow };
            var result = await _userManager.CreateAsync(user, form.Password);
            if (!result.Succeeded) { _context.Companies.Remove(company); await _context.SaveChangesAsync(); return BadRequest(result.Errors.First().Description); }

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
                return BadRequest("Email không tồn tại hoặc không gửi được thư kích hoạt. Vui lòng kiểm tra lại. Lỗi: " + ex.Message);
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
        if (user.UserName == "superadmin") return BadRequest("Không thể sửa SuperAdmin.");

        user.FullName = dto.FullName;
        user.Email = dto.Email;
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(result.Errors.FirstOrDefault()?.Description);

        var currentRoles = await _userManager.GetRolesAsync(user);
        if (!currentRoles.Contains(dto.Role))
        {
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            if (!await _roleManager.RoleExistsAsync(dto.Role)) await _roleManager.CreateAsync(new IdentityRole(dto.Role));
            await _userManager.AddToRoleAsync(user, dto.Role);
        }

        await _audit.LogAsync("Update", "User", id, user.UserName, null, $"Cập nhật user {user.FullName} ({user.UserName})");
        return Ok();
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
        await _audit.LogAsync("Delete", "User", userId, user.UserName, null, $"Xóa user {user.FullName} ({user.UserName})");
        return Ok();
    }

    [HttpDelete("companies/{id}")]
    public async Task<IActionResult> DeleteCompany(int id)
    {
        try
        {
            var company = await _context.Companies
                .Include(c => c.Users)
                .Include(c => c.Courses).ThenInclude(crs => crs.Lessons).ThenInclude(l => l.Quizzes)
                .Include(c => c.Categories)
                .Include(c => c.Departments)
                .FirstOrDefaultAsync(c => c.Id == id);
                
            if (company == null) return NotFound();

            var userIds = company.Users.Select(u => u.Id).ToList();
            var courseIds = company.Courses.Select(c => c.Id).ToList();
            var lessonIds = company.Courses.SelectMany(c => c.Lessons).Select(l => l.Id).ToList();
            var quizIds = company.Courses.SelectMany(c => c.Lessons).SelectMany(l => l.Quizzes).Select(q => q.Id).ToList();

            // 1. Dọn dẹp dữ liệu tương tác của Users (Foreign Key: NoAction)
            if (await TableExistsAsync("LearnerBehaviorEvents"))
            {
                var behaviorEvents = await _context.LearnerBehaviorEvents.Where(e => userIds.Contains(e.UserId!) || courseIds.Contains(e.CourseId)).ToListAsync();
                _context.LearnerBehaviorEvents.RemoveRange(behaviorEvents);
            }

            if (await TableExistsAsync("AnnouncementUserStates"))
            {
                var announcementStates = await _context.AnnouncementUserStates.Where(s => userIds.Contains(s.UserId)).ToListAsync();
                _context.AnnouncementUserStates.RemoveRange(announcementStates);
            }

            var quizAttempts = await _context.QuizAttempts.Where(qa => userIds.Contains(qa.UserId)).ToListAsync();
            _context.QuizAttempts.RemoveRange(quizAttempts);

            var progress = await _context.LessonProgresses.Where(lp => userIds.Contains(lp.Enrollment.UserId)).ToListAsync();
            _context.LessonProgresses.RemoveRange(progress);

            var certificates = await _context.Certificates.Where(cert => userIds.Contains(cert.UserId)).ToListAsync();
            _context.Certificates.RemoveRange(certificates);

            var enrollments = await _context.CourseEnrollments.Where(ce => userIds.Contains(ce.UserId)).ToListAsync();
            _context.CourseEnrollments.RemoveRange(enrollments);

            // 2. Dọn dẹp dữ liệu Giao dịch và Hỗ trợ
            var transactions = await _context.Transactions.Where(t => t.CompanyId == id).ToListAsync();
            _context.Transactions.RemoveRange(transactions);

            var tickets = await _context.SupportTickets.Where(t => t.CompanyId == id).ToListAsync();
            var ticketIds = tickets.Select(t => t.Id).ToList();
            var posts = await _context.SupportTicketPosts.Where(p => ticketIds.Contains(p.SupportTicketId)).ToListAsync();
            _context.SupportTicketPosts.RemoveRange(posts);
            _context.SupportTickets.RemoveRange(tickets);

            // 3. Dọn dẹp Khóa học & Bài tập (Quizzes -> Lessons -> Courses)
            var questions = await _context.Questions.Where(q => quizIds.Contains(q.QuizId)).ToListAsync();
            var questionIds = questions.Select(q => q.Id).ToList();
            var answers = await _context.Answers.Where(a => questionIds.Contains(a.QuestionId)).ToListAsync();
            
            _context.Answers.RemoveRange(answers);
            _context.Questions.RemoveRange(questions);
            foreach (var course in company.Courses) {
                foreach (var lesson in course.Lessons) {
                    _context.Quizzes.RemoveRange(lesson.Quizzes);
                }
                _context.Lessons.RemoveRange(course.Lessons);
            }
            _context.Courses.RemoveRange(company.Courses);

            // 4. Xóa Users (Identity Flow: Xóa Roles, Logins trước)
            foreach (var user in company.Users.ToList()) {
                await _userManager.DeleteAsync(user);
            }

            // 5. Xóa các thực thể khác và Company
            _context.Categories.RemoveRange(company.Categories);
            _context.Departments.RemoveRange(company.Departments);
            
            var announcements = await _context.Announcements.Where(a => a.TargetCompanyId == id).ToListAsync();
            _context.Announcements.RemoveRange(announcements);

            var companyName = company.CompanyName;
            var subDomain = company.SubDomain;
            _context.Companies.Remove(company);

            await _context.SaveChangesAsync();
            await _audit.LogAsync("Delete", "Company", id.ToString(), $"{companyName} ({subDomain})", null, $"Xóa công ty {companyName}");
            return Ok();
        }
        catch (Exception ex) 
        { 
            return StatusCode(500, $"Lỗi hệ thống khi xóa công ty: {ex.Message} {(ex.InnerException != null ? " -> " + ex.InnerException.Message : "")}"); 
        }
    }
}
