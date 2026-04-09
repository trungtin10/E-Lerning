using ELearning.Api.Data;
using ELearning.Api.DTOs;
using ELearning.Api.Models;
using ELearning.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ELearning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PlanController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _audit;

    public PlanController(ApplicationDbContext context, IAuditService audit)
    {
        _context = context;
        _audit = audit;
    }

    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<IEnumerable<ServicePlanDto>>> GetAll()
    {
        var plans = await _context.ServicePlans
            .OrderBy(p => p.SortOrder)
            .Select(p => new ServicePlanDto(p.Id, p.Name, p.Description, p.MaxUsers, p.StorageLimitGB, p.PriceMonthly, p.PriceYearly, p.IsActive, p.SortOrder))
            .ToListAsync();
        return Ok(plans);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<ServicePlanDto>> GetById(int id)
    {
        var plan = await _context.ServicePlans.FindAsync(id);
        if (plan == null) return NotFound();
        return Ok(new ServicePlanDto(plan.Id, plan.Name, plan.Description, plan.MaxUsers, plan.StorageLimitGB, plan.PriceMonthly, plan.PriceYearly, plan.IsActive, plan.SortOrder));
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<ServicePlanDto>> Create([FromBody] CreateServicePlanDto dto)
    {
        var plan = new ServicePlan
        {
            Name = dto.Name,
            Description = dto.Description,
            MaxUsers = dto.MaxUsers,
            StorageLimitGB = dto.StorageLimitGB,
            PriceMonthly = dto.PriceMonthly,
            PriceYearly = dto.PriceYearly,
            SortOrder = dto.SortOrder,
            IsActive = true
        };
        _context.ServicePlans.Add(plan);
        await _context.SaveChangesAsync();
        await _audit.LogAsync("Create", "ServicePlan", plan.Id.ToString(), null, System.Text.Json.JsonSerializer.Serialize(plan));
        return CreatedAtAction(nameof(GetById), new { id = plan.Id }, new ServicePlanDto(plan.Id, plan.Name, plan.Description, plan.MaxUsers, plan.StorageLimitGB, plan.PriceMonthly, plan.PriceYearly, plan.IsActive, plan.SortOrder));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<ServicePlanDto>> Update(int id, [FromBody] UpdateServicePlanDto dto)
    {
        var plan = await _context.ServicePlans.FindAsync(id);
        if (plan == null) return NotFound();
        var oldJson = System.Text.Json.JsonSerializer.Serialize(plan);
        if (dto.Name != null) plan.Name = dto.Name;
        if (dto.Description != null) plan.Description = dto.Description;
        if (dto.MaxUsers.HasValue) plan.MaxUsers = dto.MaxUsers.Value;
        if (dto.StorageLimitGB.HasValue) plan.StorageLimitGB = dto.StorageLimitGB.Value;
        if (dto.PriceMonthly.HasValue) plan.PriceMonthly = dto.PriceMonthly.Value;
        if (dto.PriceYearly.HasValue) plan.PriceYearly = dto.PriceYearly.Value;
        if (dto.IsActive.HasValue) plan.IsActive = dto.IsActive.Value;
        if (dto.SortOrder.HasValue) plan.SortOrder = dto.SortOrder.Value;
        plan.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await _audit.LogAsync("Update", "ServicePlan", id.ToString(), oldJson, System.Text.Json.JsonSerializer.Serialize(plan));
        return Ok(new ServicePlanDto(plan.Id, plan.Name, plan.Description, plan.MaxUsers, plan.StorageLimitGB, plan.PriceMonthly, plan.PriceYearly, plan.IsActive, plan.SortOrder));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Delete(int id)
    {
        var plan = await _context.ServicePlans.FindAsync(id);
        if (plan == null) return NotFound();
        var hasCompanies = await _context.Companies.AnyAsync(c => c.ServicePlanId == id);
        if (hasCompanies) return BadRequest("Không thể xóa gói đang được sử dụng bởi công ty.");
        _context.ServicePlans.Remove(plan);
        await _context.SaveChangesAsync();
        await _audit.LogAsync("Delete", "ServicePlan", id.ToString(), System.Text.Json.JsonSerializer.Serialize(plan), null);
        return NoContent();
    }
}
