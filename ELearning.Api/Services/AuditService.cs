using ELearning.Api.Data;
using ELearning.Api.Models;
using Microsoft.AspNetCore.Http;

namespace ELearning.Api.Services;

public interface IAuditService
{
    Task LogAsync(string action, string? entityType, string? entityId, string? oldValue, string? newValue, string? details = null, string? userIdOverride = null, string? userNameOverride = null);
}

public class AuditService : IAuditService
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContext;
    private readonly string? _userId;
    private readonly string? _userName;

    public AuditService(ApplicationDbContext context, IHttpContextAccessor httpContext)
    {
        _context = context;
        _httpContext = httpContext;
        _userId = httpContext.HttpContext?.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        _userName = httpContext.HttpContext?.User?.Identity?.Name;
    }

    public async Task LogAsync(string action, string? entityType, string? entityId, string? oldValue, string? newValue, string? details = null, string? userIdOverride = null, string? userNameOverride = null)
    {
        try
        {
            var ip = _httpContext.HttpContext?.Connection?.RemoteIpAddress?.ToString();
            var log = new AuditLog
            {
                UserId = userIdOverride ?? _userId,
                UserName = userNameOverride ?? _userName,
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                OldValue = oldValue?.Length > 2000 ? oldValue[..2000] : oldValue,
                NewValue = newValue?.Length > 2000 ? newValue[..2000] : newValue,
                IpAddress = ip,
                Details = details,
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(log);
            await _context.SaveChangesAsync();
        }
        catch
        {
            // Không làm gián đoạn luồng nghiệp vụ chính nếu bảng audit bị lệch schema.
        }
    }
}
