using System.Security.Claims;
using ELearning.Api.Data;
using ELearning.Api.DTOs;
using ELearning.Api.Models;
using ELearning.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ELearning.Api;

/// <summary>
/// Hồ sơ người dùng đăng ký qua minimal API để tránh trường hợp MapControllers không map được route "me".
/// </summary>
public static class AuthProfileEndpoints
{
    public static WebApplication MapAuthProfileEndpoints(this WebApplication app)
    {
        var g = app.MapGroup("/api/auth").RequireAuthorization();
        g.MapGet("/me", GetProfileAsync);
        g.MapGet("/profile", GetProfileAsync);
        g.MapPut("/me", PutProfileAsync);
        g.MapPut("/profile", PutProfileAsync);
        g.MapPost("/avatar", UploadAvatarAsync).DisableAntiforgery();
        g.MapPost("/cover", UploadCoverAsync).DisableAntiforgery();
        return app;
    }

    private static async Task<IResult> UploadAvatarAsync(
        IFormFile file,
        ClaimsPrincipal principal,
        UserManager<ApplicationUser> userManager,
        IWebHostEnvironment env,
        IAuditService audit)
    {
        return await HandleFileUpload(file, principal, userManager, env, audit, "avatar");
    }

    private static async Task<IResult> UploadCoverAsync(
        IFormFile file,
        ClaimsPrincipal principal,
        UserManager<ApplicationUser> userManager,
        IWebHostEnvironment env,
        IAuditService audit)
    {
        return await HandleFileUpload(file, principal, userManager, env, audit, "cover");
    }

    private static async Task<IResult> HandleFileUpload(
        IFormFile file,
        ClaimsPrincipal principal,
        UserManager<ApplicationUser> userManager,
        IWebHostEnvironment env,
        IAuditService audit,
        string type)
    {
        if (file == null || file.Length == 0) return Results.BadRequest("Không có file nào được chọn.");
        
        var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var user = await userManager.FindByIdAsync(userId!);
        if (user == null) return Results.NotFound();

        var uploads = Path.Combine(env.ContentRootPath, "uploads");
        if (!Directory.Exists(uploads)) Directory.CreateDirectory(uploads);

        var fileName = $"{type}_{user.Id}_{Guid.NewGuid():N}{Path.GetExtension(file.FileName)}";
        var filePath = Path.Combine(uploads, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var url = $"/uploads/{fileName}";
        if (type == "avatar") user.AvatarUrl = url;
        else user.CoverPhotoUrl = url;

        await userManager.UpdateAsync(user);
        await audit.LogAsync("UpdatePhoto", "User", user.Id, null, null, $"Cập nhật {type}");

        return Results.Ok(new { url });
    }

    private static async Task<IResult> GetProfileAsync(
        ClaimsPrincipal principal,
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext db)
    {
        var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Results.Unauthorized();
        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
            return Results.NotFound();
        var dto = await ToProfileDtoAsync(userManager, db, user);
        return TypedResults.Ok(dto);
    }

    private static async Task<IResult> PutProfileAsync(
        UpdateMyProfileDto dto,
        ClaimsPrincipal principal,
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext db,
        IAuditService audit)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName))
            return Results.BadRequest(new { message = "Họ tên không được để trống." });
        if (dto.FullName.Trim().Length > 100)
            return Results.BadRequest(new { message = "Họ tên tối đa 100 ký tự." });
        if (!string.IsNullOrEmpty(dto.PhoneNumber) && dto.PhoneNumber.Length > 50)
            return Results.BadRequest(new { message = "Số điện thoại tối đa 50 ký tự." });

        var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Results.Unauthorized();
        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
            return Results.NotFound();

        // Cập nhật Email nếu có
        if (!string.IsNullOrWhiteSpace(dto.Email) && !string.Equals(user.Email, dto.Email, StringComparison.OrdinalIgnoreCase))
        {
            var existing = await userManager.FindByEmailAsync(dto.Email.Trim());
            if (existing != null && existing.Id != user.Id)
                return Results.BadRequest(new { message = "Email này đã được sử dụng bởi người dùng khác." });
            
            user.Email = dto.Email.Trim();
            user.NormalizedEmail = userManager.NormalizeEmail(user.Email);
        }

        user.FullName = dto.FullName.Trim();
        user.PhoneNumber = string.IsNullOrWhiteSpace(dto.PhoneNumber) ? null : dto.PhoneNumber.Trim();

        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return Results.BadRequest(new { message = result.Errors.First().Description });

        await audit.LogAsync("UpdateProfile", "User", user.Id, null, null, "Cập nhật hồ sơ cá nhân", user.Id, user.FullName);
        var outDto = await ToProfileDtoAsync(userManager, db, user);
        return TypedResults.Ok(outDto);
    }

    private static async Task<UserProfileDto> ToProfileDtoAsync(
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext db,
        ApplicationUser user)
    {
        var roles = (await userManager.GetRolesAsync(user)).ToList();
        var (companyLogoUrl, subDomain, companyName) = await GetCompanyBrandingAsync(db, user.CompanyId);
        return new UserProfileDto(
            user.FullName,
            user.UserName!,
            user.Email,
            user.PhoneNumber,
            roles,
            user.CompanyId,
            companyName,
            subDomain,
            companyLogoUrl,
            user.AvatarUrl,
            user.CoverPhotoUrl);
    }

    private static async Task<(string? LogoUrl, string? SubDomain, string? CompanyName)> GetCompanyBrandingAsync(
        ApplicationDbContext context,
        int? companyId)
    {
        if (!companyId.HasValue || companyId.Value <= 0)
            return (null, null, null);
        var row = await context.Companies.AsNoTracking()
            .Where(c => c.Id == companyId.Value)
            .Select(c => new { c.LogoUrl, c.SubDomain, c.CompanyName })
            .FirstOrDefaultAsync();
        return row == null ? (null, null, null) : (row.LogoUrl, row.SubDomain, row.CompanyName);
    }
}
