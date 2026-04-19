using ELearning.Api.Data;
using ELearning.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ELearning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DiscussionController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public DiscussionController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("{courseId}")]
    public async Task<IActionResult> GetDiscussions(int courseId, [FromQuery] int? lessonId)
    {
        var query = _context.CourseDiscussions
            .Include(d => d.User)
            .Include(d => d.Replies).ThenInclude(r => r.User)
            .Where(d => d.CourseId == courseId && d.ParentId == null);

        if (lessonId.HasValue)
        {
            query = query.Where(d => d.LessonId == lessonId.Value);
        }

        var discussions = await query
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new {
                d.Id,
                d.Content,
                d.CreatedAt,
                User = new { d.User!.FullName, d.User.AvatarUrl },
                Replies = d.Replies.Select(r => new {
                    r.Id,
                    r.Content,
                    r.CreatedAt,
                    User = new { r.User!.FullName, r.User.AvatarUrl }
                })
            })
            .ToListAsync();

        return Ok(discussions);
    }

    [HttpPost]
    public async Task<IActionResult> PostDiscussion([FromBody] PostDiscussionDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var discussion = new CourseDiscussion
        {
            CourseId = dto.CourseId,
            LessonId = dto.LessonId,
            UserId = userId,
            Content = dto.Content,
            ParentId = dto.ParentId,
            CreatedAt = DateTime.UtcNow
        };

        _context.CourseDiscussions.Add(discussion);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Đã gửi ý kiến!" });
    }
}

public record PostDiscussionDto(int CourseId, int? LessonId, string Content, int? ParentId = null);

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NoteController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public NoteController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("{courseId}/{lessonId}")]
    public async Task<IActionResult> GetNote(int courseId, int lessonId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var note = await _context.UserNotes
            .FirstOrDefaultAsync(n => n.UserId == userId && n.CourseId == courseId && n.LessonId == lessonId);

        if (note == null) return Ok(new { Content = "" });

        return Ok(new { note.Id, note.Content, note.LastUpdatedAt });
    }

    [HttpPost]
    public async Task<IActionResult> SaveNote([FromBody] SaveNoteDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var note = await _context.UserNotes
            .FirstOrDefaultAsync(n => n.UserId == userId && n.CourseId == dto.CourseId && n.LessonId == dto.LessonId);

        if (note == null)
        {
            note = new UserNote
            {
                UserId = userId,
                CourseId = dto.CourseId,
                LessonId = dto.LessonId,
                Content = dto.Content,
                CreatedAt = DateTime.UtcNow,
                LastUpdatedAt = DateTime.UtcNow
            };
            _context.UserNotes.Add(note);
        }
        else
        {
            note.Content = dto.Content;
            note.LastUpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok(new { Message = "Đã lưu ghi chú!" });
    }
}

public record SaveNoteDto(int CourseId, int LessonId, string Content);
