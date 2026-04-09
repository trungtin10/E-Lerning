using ELearning.Api.Data;
using ELearning.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ELearning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Admin,Instructor")]
public class AuditController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AuditController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetAll(
        [FromQuery] string? action,
        [FromQuery] string? entityType,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var query = _context.AuditLogs.AsQueryable();

        if (!User.IsInRole("SuperAdmin"))
        {
            var companyIdClaim = User.FindFirst("CompanyId")?.Value;
            int companyId = 0;
            if (!int.TryParse(companyIdClaim, out companyId))
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                var userRow = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
                companyId = userRow?.CompanyId ?? 0;
            }

            if (companyId > 0)
            {
                var companyUserIds = await _context.Users
                    .Where(u => u.CompanyId == companyId)
                    .Select(u => u.Id)
                    .ToListAsync();
                query = query.Where(a => a.UserId != null && companyUserIds.Contains(a.UserId));
            }
            else
            {
                query = query.Where(a => false); // no results if no company identified
            }
        }

        if (!string.IsNullOrEmpty(action)) query = query.Where(a => a.Action == action);
        if (!string.IsNullOrEmpty(entityType)) query = query.Where(a => a.EntityType == entityType);
        
        var total = await query.CountAsync();
        var list = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditLogDto(
                a.Id,
                a.UserId,
                a.UserName,
                a.Action,
                a.EntityType,
                a.EntityId,
                a.OldValue,
                a.NewValue,
                a.IpAddress,
                a.Details,
                DateTime.SpecifyKind(a.CreatedAt, DateTimeKind.Utc)
            ))
            .ToListAsync();
        return Ok(new { items = list, total, page, pageSize });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(long id)
    {
        var log = await _context.AuditLogs.FindAsync(id);
        if (log == null) return NotFound();

        if (!User.IsInRole("SuperAdmin"))
        {
            var companyIdClaim = User.FindFirst("CompanyId")?.Value;
            int companyId = 0;
            if (!int.TryParse(companyIdClaim, out companyId))
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                var userRow = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
                companyId = userRow?.CompanyId ?? 0;
            }

            if (companyId > 0)
            {
                var logUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == log.UserId);
                if (logUser == null || logUser.CompanyId != companyId) return StatusCode(403, "Không có quyền xóa bản ghi này.");
            }
            else
            {
                return StatusCode(403, "Không xác định được công ty.");
            }
        }

        _context.AuditLogs.Remove(log);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("clear")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> ClearAll()
    {
        await _context.AuditLogs.ExecuteDeleteAsync();
        return NoContent();
    }
}
