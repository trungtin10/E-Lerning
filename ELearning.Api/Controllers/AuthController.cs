using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ELearning.Api.DTOs;
using ELearning.Api.Models;
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

    public AuthController(
        UserManager<ApplicationUser> userManager,
        IConfiguration configuration,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto loginDto)
    {
        // Cho phép đăng nhập bằng cả UserName hoặc Email
        var user = await _userManager.FindByNameAsync(loginDto.Account) 
                   ?? await _userManager.FindByEmailAsync(loginDto.Account);

        if (user == null || !await _userManager.CheckPasswordAsync(user, loginDto.Password))
            return Unauthorized("Tài khoản hoặc mật khẩu không chính xác.");

        if (!user.EmailConfirmed) return BadRequest("Vui lòng kích hoạt tài khoản qua Email.");
        if (!user.IsActive) return BadRequest("Tài khoản đã bị vô hiệu hóa.");

        var roles = await _userManager.GetRolesAsync(user);
        var token = GenerateJwtToken(user, roles);

        return Ok(new AuthResponseDto(token, user.FullName, user.UserName!, roles.ToList(), user.CompanyId));
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

            return Ok(new AuthResponseDto(token, user.FullName, user.UserName!, roles.ToList(), user.CompanyId));
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
