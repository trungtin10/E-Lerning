using ELearning.Api.Data;
using ELearning.Api.Models;
using ELearning.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ELearning.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CheckoutController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IVnPayService _vnPayService;
    private readonly IMoMoService _moMoService;
    private readonly IAuditService _audit;
    private readonly IConfiguration _config;

    public CheckoutController(ApplicationDbContext context, IVnPayService vnPayService, IMoMoService moMoService, IAuditService audit, IConfiguration config)
    {
        _context = context;
        _vnPayService = vnPayService;
        _moMoService = moMoService;
        _audit = audit;
        _config = config;
    }

    [HttpPost("create-payment")]
    public async Task<IActionResult> CreatePayment([FromBody] CheckoutRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null || user.CompanyId == null) return BadRequest("Không tìm thấy thông tin công ty.");

        var plan = await _context.ServicePlans.FindAsync(request.PlanId);
        if (plan == null || !plan.IsActive) return BadRequest("Gói dịch vụ không hợp lệ hoặc đã ngừng hoạt động.");

        decimal amount = request.BillingCycle == "Yearly" ? plan.PriceYearly : plan.PriceMonthly;
        int months = request.BillingCycle == "Yearly" ? 12 : 1;

        // Tạo Transaction ban đầu
        var transaction = new Transaction
        {
            CompanyId = user.CompanyId.Value,
            ServicePlanId = plan.Id,
            Amount = amount,
            Currency = "VND",
            Status = "Pending",
            PaymentGateway = request.PaymentMethod ?? "VnPay",
            BillingCycleMonths = months,
            CreatedAt = DateTime.UtcNow,
            Notes = $"Thanh toán gói {plan.Name} ({request.BillingCycle})"
        };

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        var paymentUrl = string.Empty;

        if (string.Equals(request.PaymentMethod, "MoMo", StringComparison.OrdinalIgnoreCase))
        {
            var momoModel = new MoMoRequestModel
            {
                OrderId = transaction.Id,
                Amount = amount,
                OrderInfo = request.OrderInfo ?? $"Thanh toan don hang {transaction.Id}",
                RequestId = Guid.NewGuid().ToString("N"),
                ExtraData = request.ExtraData ?? string.Empty
            };
            paymentUrl = await _moMoService.CreatePaymentUrlAsync(HttpContext, momoModel);
            transaction.PaymentGateway = "MoMo";
            _context.Transactions.Update(transaction);
            await _context.SaveChangesAsync();
        }
        else
        {
            var model = new VnPayRequestModel
            {
                Amount = amount,
                CreatedDate = DateTime.Now,
                Description = request.OrderInfo ?? $"Thanh toan don hang {transaction.Id}",
                FullName = user.FullName ?? user.UserName ?? "User",
                OrderId = transaction.Id
            };
            paymentUrl = _vnPayService.CreatePaymentUrl(HttpContext, model);
        }

        return Ok(new { paymentUrl });
    }

    [AllowAnonymous]
    [HttpGet("vnpay-return")]
    public async Task<IActionResult> VnPayReturn()
    {
        var response = _vnPayService.PaymentExecute(Request.Query);

        var appDomain = _config["AppSettings:AppDomain"]?.TrimEnd('/');
        var frontendReturnUrl =
            _config["VnPay:FrontendReturnUrl"]
            ?? (string.IsNullOrWhiteSpace(appDomain) ? null : (appDomain + "/checkout/vnpay-return"))
            ?? _config["VnPay:ReturnUrl"];

        if (response == null || !response.Success)
        {
            return Redirect(frontendReturnUrl + "?success=false&error=SignatureInvalid");
        }

        if (!int.TryParse(response.OrderId, out int transactionId))
        {
            return Redirect(frontendReturnUrl + "?success=false&error=OrderIdInvalid");
        }

        var transaction = await _context.Transactions
            .Include(t => t.Company)
            .Include(t => t.ServicePlan)
            .FirstOrDefaultAsync(t => t.Id == transactionId);

        if (transaction == null)
        {
            return Redirect(frontendReturnUrl + "?success=false&error=OrderNotFound");
        }

        if (response.VnPayResponseCode != "00")
        {
            transaction.Status = "Failed";
            transaction.Notes += $" | VNPay Error Code: {response.VnPayResponseCode}";
            await _context.SaveChangesAsync();
            return Redirect(frontendReturnUrl + $"?success=false&error=Code{response.VnPayResponseCode}");
        }

        if (transaction.Status == "Pending")
        {
            if (Request.Query.TryGetValue("vnp_Amount", out var amountStr) && long.TryParse(amountStr, out long vnpAmount))
            {
                if (vnpAmount != (long)(transaction.Amount * 100))
                {
                    transaction.Status = "Failed";
                    transaction.Notes += $" | VNPay Amount Mismatch: {vnpAmount}";
                    await _context.SaveChangesAsync();
                    return Redirect(frontendReturnUrl + "?success=false&error=AmountMismatch");
                }
            }

            transaction.Status = "Completed";
            transaction.PaymentDate = DateTime.UtcNow;
            transaction.TransactionRef = response.TransactionId;

            var company = transaction.Company;
            var plan = transaction.ServicePlan;
            
            // If plan wasn't loaded, fetch it from database
            if (plan == null && transaction.ServicePlanId > 0)
            {
                plan = await _context.ServicePlans.FindAsync(transaction.ServicePlanId);
            }

            DateTime startFrom = (company.PlanExpiresAt.HasValue && company.PlanExpiresAt > DateTime.UtcNow)
                ? company.PlanExpiresAt.Value
                : DateTime.UtcNow;
            var expiresAt = startFrom.AddMonths(transaction.BillingCycleMonths);

            transaction.PlanExpiresAt = expiresAt;
            company.ServicePlanId = transaction.ServicePlanId;
            company.ServicePlan = plan?.Name ?? "Basic";
            company.PlanExpiresAt = expiresAt;
            company.MaxUsers = plan?.MaxUsers ?? company.MaxUsers;
            company.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await _audit.LogAsync("Payment", "Transaction", transaction.Id.ToString(), null, $"Công ty {company.CompanyName} thanh toán thành công gói {plan?.Name}");
        }

        if (transaction.Status == "Completed")
        {
            return Redirect(frontendReturnUrl + $"?success=true&orderId={transaction.Id}");
        }

        return Redirect(frontendReturnUrl + "?success=false&error=Unknown");
    }

    [AllowAnonymous]
    [HttpGet("momo-return")]
    public IActionResult MoMoReturn()
    {
        if (!_moMoService.ValidateSignature(Request.Query))
        {
            return Redirect(_config["MoMo:ReturnUrl"] + "?success=false&error=SignatureInvalid");
        }

        var errorCode = Request.Query["errorCode"].FirstOrDefault();
        var orderId = Request.Query["orderId"].FirstOrDefault();

        if (errorCode != "0")
        {
            return Redirect(_config["MoMo:ReturnUrl"] + $"?success=false&error=Code{errorCode}");
        }

        return Redirect(_config["MoMo:ReturnUrl"] + $"?success=true&orderId={orderId}");
    }

    [HttpPost("momo-ipn")]
    public async Task<IActionResult> MoMoIpn([FromBody] Dictionary<string, object> payload)
    {
        if (payload == null || !payload.TryGetValue("orderId", out var orderIdObj) || !int.TryParse(orderIdObj?.ToString(), out int orderId))
            return BadRequest(new { resultCode = 1, message = "Missing orderId" });

        var transaction = await _context.Transactions
            .Include(t => t.Company)
            .Include(t => t.ServicePlan)
            .FirstOrDefaultAsync(t => t.Id == orderId);

        if (transaction == null) return NotFound(new { resultCode = 1, message = "Order not found" });

        var errorCode = payload.TryGetValue("errorCode", out var errorCodeObj) ? errorCodeObj?.ToString() : "-1";

        if (errorCode == "0" && transaction.Status == "Pending")
        {
            transaction.Status = "Completed";
            transaction.PaymentDate = DateTime.UtcNow;
            transaction.TransactionRef = payload.TryGetValue("transId", out var tId) ? tId?.ToString() : null;

            var company = transaction.Company;
            var plan = transaction.ServicePlan;
            
            // If plan wasn't loaded, fetch it from database
            if (plan == null && transaction.ServicePlanId > 0)
            {
                plan = await _context.ServicePlans.FindAsync(transaction.ServicePlanId);
            }

            DateTime startFrom = (company.PlanExpiresAt.HasValue && company.PlanExpiresAt > DateTime.UtcNow)
                ? company.PlanExpiresAt.Value
                : DateTime.UtcNow;
            var expiresAt = startFrom.AddMonths(transaction.BillingCycleMonths);

            transaction.PlanExpiresAt = expiresAt;
            company.ServicePlanId = transaction.ServicePlanId;
            company.ServicePlan = plan?.Name ?? "Basic";
            company.PlanExpiresAt = expiresAt;
            company.MaxUsers = plan?.MaxUsers ?? company.MaxUsers;
            company.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await _audit.LogAsync("Payment", "Transaction", transaction.Id.ToString(), null, $"Công ty {company.CompanyName} thanh toán MoMo thành công gói {plan?.Name}");
        }
        else if (transaction.Status == "Pending")
        {
            transaction.Status = "Failed";
            transaction.Notes += $" | MoMo ErrorCode: {errorCode}";
            await _context.SaveChangesAsync();
        }

        return Ok(new { resultCode = 0, message = "Confirm success" });
    }

    [AllowAnonymous]
    [HttpGet("vnpay-ipn")]
    public async Task<IActionResult> VnPayIpn()
    {
        var response = _vnPayService.PaymentExecute(Request.Query);
        
        if (response == null || !response.Success) return Ok(new { RspCode = "97", Message = "Invalid signature" });

        if (!int.TryParse(response.OrderId, out int transactionId)) return Ok(new { RspCode = "01", Message = "Order not found" });

        var transaction = await _context.Transactions
            .Include(t => t.Company)
            .Include(t => t.ServicePlan)
            .FirstOrDefaultAsync(t => t.Id == transactionId);

        if (transaction == null) return Ok(new { RspCode = "01", Message = "Order not found" });

        // Kiểm tra số tiền (rất quan trọng)
        // Lưu ý: VNPay gửi Amount * 100
        if (Request.Query.TryGetValue("vnp_Amount", out var amountStr))
        {
             if (long.TryParse(amountStr, out long vnpAmount))
             {
                 if (vnpAmount != (long)(transaction.Amount * 100))
                     return Ok(new { RspCode = "04", Message = "Invalid amount" });
             }
        }

        if (transaction.Status != "Pending") return Ok(new { RspCode = "02", Message = "Order already confirmed" });

        if (response.VnPayResponseCode == "00")
        {
            // Thanh toán thành công
            transaction.Status = "Completed";
            transaction.PaymentDate = DateTime.UtcNow;
            transaction.TransactionRef = response.TransactionId;

            // Kích hoạt/Gia hạn gói cho công ty
            var company = transaction.Company;
            var plan = transaction.ServicePlan;
            
            // If plan wasn't loaded, fetch it from database
            if (plan == null && transaction.ServicePlanId > 0)
            {
                plan = await _context.ServicePlans.FindAsync(transaction.ServicePlanId);
            }
            
            DateTime startFrom = (company.PlanExpiresAt.HasValue && company.PlanExpiresAt > DateTime.UtcNow) 
                ? company.PlanExpiresAt.Value 
                : DateTime.UtcNow;

            var expiresAt = startFrom.AddMonths(transaction.BillingCycleMonths);
            
            transaction.PlanExpiresAt = expiresAt;

            company.ServicePlanId = transaction.ServicePlanId;
            company.ServicePlan = plan?.Name ?? "Basic";
            company.PlanExpiresAt = expiresAt;
            company.MaxUsers = plan?.MaxUsers ?? company.MaxUsers;
            company.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await _audit.LogAsync("Payment", "Transaction", transaction.Id.ToString(), null, $"Công ty {company.CompanyName} thanh toán thành công gói {plan?.Name}");
        }
        else
        {
            // Thanh toán lỗi
            transaction.Status = "Failed";
            transaction.Notes += $" | VNPay Error Code: {response.VnPayResponseCode}";
            await _context.SaveChangesAsync();
        }

        return Ok(new { RspCode = "00", Message = "Confirm success" });
    }
}

public class CheckoutRequest
{
    public int PlanId { get; set; }
    public string BillingCycle { get; set; } = "Monthly"; // Monthly or Yearly
    public string PaymentMethod { get; set; } = "VnPay"; // VnPay | MoMo
    public string? OrderInfo { get; set; }
    public string? ExtraData { get; set; }
}
