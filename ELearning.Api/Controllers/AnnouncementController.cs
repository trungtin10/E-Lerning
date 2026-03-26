using ELearning.Api.Data;
using ELearning.Api.DTOs;
using ELearning.Api.Models;
using ELearning.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ELearning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnnouncementController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _audit;
    private readonly INotificationService _notify;

    public AnnouncementController(ApplicationDbContext context, IAuditService audit, INotificationService notify)
    {
        _context = context;
        _audit = audit;
        _notify = notify;
    }

    private async Task<int?> GetUserCompanyIdAsync()
    {
        var claim = User.FindFirst("CompanyId")?.Value
            ?? User.FindFirst(c => string.Equals(c.Type, "CompanyId", StringComparison.OrdinalIgnoreCase))?.Value;
        if (int.TryParse(claim, out int cid)) return cid;
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            return user?.CompanyId;
        }
        return null;
    }

    private static HashSet<string> GetUserRoles(ClaimsPrincipal user)
    {
        return user.Claims
            .Where(c => c.Type == ClaimTypes.Role || c.Type == "role")
            .Select(c => c.Value)
            .Where(v => !string.IsNullOrWhiteSpace(v))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    private static HashSet<string> ParseCsv(string? csv)
    {
        if (string.IsNullOrWhiteSpace(csv)) return new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        return csv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    [HttpGet("active")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<AnnouncementDto>>> GetActive()
    {
        var now = DateTime.UtcNow;
        var isAuthenticated = User?.Identity?.IsAuthenticated == true;
        var userId = isAuthenticated ? User?.FindFirst(ClaimTypes.NameIdentifier)?.Value : null;
        var roles = (isAuthenticated && User != null) ? GetUserRoles(User) : new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var companyId = isAuthenticated ? await GetUserCompanyIdAsync() : null;

        var baseQuery = _context.Announcements.AsNoTracking()
            .Where(a => a.IsActive && a.StartAt <= now && (a.EndAt == null || a.EndAt >= now));

        // Lọc target legacy (TargetType) để giữ tương thích
        baseQuery = baseQuery.Where(a =>
            a.TargetType == "All"
            || (isAuthenticated && a.TargetType == "AllCompanies")
            || (isAuthenticated && a.TargetType == "SuperAdminOnly" && roles.Contains("SuperAdmin"))
        );

        // Target mới: theo company/role (nếu set thì phải match)
        if (isAuthenticated)
        {
            baseQuery = baseQuery.Where(a =>
                (a.TargetCompanyId == null || (companyId.HasValue && a.TargetCompanyId == companyId.Value))
            );
        }
        else
        {
            // Anonymous chỉ thấy announcement không nhắm theo company/role
            baseQuery = baseQuery.Where(a => a.TargetCompanyId == null && (a.TargetRoles == null || a.TargetRoles == ""));
        }

        var query = baseQuery
            .OrderByDescending(a => a.Priority)
            .ThenByDescending(a => a.StartAt);

        if (string.IsNullOrEmpty(userId))
        {
            var listAnon = await query
                .Select(a => new AnnouncementDto(
                    a.Id, a.Title, a.Content, a.TargetType, a.DisplayType,
                    a.TargetCompanyId, a.TargetRoles, a.Severity, a.Priority,
                    a.LinkUrl, a.StartAt, a.EndAt, a.IsActive, a.CreatedAt,
                    null, null
                ))
                .ToListAsync();
            return Ok(listAnon);
        }

        // Join state để loại banner đã dismiss / popup đã ack
        var list = await (from a in query
                          join s in _context.AnnouncementUserStates.AsNoTracking().Where(x => x.UserId == userId)
                            on a.Id equals s.AnnouncementId into states
                          from st in states.DefaultIfEmpty()
                          select new
                          {
                              Announcement = a,
                              IsDismissed = st != null && st.DismissedAt != null,
                              IsAcknowledged = st != null && st.AcknowledgedAt != null
                          })
            .Where(x =>
                !(x.Announcement.DisplayType == "Banner" && x.IsDismissed)
                && !(x.Announcement.DisplayType == "Popup" && x.IsAcknowledged)
                && (string.IsNullOrEmpty(x.Announcement.TargetRoles) || ParseCsv(x.Announcement.TargetRoles).Overlaps(roles))
            )
            .Select(x => new AnnouncementDto(
                x.Announcement.Id,
                x.Announcement.Title,
                x.Announcement.Content,
                x.Announcement.TargetType,
                x.Announcement.DisplayType,
                x.Announcement.TargetCompanyId,
                x.Announcement.TargetRoles,
                x.Announcement.Severity,
                x.Announcement.Priority,
                x.Announcement.LinkUrl,
                x.Announcement.StartAt,
                x.Announcement.EndAt,
                x.Announcement.IsActive,
                x.Announcement.CreatedAt,
                x.IsDismissed,
                x.IsAcknowledged
            ))
            .ToListAsync();

        return Ok(list);
    }

    [HttpGet]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<IEnumerable<AnnouncementDto>>> GetAll()
    {
        var list = await _context.Announcements
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AnnouncementDto(
                a.Id, a.Title, a.Content, a.TargetType, a.DisplayType,
                a.TargetCompanyId, a.TargetRoles, a.Severity, a.Priority,
                a.LinkUrl, a.StartAt, a.EndAt, a.IsActive, a.CreatedAt,
                null, null
            ))
            .ToListAsync();
        return Ok(list);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<AnnouncementDto>> Create([FromBody] CreateAnnouncementDto dto)
    {
        var a = new Announcement
        {
            Title = dto.Title,
            Content = dto.Content,
            TargetType = dto.TargetType,
            DisplayType = dto.DisplayType,
            TargetCompanyId = dto.TargetCompanyId,
            TargetRoles = dto.TargetRoles,
            Severity = string.IsNullOrWhiteSpace(dto.Severity) ? "Info" : dto.Severity,
            Priority = dto.Priority,
            LinkUrl = dto.LinkUrl,
            StartAt = dto.StartAt,
            EndAt = dto.EndAt,
            IsActive = true,
            CreatedByUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        };
        _context.Announcements.Add(a);
        await _context.SaveChangesAsync();

        // Tạo notification in-app cho user theo target (không realtime/email ở bản đầu)
        var roles = ParseCsv(a.TargetRoles).ToList();
        await _notify.NotifyByTargetAsync(
            a.TargetCompanyId,
            roles.Count > 0 ? roles : null,
            $"Thông báo mới: {a.Title}",
            a.Content,
            type: "Announcement",
            severity: a.Severity,
            linkUrl: a.LinkUrl
        );

        return Ok(new AnnouncementDto(
            a.Id, a.Title, a.Content, a.TargetType, a.DisplayType,
            a.TargetCompanyId, a.TargetRoles, a.Severity, a.Priority,
            a.LinkUrl, a.StartAt, a.EndAt, a.IsActive, a.CreatedAt,
            null, null
        ));
    }

    [HttpPost("{id:int}/dismiss")]
    [Authorize]
    public async Task<IActionResult> Dismiss(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var exists = await _context.Announcements.AsNoTracking().AnyAsync(a => a.Id == id);
        if (!exists) return NotFound();

        var state = await _context.AnnouncementUserStates.FirstOrDefaultAsync(s => s.AnnouncementId == id && s.UserId == userId);
        if (state == null)
        {
            state = new AnnouncementUserState { AnnouncementId = id, UserId = userId, DismissedAt = DateTime.UtcNow };
            _context.AnnouncementUserStates.Add(state);
        }
        else
        {
            state.DismissedAt ??= DateTime.UtcNow;
        }
        await _context.SaveChangesAsync();
        return Ok(new { dismissed = true });
    }

    [HttpPost("{id:int}/ack")]
    [Authorize]
    public async Task<IActionResult> Acknowledge(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var exists = await _context.Announcements.AsNoTracking().AnyAsync(a => a.Id == id);
        if (!exists) return NotFound();

        var state = await _context.AnnouncementUserStates.FirstOrDefaultAsync(s => s.AnnouncementId == id && s.UserId == userId);
        if (state == null)
        {
            state = new AnnouncementUserState { AnnouncementId = id, UserId = userId, AcknowledgedAt = DateTime.UtcNow };
            _context.AnnouncementUserStates.Add(state);
        }
        else
        {
            state.AcknowledgedAt ??= DateTime.UtcNow;
        }
        await _context.SaveChangesAsync();
        return Ok(new { acknowledged = true });
    }

    [HttpPut("{id:int}/toggle")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var a = await _context.Announcements.FindAsync(id);
        if (a == null) return NotFound();
        var wasActive = a.IsActive;
        a.IsActive = !a.IsActive;
        await _context.SaveChangesAsync();
        await _audit.LogAsync("Toggle", "Announcement", id.ToString(), wasActive.ToString(), a.IsActive.ToString(), $"Bật/tắt thông báo: {a.Title}");
        return Ok(new { isActive = a.IsActive });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Delete(int id)
    {
        var a = await _context.Announcements.FindAsync(id);
        if (a == null) return NotFound();
        var title = a.Title;
        _context.Announcements.Remove(a);
        await _context.SaveChangesAsync();
        await _audit.LogAsync("Delete", "Announcement", id.ToString(), title, null, "Xóa thông báo");
        return NoContent();
    }
}
