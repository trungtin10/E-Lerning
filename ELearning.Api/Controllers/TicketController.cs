using ELearning.Api.Data;
using ELearning.Api.DTOs;
using ELearning.Api.Models;
using ELearning.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ELearning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TicketController : BaseApiController
{
    private const long MaxImageBytes = 8 * 1024 * 1024;
    private const long MaxFileBytes = 20 * 1024 * 1024;
    private static readonly HashSet<string> AllowedImageContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/gif", "image/webp"
    };
    private static readonly HashSet<string> AllowedFileContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        // documents
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        // archives
        "application/zip",
        "application/x-zip-compressed",
        "application/x-rar-compressed",
        "application/octet-stream" // fallback for some browsers (validated by extension)
    };

    private static readonly HashSet<string> AllowedFileExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp",
        ".pdf", ".txt", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
        ".zip", ".rar"
    };
    private readonly IAuditService _audit;
    private readonly IWebHostEnvironment _env;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly INotificationService _notification;
    private readonly IEmailService _email;
    private readonly IFileUploadService _fileUpload;

    public TicketController(
        ApplicationDbContext context,
        IAuditService audit,
        IWebHostEnvironment env,
        UserManager<ApplicationUser> userManager,
        INotificationService notification,
        IEmailService email,
        IFileUploadService fileUpload,
        IConfiguration config)
        : base(context, config)
    {
        _audit = audit;
        _env = env;
        _userManager = userManager;
        _notification = notification;
        _email = email;
        _fileUpload = fileUpload;
    }



    private async Task<bool> CanAccessTicketAsync(SupportTicket ticket, string userId)
    {
        if (User.IsInRole("SuperAdmin")) return true;
        if (!User.IsInRole("Admin") && !User.IsInRole("Editor")) return false;
        var companyId = await GetUserCompanyIdAsync() ?? 0;
        return companyId > 0 && ticket.CompanyId == companyId;
    }

    private async Task<List<string>> SaveTicketAttachmentsAsync(IFormFileCollection files, int companyId)
    {
        var urls = new List<string>();
        if (files == null || files.Count == 0) return urls;
        
        var count = 0;
        foreach (var file in files)
        {
            if (file.Length == 0) continue;
            if (count >= 8) break;
            
            var contentType = file.ContentType ?? "";
            var ext = Path.GetExtension(file.FileName) ?? "";
            
            if (!AllowedFileExtensions.Contains(ext))
                throw new InvalidOperationException($"File không hợp lệ (chỉ nhận ảnh/pdf/doc/xls/ppt/txt/zip/rar): {file.FileName}");

            var isImage = AllowedImageContentTypes.Contains(contentType);

            if (isImage)
            {
                if (file.Length > MaxImageBytes) throw new InvalidOperationException($"Ảnh vượt quá {MaxImageBytes / 1024 / 1024}MB: {file.FileName}");
            }
            else
            {
                if (file.Length > MaxFileBytes) throw new InvalidOperationException($"File vượt quá {MaxFileBytes / 1024 / 1024}MB: {file.FileName}");
            }

            var url = await _fileUpload.SaveFileAsync(file, companyId, "tickets");
            urls.Add(url);
            count++;
        }

        return urls;
    }

    private static async Task<string> GetRoleLabelAsync(UserManager<ApplicationUser> userManager, ApplicationUser user)
    {
        var roles = await userManager.GetRolesAsync(user);
        if (roles.Contains("SuperAdmin")) return "SuperAdmin";
        if (roles.Contains("Admin")) return "Admin";
        return roles.FirstOrDefault() ?? "User";
    }

    /// <summary>EF/SQL trả về Unspecified; JSON không có 'Z' khiến JS hiểu nhầm múi giờ. App luôn lưu UTC.</summary>
    private static DateTime AsUtc(DateTime dt) =>
        dt.Kind == DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt, DateTimeKind.Utc);

    private static DateTime? AsUtc(DateTime? dt) =>
        dt.HasValue ? AsUtc(dt.Value) : null;

    /// <summary>
    /// User/Học viên: gửi yêu cầu hỗ trợ nhanh từ giao diện user (multipart).
    /// Dữ liệu sẽ được lưu thành ticket để SuperAdmin xử lý.
    /// </summary>
    [HttpPost("contact")]
    [Authorize]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<object>> Contact(
        [FromForm] string? fullName,
        [FromForm] string? email,
        [FromForm] string message)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await _context.Users.Include(u => u.Company).FirstOrDefaultAsync(u => u.Id == userId);
        if (user?.CompanyId == null || user.Company == null) return BadRequest("Thiếu thông tin công ty.");
        if (string.IsNullOrWhiteSpace(message)) return BadRequest("Nội dung liên hệ là bắt buộc.");

        List<string> attachmentUrls;
        try
        {
            attachmentUrls = await SaveTicketAttachmentsAsync(Request.Form.Files, user.CompanyId.Value);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }

        var now = DateTime.UtcNow;
        var displayName = string.IsNullOrWhiteSpace(fullName)
            ? (user.FullName ?? user.UserName ?? userId)
            : fullName.Trim();
        var displayEmail = string.IsNullOrWhiteSpace(email) ? (user.Email ?? "") : email.Trim();

        var subject = $"Yêu cầu hỗ trợ - {displayName}";
        var body = $"Họ tên: {displayName}\nEmail: {displayEmail}\n\n{message.Trim()}";

        var ticket = new SupportTicket
        {
            CompanyId = user.CompanyId.Value,
            UserId = userId,
            Subject = subject,
            Content = body,
            Priority = "Normal",
            Status = "Open",
            CreatedAt = now,
            UpdatedAt = now,
            LastActivityAt = now
        };
        _context.SupportTickets.Add(ticket);
        await _context.SaveChangesAsync();

        var post = new SupportTicketPost
        {
            SupportTicketId = ticket.Id,
            UserId = userId,
            Body = body,
            CreatedAt = now
        };
        _context.SupportTicketPosts.Add(post);
        await _context.SaveChangesAsync();

        foreach (var url in attachmentUrls)
            _context.SupportTicketAttachments.Add(new SupportTicketAttachment { SupportTicketPostId = post.Id, FileUrl = url });
        await _context.SaveChangesAsync();

        var superIds = await _userManager.GetUsersInRoleAsync("SuperAdmin");
        var superUserIds = superIds.Select(u => u.Id).ToList();
        if (superUserIds.Count > 0)
        {
            await _notification.NotifyUsersAsync(
                superUserIds,
                $"Ticket mới: {ticket.Subject}",
                $"{user.Company.CompanyName} vừa gửi yêu cầu hỗ trợ.",
                "Ticket",
                "Info",
                "/admin/tickets/" + ticket.Id);

            foreach (var super in superIds)
            {
                if (!string.IsNullOrEmpty(super.Email))
                {
                    await _email.SendTicketNotificationAsync(super.Email, $"Yêu cầu hỗ trợ từ {user.Company.CompanyName}", body, ticket.Id.ToString(), ticket.Subject);
                }
            }
        }

        // --- GỬI THÔNG BÁO CHO ADMIN CÔNG TY ---
        var companyAdmins = (await _userManager.GetUsersInRoleAsync("Admin"))
            .Concat(await _userManager.GetUsersInRoleAsync("Editor"))
            .Where(u => u.CompanyId == user.CompanyId && u.IsActive)
            .DistinctBy(u => u.Id)
            .ToList();

        if (companyAdmins.Count > 0)
        {
            var adminUserIds = companyAdmins.Select(u => u.Id).ToList();
            await _notification.NotifyUsersAsync(
                adminUserIds,
                $"Học viên gửi hỗ trợ: {ticket.Subject}",
                $"Học viên {displayName} thuộc công ty bạn vừa yêu cầu hỗ trợ mới.",
                "Ticket",
                "Info",
                "/admin/tickets/" + ticket.Id);

            foreach (var admin in companyAdmins)
            {
                if (!string.IsNullOrEmpty(admin.Email))
                {
                    await _email.SendTicketNotificationAsync(admin.Email, $"Học viên gửi hỗ trợ: {ticket.Subject}", body, ticket.Id.ToString(), ticket.Subject);
                }
            }
        }

        await _audit.LogAsync("Create", "SupportTicket", ticket.Id.ToString(), null, ticket.Subject, "User gửi yêu cầu hỗ trợ");

        return Ok(new { id = ticket.Id });
    }

    private async Task<SupportTicketThreadDto> MapThreadAsync(SupportTicket ticket)
    {
        var author = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == ticket.UserId);
        var createdByName = author?.FullName ?? author?.UserName ?? ticket.UserId;
        var posts = ticket.Posts.OrderBy(p => p.CreatedAt).ToList();
        var postDtos = new List<SupportTicketPostDto>();
        foreach (var p in posts)
        {
            var u = await _context.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == p.UserId);
            var name = u?.FullName ?? u?.UserName ?? p.UserId;
            var role = u != null ? await GetRoleLabelAsync(_userManager, u) : "User";
            var urls = p.Attachments.OrderBy(a => a.Id).Select(a => a.FileUrl).ToList();
            postDtos.Add(new SupportTicketPostDto(p.Id, p.UserId, name, role, p.Body, AsUtc(p.CreatedAt), urls));
        }

        if (postDtos.Count == 0)
        {
            postDtos.Add(new SupportTicketPostDto(0, ticket.UserId, createdByName, "Admin", ticket.Content, AsUtc(ticket.CreatedAt), Array.Empty<string>()));
            if (!string.IsNullOrWhiteSpace(ticket.AdminReply))
            {
                var replier = ticket.RepliedByUserId != null
                    ? await _context.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == ticket.RepliedByUserId)
                    : null;
                var rn = replier?.FullName ?? replier?.UserName ?? "SuperAdmin";
                var rr = replier != null ? await GetRoleLabelAsync(_userManager, replier) : "SuperAdmin";
                var replyAt = AsUtc(ticket.RepliedAt ?? ticket.UpdatedAt);
                postDtos.Add(new SupportTicketPostDto(0, ticket.RepliedByUserId ?? "", rn, rr, ticket.AdminReply!, replyAt, Array.Empty<string>()));
            }
        }

        return new SupportTicketThreadDto(
            ticket.Id,
            ticket.CompanyId,
            ticket.Company.CompanyName,
            ticket.UserId,
            createdByName,
            ticket.Subject,
            ticket.Status,
            ticket.Priority,
            AsUtc(ticket.CreatedAt),
            AsUtc(ticket.LastActivityAt),
            postDtos);
    }

    /// <summary>Admin công ty: tạo ticket kèm ảnh (multipart).</summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Editor")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<SupportTicketListItemDto>> Create(
        [FromForm] string subject,
        [FromForm] string content,
        [FromForm] string priority = "Normal")
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var user = await _context.Users.Include(u => u.Company).FirstOrDefaultAsync(u => u.Id == userId);
        if (user?.CompanyId == null || user.Company == null) return BadRequest("Chỉ Admin công ty mới có thể tạo ticket.");
        if (string.IsNullOrWhiteSpace(subject) || string.IsNullOrWhiteSpace(content))
            return BadRequest("Tiêu đề và nội dung là bắt buộc.");

        List<string> attachmentUrls;
        try
        {
            attachmentUrls = await SaveTicketAttachmentsAsync(Request.Form.Files, user.CompanyId.Value);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }

        var now = DateTime.UtcNow;
        var ticket = new SupportTicket
        {
            CompanyId = user.CompanyId.Value,
            UserId = userId,
            Subject = subject.Trim(),
            Content = content.Trim(),
            Priority = string.IsNullOrWhiteSpace(priority) ? "Normal" : priority.Trim(),
            Status = "Open",
            CreatedAt = now,
            UpdatedAt = now,
            LastActivityAt = now
        };
        _context.SupportTickets.Add(ticket);
        await _context.SaveChangesAsync();

        var post = new SupportTicketPost
        {
            SupportTicketId = ticket.Id,
            UserId = userId,
            Body = content.Trim(),
            CreatedAt = now
        };
        _context.SupportTicketPosts.Add(post);
        await _context.SaveChangesAsync();

        foreach (var url in attachmentUrls)
        {
            _context.SupportTicketAttachments.Add(new SupportTicketAttachment { SupportTicketPostId = post.Id, FileUrl = url });
        }
        await _context.SaveChangesAsync();

        var superIds = await _userManager.GetUsersInRoleAsync("SuperAdmin");
        var superUserIds = superIds.Select(u => u.Id).ToList();
        if (superUserIds.Count > 0)
        {
            await _notification.NotifyUsersAsync(
                superUserIds,
                $"Ticket mới: {ticket.Subject}",
                $"{user.Company.CompanyName} vừa gửi yêu cầu hỗ trợ.",
                "Ticket",
                "Info",
                "/admin/tickets/" + ticket.Id);

            foreach (var super in superIds)
            {
                if (!string.IsNullOrEmpty(super.Email))
                {
                    await _email.SendTicketNotificationAsync(super.Email, $"Ticket mới: {ticket.Subject}", content, ticket.Id.ToString(), ticket.Subject);
                }
            }
        }

        await _audit.LogAsync("Create", "SupportTicket", ticket.Id.ToString(), null, ticket.Subject, "Tạo ticket hỗ trợ (diễn đàn)");

        var count = await _context.SupportTicketPosts.CountAsync(p => p.SupportTicketId == ticket.Id);
        return Ok(new SupportTicketListItemDto(
            ticket.Id,
            ticket.CompanyId,
            user.Company.CompanyName,
            ticket.UserId,
            user.FullName ?? user.UserName ?? userId,
            ticket.Subject,
            ticket.Status,
            ticket.Priority,
            AsUtc(ticket.CreatedAt),
            AsUtc(ticket.LastActivityAt),
            count));
    }

    /// <summary>Admin công ty: mọi ticket của công ty. SuperAdmin không dùng endpoint này.</summary>
    [HttpGet("my")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<ActionResult<IEnumerable<SupportTicketListItemDto>>> GetCompanyTickets()
    {
        var companyId = await GetUserCompanyIdAsync() ?? 0;
        if (companyId <= 0) return BadRequest("Thiếu thông tin công ty.");

        var tickets = await _context.SupportTickets
            .AsNoTracking()
            .Include(t => t.Company)
            .Include(t => t.Author)
            .Where(t => t.CompanyId == companyId)
            .OrderByDescending(t => t.LastActivityAt)
            .ToListAsync();

        var ids = tickets.Select(t => t.Id).ToList();
        var counts = await _context.SupportTicketPosts
            .AsNoTracking()
            .Where(p => ids.Contains(p.SupportTicketId))
            .GroupBy(p => p.SupportTicketId)
            .Select(g => new { Id = g.Key, C = g.Count() })
            .ToDictionaryAsync(x => x.Id, x => x.C);

        var list = tickets.Select(t => new SupportTicketListItemDto(
            t.Id,
            t.CompanyId,
            t.Company!.CompanyName,
            t.UserId,
            t.Author?.FullName ?? t.Author?.UserName ?? t.UserId,
            t.Subject,
            t.Status,
            t.Priority,
            AsUtc(t.CreatedAt),
            AsUtc(t.LastActivityAt),
            counts.GetValueOrDefault(t.Id, 0))).ToList();

        return Ok(list);
    }

    [HttpGet]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<object>> GetAll([FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _context.SupportTickets.AsNoTracking().Include(t => t.Company).Include(t => t.Author).AsQueryable();
        if (!string.IsNullOrEmpty(status)) query = query.Where(t => t.Status == status);
        var total = await query.CountAsync();
        var tickets = await query
            .OrderByDescending(t => t.LastActivityAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var ids = tickets.Select(t => t.Id).ToList();
        var counts = await _context.SupportTicketPosts
            .AsNoTracking()
            .Where(p => ids.Contains(p.SupportTicketId))
            .GroupBy(p => p.SupportTicketId)
            .Select(g => new { Id = g.Key, C = g.Count() })
            .ToDictionaryAsync(x => x.Id, x => x.C);

        var list = tickets.Select(t => new SupportTicketListItemDto(
            t.Id,
            t.CompanyId,
            t.Company!.CompanyName,
            t.UserId,
            t.Author?.FullName ?? t.Author?.UserName ?? t.UserId,
            t.Subject,
            t.Status,
            t.Priority,
            AsUtc(t.CreatedAt),
            AsUtc(t.LastActivityAt),
            counts.GetValueOrDefault(t.Id, 0))).ToList();

        return Ok(new { items = list, total, page, pageSize });
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin,Editor")]
    public async Task<ActionResult<SupportTicketThreadDto>> GetThread(int id)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var ticket = await _context.SupportTickets
            .Include(t => t.Company)
            .Include(t => t.Posts).ThenInclude(p => p.Attachments)
            .FirstOrDefaultAsync(t => t.Id == id);
        if (ticket == null) return NotFound();
        if (!await CanAccessTicketAsync(ticket, userId)) return Forbid();

        return Ok(await MapThreadAsync(ticket));
    }

    /// <summary>Thêm bài trong luồng (Admin công ty hoặc SuperAdmin), có thể đính kèm ảnh.</summary>
    [HttpPost("{id:int}/posts")]
    [Authorize(Roles = "SuperAdmin,Admin,Editor")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<SupportTicketThreadDto>> AddPost(
        int id,
        [FromForm] string body,
        [FromForm] string? status = null)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var ticket = await _context.SupportTickets
            .Include(t => t.Company)
            .Include(t => t.Posts).ThenInclude(p => p.Attachments)
            .FirstOrDefaultAsync(t => t.Id == id);
        if (ticket == null) return NotFound();
        if (!await CanAccessTicketAsync(ticket, userId)) return Forbid();

        var bodyText = body?.Trim() ?? "";
        List<string> attachmentUrls;
        try
        {
            attachmentUrls = await SaveTicketAttachmentsAsync(Request.Form.Files, ticket.CompanyId);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }

        if (string.IsNullOrEmpty(bodyText) && attachmentUrls.Count == 0)
            return BadRequest("Nhập nội dung hoặc đính kèm ít nhất một tệp.");

        var isSuper = User.IsInRole("SuperAdmin");
        var canChangeStatus = isSuper || User.IsInRole("Admin") || User.IsInRole("Editor");
        if (!string.IsNullOrWhiteSpace(status) && canChangeStatus)
        {
            var s = status!.Trim();
            if (s is "Open" or "InProgress" or "Resolved" or "Closed")
                ticket.Status = s;
        }
        else if (isSuper && ticket.Status == "Open")
            ticket.Status = "InProgress";

        var now = DateTime.UtcNow;
        var post = new SupportTicketPost
        {
            SupportTicketId = ticket.Id,
            UserId = userId,
            Body = string.IsNullOrEmpty(bodyText) ? "(Đính kèm ảnh)" : bodyText,
            CreatedAt = now
        };
        _context.SupportTicketPosts.Add(post);
        ticket.UpdatedAt = now;
        ticket.LastActivityAt = now;

        if (isSuper)
        {
            ticket.AdminReply = post.Body.Length > 500 ? post.Body[..500] : post.Body;
            ticket.RepliedByUserId = userId;
            ticket.RepliedAt = now;
        }

        await _context.SaveChangesAsync();

        foreach (var url in attachmentUrls)
        {
            _context.SupportTicketAttachments.Add(new SupportTicketAttachment { SupportTicketPostId = post.Id, FileUrl = url });
        }
        await _context.SaveChangesAsync();

        await _audit.LogAsync("Reply", "SupportTicket", id.ToString(), null, ticket.Subject, "Trả lời ticket (diễn đàn)");

        if (isSuper)
        {
            await _notification.NotifyByTargetAsync(
                ticket.CompanyId,
                new[] { "Admin" },
                $"Phản hồi ticket: {ticket.Subject}",
                post.Body.Length > 200 ? post.Body[..200] + "…" : post.Body,
                "Ticket",
                "Info",
                "/admin/tickets/" + ticket.Id);

            var originalAuthor = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == ticket.UserId);
            if (originalAuthor != null && !string.IsNullOrEmpty(originalAuthor.Email))
            {
                await _email.SendTicketNotificationAsync(originalAuthor.Email, $"Phản hồi từ Ban Quản Trị: {ticket.Subject}", post.Body, ticket.Id.ToString(), ticket.Subject);
            }
        }
        else
        {
            var superUsers = await _userManager.GetUsersInRoleAsync("SuperAdmin");
            var superUserIds = superUsers.Select(u => u.Id).ToList();
            if (superUserIds.Count > 0)
            {
                await _notification.NotifyUsersAsync(
                    superUserIds,
                    $"Cập nhật ticket: {ticket.Subject}",
                    $"{ticket.Company.CompanyName}: {(post.Body.Length > 200 ? post.Body[..200] + "…" : post.Body)}",
                    "Ticket",
                    "Info",
                    "/admin/tickets/" + ticket.Id);

                foreach (var super in superUsers)
                {
                    if (!string.IsNullOrEmpty(super.Email))
                    {
                        await _email.SendTicketNotificationAsync(super.Email, $"Cập nhật Ticket: {ticket.Subject}", post.Body, ticket.Id.ToString(), ticket.Subject);
                    }
                }
            }
        }

        var refreshed = await _context.SupportTickets
            .Include(t => t.Company)
            .Include(t => t.Posts).ThenInclude(p => p.Attachments)
            .FirstAsync(t => t.Id == id);
        return Ok(await MapThreadAsync(refreshed));
    }

    [HttpPut("{id:int}/reply")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<SupportTicketThreadDto>> ReplyLegacy(int id, [FromBody] ReplyTicketDto dto)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var ticket = await _context.SupportTickets
            .Include(t => t.Company)
            .Include(t => t.Posts).ThenInclude(p => p.Attachments)
            .FirstOrDefaultAsync(t => t.Id == id);
        if (ticket == null) return NotFound();

        var now = DateTime.UtcNow;
        ticket.AdminReply = dto.Reply;
        ticket.RepliedByUserId = userId;
        ticket.RepliedAt = now;
        ticket.Status = "Resolved";
        ticket.UpdatedAt = now;
        ticket.LastActivityAt = now;

        _context.SupportTicketPosts.Add(new SupportTicketPost
        {
            SupportTicketId = ticket.Id,
            UserId = userId,
            Body = dto.Reply,
            CreatedAt = now
        });
        await _context.SaveChangesAsync();

        await _audit.LogAsync("Reply", "SupportTicket", id.ToString(), null, ticket.Subject, "Phản hồi ticket hỗ trợ (legacy)");
        await _notification.NotifyByTargetAsync(
            ticket.CompanyId,
            new[] { "Admin" },
            $"Ticket đã được trả lời: {ticket.Subject}",
            dto.Reply.Length > 200 ? dto.Reply[..200] + "…" : dto.Reply,
            "Ticket",
            "Info",
            "/admin/tickets/" + ticket.Id);

        var refreshed = await _context.SupportTickets
            .Include(t => t.Company)
            .Include(t => t.Posts).ThenInclude(p => p.Attachments)
            .FirstAsync(t => t.Id == id);
        return Ok(await MapThreadAsync(refreshed));
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "SuperAdmin,Admin,Editor")]
    public async Task<ActionResult<SupportTicketListItemDto>> SetStatus(int id, [FromBody] TicketStatusPatchDto dto)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var ticket = await _context.SupportTickets.Include(t => t.Company).Include(t => t.Author).FirstOrDefaultAsync(t => t.Id == id);
        if (ticket == null) return NotFound();
        
        if (!await CanAccessTicketAsync(ticket, userId)) return Forbid();

        var isSuper = User.IsInRole("SuperAdmin");
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Editor");
        var s = dto.Status?.Trim() ?? "";
        
        // Cả SuperAdmin và Admin công ty đều có quyền đổi trạng thái nếu có quyền truy cập ticket
        if (!isSuper && !isAdmin)
             return BadRequest("Bạn không có quyền thay đổi trạng thái yêu cầu hỗ trợ này.");

        if (s is not ("Open" or "InProgress" or "Resolved" or "Closed"))
            return BadRequest("Status không hợp lệ.");
        ticket.Status = s;
        ticket.UpdatedAt = DateTime.UtcNow;
        ticket.LastActivityAt = ticket.UpdatedAt;
        await _context.SaveChangesAsync();

        var count = await _context.SupportTicketPosts.CountAsync(p => p.SupportTicketId == ticket.Id);
        return Ok(new SupportTicketListItemDto(
            ticket.Id,
            ticket.CompanyId,
            ticket.Company!.CompanyName,
            ticket.UserId,
            ticket.Author?.FullName ?? ticket.Author?.UserName ?? ticket.UserId,
            ticket.Subject,
            ticket.Status,
            ticket.Priority,
            AsUtc(ticket.CreatedAt),
            AsUtc(ticket.LastActivityAt),
            count));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var ticket = await _context.SupportTickets.FirstOrDefaultAsync(t => t.Id == id);
        if (ticket == null) return NotFound();

        if (!await CanAccessTicketAsync(ticket, userId)) return Forbid();

        // Xoá các attachment của các post thuộc ticket
        var posts = await _context.SupportTicketPosts.Where(p => p.SupportTicketId == id).ToListAsync();
        foreach (var post in posts)
        {
            var attachments = await _context.SupportTicketAttachments.Where(a => a.SupportTicketPostId == post.Id).ToListAsync();
            _context.SupportTicketAttachments.RemoveRange(attachments);
        }

        _context.SupportTicketPosts.RemoveRange(posts);
        _context.SupportTickets.Remove(ticket);
        await _context.SaveChangesAsync();

        await _audit.LogAsync("Delete", "SupportTicket", id.ToString(), null, ticket.Subject, "Xoá ticket hỗ trợ");

        return Ok(new { Message = "Đã xoá ticket thành công." });
    }
}
