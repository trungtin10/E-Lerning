using ELearning.Api.Data;
using ELearning.Api.DTOs;
using ELearning.Api.Models;
using ELearning.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ELearning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class TransactionController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _audit;

    public TransactionController(ApplicationDbContext context, IAuditService audit)
    {
        _context = context;
        _audit = audit;
    }

    private async Task<int?> GetUserCompanyIdAsync()
    {
        var claim = User.FindFirst("CompanyId")?.Value
            ?? User.FindFirst(c => string.Equals(c.Type, "CompanyId", StringComparison.OrdinalIgnoreCase))?.Value;
        if (int.TryParse(claim, out int cid)) return cid;
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            return user?.CompanyId;
        }
        return null;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TransactionDto>>> GetAll([FromQuery] int? companyId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var isSuperAdmin = User.IsInRole("SuperAdmin");
        int? effectiveCompanyId = null;
        if (!isSuperAdmin)
        {
            effectiveCompanyId = await GetUserCompanyIdAsync();
            if (!effectiveCompanyId.HasValue || effectiveCompanyId.Value <= 0)
                return Ok(new { items = new List<TransactionDto>(), total = 0, page, pageSize });
        }
        else if (companyId.HasValue && companyId.Value > 0)
        {
            effectiveCompanyId = companyId;
        }

        var query = _context.Transactions
            .Include(t => t.Company)
            .Include(t => t.ServicePlan)
            .AsNoTracking()
            .AsQueryable();

        if (effectiveCompanyId.HasValue) query = query.Where(t => t.CompanyId == effectiveCompanyId.Value);
        var total = await query.CountAsync();
        var list = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new TransactionDto(t.Id, t.CompanyId, t.Company!.CompanyName, t.ServicePlanId, t.ServicePlan!.Name, t.Amount, t.Currency, t.Status, t.PaymentDate, t.PlanExpiresAt, t.BillingCycleMonths, t.CreatedAt))
            .ToListAsync();
        return Ok(new { items = list, total, page, pageSize });
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<TransactionDto>> Create([FromBody] CreateTransactionDto dto)
    {
        var company = await _context.Companies.FindAsync(dto.CompanyId);
        var plan = await _context.ServicePlans.FindAsync(dto.ServicePlanId);
        if (company == null || plan == null) return BadRequest("Công ty hoặc gói dịch vụ không tồn tại.");
        var expiresAt = DateTime.UtcNow.AddMonths(dto.BillingCycleMonths);
        var tx = new Transaction
        {
            CompanyId = dto.CompanyId,
            ServicePlanId = dto.ServicePlanId,
            Amount = dto.Amount,
            Currency = dto.Currency ?? "VND",
            Status = "Completed",
            PaymentGateway = dto.PaymentGateway,
            TransactionRef = dto.TransactionRef,
            PaymentDate = DateTime.UtcNow,
            PlanExpiresAt = expiresAt,
            BillingCycleMonths = dto.BillingCycleMonths,
            Notes = dto.Notes
        };
        _context.Transactions.Add(tx);
        company.ServicePlanId = dto.ServicePlanId;
        company.ServicePlan = plan.Name;
        company.PlanExpiresAt = expiresAt;
        company.MaxUsers = plan.MaxUsers;
        company.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await _audit.LogAsync("Create", "Transaction", tx.Id.ToString(), null, $"Company {company.CompanyName} gia hạn gói {plan.Name}");
        return Ok(new TransactionDto(tx.Id, tx.CompanyId, company.CompanyName, tx.ServicePlanId, plan.Name, tx.Amount, tx.Currency, tx.Status, tx.PaymentDate, tx.PlanExpiresAt, tx.BillingCycleMonths, tx.CreatedAt));
    }
}
