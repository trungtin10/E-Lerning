using ELearning.Api.Data;
using ELearning.Api.DTOs;
using ELearning.Api.Models;
using ELearning.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ELearning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TicketController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _audit;

    public TicketController(ApplicationDbContext context, IAuditService audit)
    {
        _context = context;
        _audit = audit;
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<SupportTicketDto>> Create([FromBody] CreateTicketDto dto)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var user = await _context.Users.Include(u => u.Company).FirstOrDefaultAsync(u => u.Id == userId);
        if (user?.CompanyId == null) return BadRequest("Chỉ Admin công ty mới có thể tạo ticket.");
        var ticket = new SupportTicket
        {
            CompanyId = user.CompanyId.Value,
            UserId = userId!,
            Subject = dto.Subject,
            Content = dto.Content,
            Priority = dto.Priority,
            Status = "Open"
        };
        _context.SupportTickets.Add(ticket);
        await _context.SaveChangesAsync();
        return Ok(new SupportTicketDto(ticket.Id, ticket.CompanyId, user.Company!.CompanyName, ticket.UserId, ticket.Subject, ticket.Content, ticket.Status, ticket.Priority, ticket.AdminReply, ticket.RepliedAt, ticket.CreatedAt));
    }

    [HttpGet("my")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<IEnumerable<SupportTicketDto>>> GetMyTickets()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var tickets = await _context.SupportTickets
            .Include(t => t.Company)
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new SupportTicketDto(t.Id, t.CompanyId, t.Company!.CompanyName, t.UserId, t.Subject, t.Content, t.Status, t.Priority, t.AdminReply, t.RepliedAt, t.CreatedAt))
            .ToListAsync();
        return Ok(tickets);
    }

    [HttpGet]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<object>> GetAll([FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _context.SupportTickets.Include(t => t.Company).AsQueryable();
        if (!string.IsNullOrEmpty(status)) query = query.Where(t => t.Status == status);
        var total = await query.CountAsync();
        var list = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new SupportTicketDto(t.Id, t.CompanyId, t.Company!.CompanyName, t.UserId, t.Subject, t.Content, t.Status, t.Priority, t.AdminReply, t.RepliedAt, t.CreatedAt))
            .ToListAsync();
        return Ok(new { items = list, total, page, pageSize });
    }

    [HttpPut("{id:int}/reply")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<SupportTicketDto>> Reply(int id, [FromBody] ReplyTicketDto dto)
    {
        var ticket = await _context.SupportTickets.Include(t => t.Company).FirstOrDefaultAsync(t => t.Id == id);
        if (ticket == null) return NotFound();
        ticket.AdminReply = dto.Reply;
        ticket.RepliedByUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        ticket.RepliedAt = DateTime.UtcNow;
        ticket.Status = "Resolved";
        ticket.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await _audit.LogAsync("Reply", "SupportTicket", id.ToString(), null, ticket.Subject, "Phản hồi ticket hỗ trợ");
        return Ok(new SupportTicketDto(ticket.Id, ticket.CompanyId, ticket.Company!.CompanyName, ticket.UserId, ticket.Subject, ticket.Content, ticket.Status, ticket.Priority, ticket.AdminReply, ticket.RepliedAt, ticket.CreatedAt));
    }
}
