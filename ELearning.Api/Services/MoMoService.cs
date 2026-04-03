using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace ELearning.Api.Services;

public interface IMoMoService
{
    Task<string> CreatePaymentUrlAsync(HttpContext context, MoMoRequestModel model);
    bool ValidateSignature(IQueryCollection query);
}

public class MoMoService : IMoMoService
{
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpClientFactory;

    public MoMoService(IConfiguration config, IHttpClientFactory httpClientFactory)
    {
        _config = config;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<string> CreatePaymentUrlAsync(HttpContext context, MoMoRequestModel model)
    {
        var partnerCode = _config["MoMo:PartnerCode"] ?? "MOMO";
        var accessKey = _config["MoMo:AccessKey"] ?? "F8BBA842ECF85";
        var secretKey = _config["MoMo:SecretKey"] ?? "K951B6PE1waDMi640xX08PD3vg6EkVlz";
        var requestType = _config["MoMo:RequestType"] ?? "captureMoMo";
        var returnUrl = _config["MoMo:ReturnUrl"] ?? "http://localhost:5173/checkout/vnpay-return";
        var notifyUrl = _config["MoMo:NotifyUrl"] ?? "http://localhost:5211/api/checkout/momo-ipn";
        var endPoint = _config["MoMo:Endpoint"] ?? "https://test-payment.momo.vn/v2/gateway/api/create";

        var requestId = model.RequestId ?? Guid.NewGuid().ToString("N");
        var orderId = model.OrderId.ToString();
        var amount = ((long)model.Amount).ToString();
        var orderInfo = model.OrderInfo ?? "pay with MoMo";
        var extraData = model.ExtraData ?? "";

        var rawHash = $"accessKey={accessKey}&amount={amount}&extraData={extraData}&ipnUrl={notifyUrl}&orderId={orderId}&orderInfo={orderInfo}&partnerCode={partnerCode}&redirectUrl={returnUrl}&requestId={requestId}&requestType={requestType}";
        var signature = Utils.HmacSHA256(secretKey, rawHash);

        var payload = new Dictionary<string, object>
        {
            { "partnerCode", partnerCode },
            { "partnerName", "E-Learning" },
            { "storeId", "ELearningStore" },
            { "requestId", requestId },
            { "amount", amount },
            { "orderId", orderId },
            { "orderInfo", orderInfo },
            { "redirectUrl", returnUrl },
            { "ipnUrl", notifyUrl },
            { "extraData", extraData },
            { "requestType", requestType },
            { "lang", "vi" },
            { "accessKey", accessKey },
            { "signature", signature }
        };

        var client = _httpClientFactory.CreateClient();
        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await client.PostAsync(endPoint, content);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadAsStringAsync();
        var momoResp = JsonSerializer.Deserialize<MoMoResponse>(body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        if (momoResp == null || momoResp.ErrorCode != 0 || string.IsNullOrWhiteSpace(momoResp.PayUrl))
        {
            throw new Exception("Không tạo được URL MoMo. " + body);
        }

        return momoResp.PayUrl;
    }

    public bool ValidateSignature(IQueryCollection query)
    {
        var partnerCode = query["partnerCode"].FirstOrDefault();
        var accessKey = query["accessKey"].FirstOrDefault();
        var requestId = query["requestId"].FirstOrDefault();
        var orderId = query["orderId"].FirstOrDefault();
        var errorCode = query["errorCode"].FirstOrDefault();
        var transId = query["transId"].FirstOrDefault();
        var amount = query["amount"].FirstOrDefault();
        var message = query["message"].FirstOrDefault();
        var localMessage = query["localMessage"].FirstOrDefault();
        var requestType = query["requestType"].FirstOrDefault();
        var signature = query["signature"].FirstOrDefault();
        var orderInfo = query["orderInfo"].FirstOrDefault();

        var secretKey = _config["MoMo:SecretKey"] ?? "K951B6PE1waDMi640xX08PD3vg6EkVlz";

        var rawHash = $"accessKey={accessKey}&amount={amount}&message={message}&orderId={orderId}&orderInfo={orderInfo}&orderType={requestType}&partnerCode={partnerCode}&payType=momo&requestId={requestId}&responseTime={query["responseTime"].FirstOrDefault()}&resultCode={errorCode}&transId={transId}";
        var calculatedSignature = Utils.HmacSHA256(secretKey, rawHash);

        return string.Equals(calculatedSignature, signature, StringComparison.OrdinalIgnoreCase);
    }
}

public class MoMoRequestModel
{
    public int OrderId { get; set; }
    public decimal Amount { get; set; }
    public string? RequestId { get; set; }
    public string? OrderInfo { get; set; }
    public string? ExtraData { get; set; }
}

public class MoMoResponse
{
    public int ErrorCode { get; set; }
    public string Message { get; set; } = string.Empty;
    public string LocalMessage { get; set; } = string.Empty;
    public string PayUrl { get; set; } = string.Empty;
    public string RequestId { get; set; } = string.Empty;
    public string OrderId { get; set; } = string.Empty;
    public string Signature { get; set; } = string.Empty;
}
