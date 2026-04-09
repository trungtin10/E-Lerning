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
        return app;
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
        if (!string.IsNullOrEmpty(dto.JobTitle) && dto.JobTitle.Length > 100)
            return Results.BadRequest(new { message = "Chức danh tối đa 100 ký tự." });

        var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Results.Unauthorized();
        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
            return Results.NotFound();

        user.FullName = dto.FullName.Trim();
        user.PhoneNumber = string.IsNullOrWhiteSpace(dto.PhoneNumber) ? null : dto.PhoneNumber.Trim();
        user.JobTitle = string.IsNullOrWhiteSpace(dto.JobTitle) ? null : dto.JobTitle.Trim();

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
            user.JobTitle);
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
