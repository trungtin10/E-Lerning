namespace ELearning.Api.DTOs;

public record UserSummaryDto(
    string Id,
    string FullName,
    string Account,
    string? Role,
    string? CompanyName,
    string? SubDomain,
    bool IsActive,
    bool EmailConfirmed,
    bool IsExpired = false
);

public record UserDetailDto(
    string Id,
    string FullName,
    string Account,
    string Email,
    string? Role,
    string? CompanyName,
    string? JobTitle,
    string? AvatarUrl,
    bool IsActive,
    DateTime CreatedAt
);

public record UpdateUserDto(
    string FullName,
    string? Role,
    bool IsActive
);
