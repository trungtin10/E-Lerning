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
    int? ServicePlanId,
    DateTime? PlanExpiresAt,
    bool HasPaidSubscription,
    string? ContactEmail,
    bool IsActive,
    int UserCount,
    string? Status,
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

public record DashboardAnalyticsDto(
    List<GrowthPointDto> UserGrowthByMonth,
    List<GrowthPointDto> CompanyGrowthByMonth,
    List<TopCompanyDto> TopCompaniesByUsers,
    List<TopCompanyDto> TopCompaniesByStorage,
    List<CompanyStorageDto> StorageByCompany
);

public record GrowthPointDto(string Month, int Count);

public record TopCompanyDto(int CompanyId, string CompanyName, int Value);

public record CompanyStorageDto(int CompanyId, string CompanyName, long StorageUsedBytes, int StorageLimitGB);

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
    public int? ServicePlanId { get; set; }
    public string? ServicePlan { get; set; } // Tên gói (giữ để tương thích)
    public int ServicePlanDurationDays { get; set; } = 0; // Mặc định là 0 để phân biệt với gói dùng thử
    public int BillingCycleMonths { get; set; } = 1;
    public string? PaymentMethod { get; set; } // Cash, BankTransfer, VnPay, Direct
    public decimal? AmountPaid { get; set; }
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
    // Nếu set (3/7/30), cập nhật hạn dùng thử từ thời điểm hiện tại
    public int? TrialDays { get; set; }
    public IFormFile? LogoFile { get; set; }
    public bool? IsActive { get; set; }
}

public class CreateUserByAdminDto
{
    public string Account { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Role { get; set; } = "Student";
}

public class AdminUpdateUserDto
{
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? Role { get; set; }
}

public class CompanySubscriptionInfoDto
{
    public string? CurrentPlan { get; set; }
    public DateTime? PlanExpiryDate { get; set; }
    public int UserCount { get; set; }
    public int MaxUsers { get; set; }
    public List<CompanyTransactionDto> Transactions { get; set; } = new();
}

public class CompanyTransactionDto
{
    public int Id { get; set; }
    public string PlanName { get; set; } = null!;
    public decimal Amount { get; set; }
    public string Status { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public string? PaymentGateway { get; set; }
}
