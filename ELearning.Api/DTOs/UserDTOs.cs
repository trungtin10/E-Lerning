namespace ELearning.Api.DTOs;

/// <summary>Dùng class (không phải positional record) để System.Text.Json luôn xuất đúng tên thuộc tính camelCase, ví dụ <c>email</c>.</summary>
public class UserSummaryDto
{
    public string Id { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Account { get; set; } = null!;
    public string? Email { get; set; }
    public string? Role { get; set; }
    public string? CompanyName { get; set; }
    public string? SubDomain { get; set; }
    public bool IsActive { get; set; }
    public bool EmailConfirmed { get; set; }
    public bool IsExpired { get; set; }
    public string Status { get; set; } = string.Empty;
}

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

public class SetUserActiveDto
{
    public bool IsActive { get; set; }
}
