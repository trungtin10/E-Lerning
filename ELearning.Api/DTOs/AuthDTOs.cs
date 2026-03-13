namespace ELearning.Api.DTOs;

public record LoginDto(string Account, string Password);

public record AuthResponseDto(
    string Token,
    string FullName,
    string Account,
    List<string> Roles,
    int? CompanyId
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
