using ELearning.Api.Data;
using ELearning.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ELearning.Api.Services;

public interface INotificationService
{
    Task NotifyUsersAsync(IEnumerable<string> userIds, string title, string? content, string type = "System", string severity = "Info", string? linkUrl = null, string? payloadJson = null);
    Task NotifyByTargetAsync(int? companyId, IEnumerable<string>? roles, string title, string? content, string type = "System", string severity = "Info", string? linkUrl = null, string? payloadJson = null);
}

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;

    public NotificationService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task NotifyUsersAsync(IEnumerable<string> userIds, string title, string? content, string type = "System", string severity = "Info", string? linkUrl = null, string? payloadJson = null)
    {
        var ids = userIds?.Where(x => !string.IsNullOrWhiteSpace(x)).Distinct().ToList() ?? new List<string>();
        if (ids.Count == 0) return;

        var now = DateTime.UtcNow;
        var entities = ids.Select(uid => new UserNotification
        {
            UserId = uid,
            Title = title,
            Content = content,
            Type = type,
            Severity = severity,
            LinkUrl = linkUrl,
            PayloadJson = payloadJson,
            CreatedAt = now
        }).ToList();

        _context.UserNotifications.AddRange(entities);
        await _context.SaveChangesAsync();
    }

    public async Task NotifyByTargetAsync(int? companyId, IEnumerable<string>? roles, string title, string? content, string type = "System", string severity = "Info", string? linkUrl = null, string? payloadJson = null)
    {
        var roleList = roles?.Where(r => !string.IsNullOrWhiteSpace(r)).Distinct(StringComparer.OrdinalIgnoreCase).ToList() ?? new List<string>();

        var userQuery = _context.Users.AsNoTracking().AsQueryable();
        if (companyId.HasValue) userQuery = userQuery.Where(u => u.CompanyId == companyId.Value);

        // Filter roles via AspNetUserRoles join (Identity)
        if (roleList.Count > 0)
        {
            var roleIds = await _context.Roles
                .Where(r => r.Name != null && roleList.Contains(r.Name))
                .Select(r => r.Id)
                .ToListAsync();

            if (roleIds.Count > 0)
            {
                var allowedUserIds = await _context.UserRoles
                    .Where(ur => roleIds.Contains(ur.RoleId))
                    .Select(ur => ur.UserId)
                    .Distinct()
                    .ToListAsync();

                userQuery = userQuery.Where(u => allowedUserIds.Contains(u.Id));
            }
            else
            {
                return;
            }
        }

        var userIds = await userQuery.Select(u => u.Id).ToListAsync();
        await NotifyUsersAsync(userIds, title, content, type, severity, linkUrl, payloadJson);
    }
}

