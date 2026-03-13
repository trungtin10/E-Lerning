namespace ELearning.Api.DTOs;

public record CreateCompanyDto(
    string CompanyName,
    string? SubDomain,
    string? LogoUrl,
    string? CustomDomain,
    string? ServicePlan,
    int? MaxUsers
);

public record CompanyDto(
    int Id,
    string CompanyName,
    string? SubDomain,
    string? LogoUrl,
    string? CustomDomain,
    string? ServicePlan,
    string? ContactEmail,
    bool IsActive,
    int UserCount,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record RegisterTenantDto(
    string CompanyName,
    string SubDomain,
    string? ContactEmail,
    string? LogoUrl,
    string? ServicePlan,
    string Account,
    string Password
);

// DTO cho thống kê Dashboard
public record DashboardStatsDto(
    int TotalCompanies,
    int ActiveCompanies,
    int TotalUsers,
    int TotalCourses,
    int PendingActivations,
    List<RecentActivityDto> RecentActivities
);

public record RecentActivityDto(
    string Title,
    string Description,
    DateTime Time,
    string Type // 'Company', 'User', 'Course'
);

public class CreateUserBySuperAdminDto
{
    public string Account { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public int? CompanyId { get; set; }
    public string Password { get; set; } = null!;
    public string Role { get; set; } = null!;
}

public class RegisterTenantFormDto
{
    public string CompanyName { get; set; } = null!;
    public string SubDomain { get; set; } = null!;
    public string? ContactEmail { get; set; }
    public IFormFile? LogoFile { get; set; }
    public string? ServicePlan { get; set; }
    public string Account { get; set; } = null!;
    public string Password { get; set; } = null!;
}

public class CreateCompanyAdminDto
{
    public int CompanyId { get; set; }
    public string Account { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Password { get; set; } = null!;
}

public class UpdateCompanyFormDto
{
    public string CompanyName { get; set; } = null!;
    public string SubDomain { get; set; } = null!;
    public string? ContactEmail { get; set; }
    public string? ServicePlan { get; set; }
    public IFormFile? LogoFile { get; set; }
}

public class CreateUserByAdminDto
{
    public string Account { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Role { get; set; } = "Student";
}

