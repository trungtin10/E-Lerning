namespace ELearning.Api.DTOs;

public record LoginDto(string Account, string Password);

public record ForgotPasswordDto(string Email);

public record ResetPasswordDto(string UserId, string Token, string NewPassword);

public record AuthResponseDto(
    string Token,
    string FullName,
    string Account,
    List<string> Roles,
    int? CompanyId,
    string? CompanyLogoUrl = null,
    string? Email = null,
    string? PhoneNumber = null,
    string? SubDomain = null,
    string? CompanyName = null
);

public record UserProfileDto(
    string FullName,
    string UserName,
    string? Email,
    string? PhoneNumber,
    List<string> Roles,
    int? CompanyId,
    string? CompanyName,
    string? SubDomain,
    string? CompanyLogoUrl,
    string? JobTitle
);

public record UpdateMyProfileDto(
    string FullName,
    string? PhoneNumber,
    string? JobTitle
);

public record RegisterDto(
    string Account,
    string Password,
    string FullName,
    int? CompanyId = null
);

public record ChangePasswordDto(
    string CurrentPassword,
    string NewPassword
);

public record ExternalLoginDto(
    string IdToken,
    string Provider // 'GOOGLE' or 'MICROSOFT'
);

public record CategoryDto(int Id, string Name, string? Description, int? CompanyId = null);
