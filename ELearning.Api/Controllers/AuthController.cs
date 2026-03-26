using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ELearning.Api.Data;
using ELearning.Api.DTOs;
using ELearning.Api.Models;
using ELearning.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization;
using Google.Apis.Auth;

namespace ELearning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;
    private readonly IEmailService _emailService;
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _audit;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        IConfiguration configuration,
        ILogger<AuthController> logger,
        IEmailService emailService,
        ApplicationDbContext context,
        IAuditService audit)
    {
        _userManager = userManager;
        _configuration = configuration;
        _logger = logger;
        _emailService = emailService;
        _context = context;
        _audit = audit;
    }

    private string GetBaseUrl()
    {
        var configuredDomain = _configuration["AppSettings:AppDomain"];
        if (!string.IsNullOrEmpty(configuredDomain))
            return configuredDomain.TrimEnd('/');
        if (Request.Headers.TryGetValue("X-Forwarded-Host", out var forwardedHost))
        {
            var proto = Request.Headers["X-Forwarded-Proto"].FirstOrDefault() ?? "https";
            return $"{proto}://{forwardedHost}";
        }
        var host = Request.Host.Value ?? string.Empty;
        if (host.Contains("localhost:5211"))
            return $"{Request.Scheme}://localhost:5173";
        return $"{Request.Scheme}://{host}";
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email))
            return BadRequest(new { message = "Vui lòng nhập email." });

        var user = await _userManager.FindByEmailAsync(dto.Email.Trim());
        if (user == null)
        {
            // Không tiết lộ user có tồn tại hay không (bảo mật)
            return Ok(new { message = "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu." });
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var encodedToken = Uri.EscapeDataString(token);
        var resetLink = $"{GetBaseUrl()}/reset-password?userId={user.Id}&token={encodedToken}";

        await _emailService.SendPasswordResetEmailAsync(user.Email!, user.FullName ?? user.UserName ?? "User", resetLink);

        return Ok(new { message = "Đã gửi email hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.UserId) || string.IsNullOrWhiteSpace(dto.Token) || string.IsNullOrWhiteSpace(dto.NewPassword))
            return BadRequest(new { message = "Thiếu thông tin. Vui lòng sử dụng link từ email." });

        var user = await _userManager.FindByIdAsync(dto.UserId);
        if (user == null)
            return BadRequest(new { message = "Link không hợp lệ hoặc đã hết hạn." });

        var token = Uri.UnescapeDataString(dto.Token);
        var result = await _userManager.ResetPasswordAsync(user, token, dto.NewPassword);
        if (!result.Succeeded)
            return BadRequest(new { message = result.Errors.First().Description });

        return Ok(new { message = "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập." });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto loginDto)
    {
        // Cho phép đăng nhập bằng cả UserName hoặc Email
        var user = await _userManager.FindByNameAsync(loginDto.Account) 
                   ?? await _userManager.FindByEmailAsync(loginDto.Account);

        if (user == null)
            return Unauthorized(new { error = "invalid_credentials", message = "Sai tài khoản hoặc mật khẩu." });
        if (!await _userManager.CheckPasswordAsync(user, loginDto.Password))
            return Unauthorized(new { error = "invalid_password", message = "Sai mật khẩu." });

        if (!user.EmailConfirmed) return BadRequest("Vui lòng kích hoạt tài khoản qua Email.");
        if (!user.IsActive) return BadRequest("Tài khoản đã bị vô hiệu hóa.");

        var roles = await _userManager.GetRolesAsync(user);
        var token = GenerateJwtToken(user, roles);

        string? companyLogoUrl = null;
        if (user.CompanyId.HasValue && user.CompanyId.Value > 0)
        {
            var company = await _context.Companies.AsNoTracking()
                .Where(c => c.Id == user.CompanyId.Value)
                .Select(c => c.LogoUrl)
                .FirstOrDefaultAsync();
            companyLogoUrl = company;
        }

        await _audit.LogAsync("Login", "User", user.Id, null, user.UserName ?? user.Email, "Đăng nhập thành công", user.Id, user.UserName ?? user.FullName);
        return Ok(new AuthResponseDto(token, user.FullName, user.UserName!, roles.ToList(), user.CompanyId, companyLogoUrl));
    }

    // --- ĐỔI MẬT KHẨU ---
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var user = await _userManager.FindByIdAsync(userId!);
        if (user == null) return NotFound();

        var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
        if (!result.Succeeded) return BadRequest(result.Errors.First().Description);

        await _audit.LogAsync("ChangePassword", "User", userId!, null, null, "Đổi mật khẩu");
        return Ok(new { Message = "Đổi mật khẩu thành công!" });
    }

    // --- ĐĂNG NHẬP GOOGLE SSO ---
    [HttpPost("google-login")]
    public async Task<ActionResult<AuthResponseDto>> GoogleLogin([FromBody] ExternalLoginDto dto)
    {
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings()
            {
                Audience = new List<string>() { _configuration["Authentication:Google:ClientId"]! }
            };

            var payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken, settings);

            var user = await _userManager.FindByEmailAsync(payload.Email);
            if (user == null)
            {
                // Nếu chưa có user, có thể tự động tạo hoặc yêu cầu liên hệ admin
                return BadRequest("Tài khoản Google này chưa được cấp quyền truy cập hệ thống.");
            }

            var roles = await _userManager.GetRolesAsync(user);
            var token = GenerateJwtToken(user, roles);

            string? companyLogoUrl = null;
            if (user.CompanyId.HasValue && user.CompanyId.Value > 0)
            {
                companyLogoUrl = await _context.Companies.AsNoTracking()
                    .Where(c => c.Id == user.CompanyId.Value)
                    .Select(c => c.LogoUrl)
                    .FirstOrDefaultAsync();
            }

            await _audit.LogAsync("GoogleLogin", "User", user.Id, null, user.UserName ?? user.Email, "Đăng nhập Google", user.Id, user.UserName ?? user.FullName);
            return Ok(new AuthResponseDto(token, user.FullName, user.UserName!, roles.ToList(), user.CompanyId, companyLogoUrl));
        }
        catch (Exception ex)
        {
            return BadRequest("Xác thực Google thất bại: " + ex.Message);
        }
    }

    private string GenerateJwtToken(ApplicationUser user, IList<string> roles)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.UserName!),
            new Claim("FullName", user.FullName),
            new Claim("CompanyId", user.CompanyId?.ToString() ?? "0")
        };

        foreach (var role in roles) claims.Add(new Claim(ClaimTypes.Role, role));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.Now.AddMinutes(Convert.ToDouble(_configuration["Jwt:ExpiryInMinutes"]));

        var token = new JwtSecurityToken(
            _configuration["Jwt:Issuer"],
            _configuration["Jwt:Audience"],
            claims,
            expires: expires,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
