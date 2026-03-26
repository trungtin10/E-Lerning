using ELearning.Api.Data;
using ELearning.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ELearning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin")]
public class ExpiryReminderController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _email;

    public ExpiryReminderController(ApplicationDbContext context, IEmailService email)
    {
        _context = context;
        _email = email;
    }

    [HttpPost("send-reminders")]
    public async Task<ActionResult<object>> SendReminders()
    {
        var now = DateTime.UtcNow;
        var in7Days = now.AddDays(7).Date;
        var in30Days = now.AddDays(30).Date;
        var companies = await _context.Companies
            .Where(c => c.SubDomain != "admin" && c.PlanExpiresAt.HasValue && c.ContactEmail != null)
            .ToListAsync();
        var sent = 0;
        foreach (var c in companies)
        {
            var exp = c.PlanExpiresAt!.Value.Date;
            var daysLeft = (int)(exp - now.Date).TotalDays;
            if (daysLeft == 7 || daysLeft == 30)
            {
                try
                {
                    await _email.SendExpiryReminderAsync(c.ContactEmail!, c.CompanyName, c.PlanExpiresAt!.Value, daysLeft);
                    sent++;
                }
                catch { /* log */ }
            }
        }
        return Ok(new { sent, total = companies.Count });
    }
}
