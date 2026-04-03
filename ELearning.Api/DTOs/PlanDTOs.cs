namespace ELearning.Api.DTOs;

public record ServicePlanDto(
    int Id,
    string Name,
    string? Description,
    int MaxUsers,
    int StorageLimitGB,
    decimal PriceMonthly,
    decimal PriceYearly,
    bool IsActive,
    int SortOrder
);

public record CreateServicePlanDto(
    string Name,
    string? Description,
    int MaxUsers,
    int StorageLimitGB,
    decimal PriceMonthly,
    decimal PriceYearly,
    int SortOrder = 0
);

public record UpdateServicePlanDto(
    string? Name,
    string? Description,
    int? MaxUsers,
    int? StorageLimitGB,
    decimal? PriceMonthly,
    decimal? PriceYearly,
    bool? IsActive,
    int? SortOrder
);

public record TransactionDto(
    int Id,
    int CompanyId,
    string CompanyName,
    int ServicePlanId,
    string PlanName,
    decimal Amount,
    string Currency,
    string Status,
    string? PaymentGateway,
    string? Notes,
    DateTime? PaymentDate,
    DateTime? PlanExpiresAt,
    int BillingCycleMonths,
    DateTime CreatedAt
);

public record CreateTransactionDto(
    int CompanyId,
    int ServicePlanId,
    decimal Amount,
    string? Currency,
    int BillingCycleMonths,
    string? PaymentGateway,
    string? TransactionRef,
    string? Notes
);

public record AuditLogDto(
    long Id,
    string? UserId,
    string? UserName,
    string Action,
    string? EntityType,
    string? EntityId,
    string? OldValue,
    string? NewValue,
    string? IpAddress,
    string? Details,
    DateTime CreatedAt
);

/// <summary>Hàng trong danh sách ticket (diễn đàn).</summary>
public record SupportTicketListItemDto(
    int Id,
    int CompanyId,
    string CompanyName,
    string CreatedByUserId,
    string CreatedByName,
    string Subject,
    string Status,
    string Priority,
    DateTime CreatedAt,
    DateTime LastActivityAt,
    int PostCount
);

public record SupportTicketPostDto(
    int Id,
    string UserId,
    string AuthorName,
    string AuthorRole,
    string Body,
    DateTime CreatedAt,
    IReadOnlyList<string> AttachmentUrls
);

public record SupportTicketThreadDto(
    int Id,
    int CompanyId,
    string CompanyName,
    string CreatedByUserId,
    string CreatedByName,
    string Subject,
    string Status,
    string Priority,
    DateTime CreatedAt,
    DateTime LastActivityAt,
    IReadOnlyList<SupportTicketPostDto> Posts
);

public record CreateTicketDto(string Subject, string Content, string Priority = "Normal");

public record AnnouncementDto(
    int Id,
    string Title,
    string Content,
    string TargetType,
    string DisplayType,
    int? TargetCompanyId,
    string? TargetRoles,
    string Severity,
    int Priority,
    string? LinkUrl,
    DateTime StartAt,
    DateTime? EndAt,
    bool IsActive,
    DateTime CreatedAt,
    bool? IsDismissed = null,
    bool? IsAcknowledged = null
);

public record ReplyTicketDto(string Reply);

public record TicketStatusPatchDto(string Status);

public record CreateAnnouncementDto(
    string Title,
    string Content,
    string TargetType,
    string DisplayType,
    int? TargetCompanyId,
    string? TargetRoles,
    string Severity,
    int Priority,
    string? LinkUrl,
    DateTime StartAt,
    DateTime? EndAt
);
