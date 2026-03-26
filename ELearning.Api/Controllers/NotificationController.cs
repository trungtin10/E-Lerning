using ELearning.Api.Data;
using ELearning.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ELearning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public NotificationController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<object>> List([FromQuery] bool unreadOnly = false, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        page = page <= 0 ? 1 : page;
        pageSize = pageSize <= 0 ? 20 : Math.Min(100, pageSize);

        var query = _context.UserNotifications.AsNoTracking().Where(n => n.UserId == userId);
        if (unreadOnly) query = query.Where(n => !n.IsRead);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new UserNotificationDto(
                n.Id,
                n.Title,
                n.Content,
                n.Type,
                n.Severity,
                n.IsRead,
                n.ReadAt,
                n.LinkUrl,
                DateTime.SpecifyKind(n.CreatedAt, DateTimeKind.Utc)
            ))
            .ToListAsync();

        return Ok(new { items, total, page, pageSize });
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<object>> UnreadCount()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var count = await _context.UserNotifications.AsNoTracking()
            .Where(n => n.UserId == userId && !n.IsRead)
            .CountAsync();
        return Ok(new { unread = count });
    }

    [HttpPost("{id:long}/read")]
    public async Task<IActionResult> MarkRead(long id, [FromBody] MarkNotificationReadDto? dto = null)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var n = await _context.UserNotifications.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
        if (n == null) return NotFound();

        var shouldRead = dto?.IsRead ?? true;
        if (shouldRead)
        {
            if (!n.IsRead)
            {
                n.IsRead = true;
                n.ReadAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }
        else
        {
            if (n.IsRead)
            {
                n.IsRead = false;
                n.ReadAt = null;
                await _context.SaveChangesAsync();
            }
        }

        return Ok(new { id = n.Id, isRead = n.IsRead });
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> ReadAll()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var now = DateTime.UtcNow;
        await _context.UserNotifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.IsRead, true).SetProperty(x => x.ReadAt, now));

        return Ok(new { success = true });
    }
}

