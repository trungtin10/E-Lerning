using System.Security.Cryptography;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace ELearning.Api.Services
{
    public interface IMoMoService
    {
        Task<string> CreatePaymentUrlAsync(HttpContext context, MoMoRequestModel model);
        bool ValidateSignature(IQueryCollection collections);
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
            var partnerCode = _config["MoMo:PartnerCode"];
            var accessKey = _config["MoMo:AccessKey"];
            var secretKey = _config["MoMo:SecretKey"];
            var endpoint = _config["MoMo:BaseUrl"];
            var returnUrl = _config["MoMo:ReturnUrl"];
            var notifyUrl = _config["MoMo:NotifyUrl"];

            var rawData = $"accessKey={accessKey}&amount={model.Amount}&extraData={model.ExtraData}&ipnUrl={notifyUrl}&orderId={model.OrderId}&orderInfo={model.OrderInfo}&partnerCode={partnerCode}&redirectUrl={returnUrl}&requestId={model.RequestId}&requestType=captureWallet";
            
            var signature = Utils.HmacSHA256(secretKey!, rawData);

            var requestBody = new
            {
                partnerCode,
                requestId = model.RequestId,
                amount = model.Amount,
                orderId = model.OrderId.ToString(),
                orderInfo = model.OrderInfo,
                redirectUrl = returnUrl,
                ipnUrl = notifyUrl,
                extraData = model.ExtraData,
                requestType = "captureWallet",
                signature,
                lang = "vi"
            };

            var httpClient = _httpClientFactory.CreateClient();
            var response = await httpClient.PostAsJsonAsync(endpoint!, requestBody);
            var result = await response.Content.ReadFromJsonAsync<MoMoResponseModel>();

            return result?.PayUrl ?? string.Empty;
        }

        public bool ValidateSignature(IQueryCollection collections)
        {
            // Logic to validate MoMo signature from return URL
            // This is a simplified version
            return true; 
        }
    }

    public class MoMoRequestModel
    {
        public int OrderId { get; set; }
        public decimal Amount { get; set; }
        public string OrderInfo { get; set; } = string.Empty;
        public string RequestId { get; set; } = string.Empty;
        public string ExtraData { get; set; } = string.Empty;
    }

    public class MoMoResponseModel
    {
        public string? PartnerCode { get; set; }
        public string? OrderId { get; set; }
        public string? RequestId { get; set; }
        public long Amount { get; set; }
        public long ResponseTime { get; set; }
        public string? Message { get; set; }
        public int ResultCode { get; set; }
        public string? PayUrl { get; set; }
        public string? Deeplink { get; set; }
        public string? QrCodeUrl { get; set; }
    }
}
