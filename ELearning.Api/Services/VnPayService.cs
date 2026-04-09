using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Web;

namespace ELearning.Api.Services;

public interface IVnPayService
{
    string CreatePaymentUrl(HttpContext context, VnPayRequestModel model);
    VnPayResponseModel PaymentExecute(IQueryCollection collections);
}

public class VnPayService : IVnPayService
{
    private readonly IConfiguration _config;

    public VnPayService(IConfiguration config)
    {
        _config = config;
    }

    public string CreatePaymentUrl(HttpContext context, VnPayRequestModel model)
    {
        var vnp_TmnCode = _config["VnPay:TmnCode"];
        var vnp_HashSecret = _config["VnPay:HashSecret"];
        var vnp_BaseUrl = _config["VnPay:BaseUrl"];
        var vnp_ReturnUrl = _config["VnPay:ReturnUrl"];
        var vnp_FrontendReturnUrl = _config["VnPay:FrontendReturnUrl"];
        var vnp_Version = _config["VnPay:Version"];
        var vnp_Command = _config["VnPay:Command"];
        var vnp_CurrCode = _config["VnPay:CurrCode"];
        var vnp_Locale = _config["VnPay:Locale"];

        var tick = DateTime.UtcNow.Ticks.ToString();
        var vnpay = new VnPayLibrary();

        vnpay.AddRequestData("vnp_Version", vnp_Version ?? "2.1.0");
        vnpay.AddRequestData("vnp_Command", vnp_Command ?? "pay");
        vnpay.AddRequestData("vnp_TmnCode", vnp_TmnCode ?? "");
        vnpay.AddRequestData("vnp_Amount", ((int)model.Amount * 100).ToString());
        vnpay.AddRequestData("vnp_CreateDate", model.CreatedDate.ToString("yyyyMMddHHmmss"));
        vnpay.AddRequestData("vnp_CurrCode", vnp_CurrCode ?? "VND");
        vnpay.AddRequestData("vnp_IpAddr", Utils.GetIpAddress(context));
        vnpay.AddRequestData("vnp_Locale", vnp_Locale ?? "vn");
        vnpay.AddRequestData("vnp_OrderInfo", model.Description);
        vnpay.AddRequestData("vnp_OrderType", "other");
        vnpay.AddRequestData("vnp_ReturnUrl", vnp_ReturnUrl ?? "");
        vnpay.AddRequestData("vnp_TxnRef", model.OrderId.ToString());

        return vnpay.CreateRequestUrl(vnp_BaseUrl ?? "", vnp_HashSecret ?? "");
    }

    public VnPayResponseModel PaymentExecute(IQueryCollection collections)
    {
        var vnpay = new VnPayLibrary();
        foreach (var (key, value) in collections)
        {
            if (!string.IsNullOrEmpty(key) && key.StartsWith("vnp_"))
            {
                // VNPay signature must exclude these fields
                if (key.Equals("vnp_SecureHash", StringComparison.OrdinalIgnoreCase)) continue;
                if (key.Equals("vnp_SecureHashType", StringComparison.OrdinalIgnoreCase)) continue;
                vnpay.AddResponseData(key, value!);
            }
        }

        var vnp_OrderId = vnpay.GetResponseData("vnp_TxnRef");
        var vnp_TransactionId = vnpay.GetResponseData("vnp_TransactionNo");
        var vnp_ResponseCode = vnpay.GetResponseData("vnp_ResponseCode");
        var vnp_OrderInfo = vnpay.GetResponseData("vnp_OrderInfo");
        var vnp_SecureHash = collections.FirstOrDefault(p => p.Key == "vnp_SecureHash").Value;

        bool checkSignature = vnpay.ValidateSignature(vnp_SecureHash!, _config["VnPay:HashSecret"] ?? "");
        if (!checkSignature)
        {
            return new VnPayResponseModel { Success = false };
        }

        return new VnPayResponseModel
        {
            Success = true,
            PaymentMethod = "VnPay",
            OrderDescription = vnp_OrderInfo,
            OrderId = vnp_OrderId,
            TransactionId = vnp_TransactionId,
            Token = vnp_SecureHash!,
            VnPayResponseCode = vnp_ResponseCode
        };
    }
}

public class VnPayRequestModel
{
    public int OrderId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime CreatedDate { get; set; }
}

public class VnPayResponseModel
{
    public bool Success { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string OrderDescription { get; set; } = string.Empty;
    public string OrderId { get; set; } = string.Empty;
    public string PaymentId { get; set; } = string.Empty;
    public string TransactionId { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string VnPayResponseCode { get; set; } = string.Empty;
}

public class VnPayLibrary
{
    private readonly SortedList<string, string> _requestData = new(new VnPayCompare());
    private readonly SortedList<string, string> _responseData = new(new VnPayCompare());

    public void AddRequestData(string key, string value) => _requestData.Add(key, value);
    public void AddResponseData(string key, string value) => _responseData.Add(key, value);
    public string GetResponseData(string key) => _responseData.TryGetValue(key, out var val) ? val : string.Empty;

    public string CreateRequestUrl(string baseUrl, string hashSecret)
    {
        var data = new StringBuilder();
        foreach (var kv in _requestData)
        {
            if (!string.IsNullOrEmpty(kv.Value))
            {
                data.Append(WebUtility.UrlEncode(kv.Key) + "=" + WebUtility.UrlEncode(kv.Value) + "&");
            }
        }
        var queryString = data.ToString();
        baseUrl += "?" + queryString;
        var signData = queryString.Remove(queryString.Length - 1);
        var vnp_SecureHash = Utils.HmacSHA512(hashSecret, signData);
        baseUrl += "vnp_SecureHash=" + vnp_SecureHash;

        return baseUrl;
    }

    public bool ValidateSignature(string inputHash, string secretKey)
    {
        var rspRaw = GetResponseRaw();
        var myChecksum = Utils.HmacSHA512(secretKey, rspRaw);
        return myChecksum.Equals(inputHash, StringComparison.InvariantCultureIgnoreCase);
    }

    private string GetResponseRaw()
    {
        var data = new StringBuilder();
        foreach (var kv in _responseData)
        {
            if (!string.IsNullOrEmpty(kv.Value))
            {
                data.Append(WebUtility.UrlEncode(kv.Key) + "=" + WebUtility.UrlEncode(kv.Value) + "&");
            }
        }
        if (data.Length > 0) data.Remove(data.Length - 1, 1);
        return data.ToString();
    }
}

public class VnPayCompare : IComparer<string>
{
    public int Compare(string? x, string? y)
    {
        if (x == y) return 0;
        if (x == null) return -1;
        if (y == null) return 1;
        return string.Compare(x, y, StringComparison.Ordinal);
    }
}

public static class Utils
{
    public static string HmacSHA512(string key, string inputData)
    {
        var hash = new StringBuilder();
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var inputBytes = Encoding.UTF8.GetBytes(inputData);
        using (var hmac = new HMACSHA512(keyBytes))
        {
            var hashValue = hmac.ComputeHash(inputBytes);
            foreach (var theByte in hashValue)
            {
                hash.Append(theByte.ToString("x2"));
            }
        }
        return hash.ToString();
    }

    public static string HmacSHA256(string key, string inputData)
    {
        var hash = new StringBuilder();
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var inputBytes = Encoding.UTF8.GetBytes(inputData);
        using (var hmac = new HMACSHA256(keyBytes))
        {
            var hashValue = hmac.ComputeHash(inputBytes);
            foreach (var theByte in hashValue)
            {
                hash.Append(theByte.ToString("x2"));
            }
        }
        return hash.ToString();
    }

    public static string GetIpAddress(HttpContext context)
    {
        var ipAddress = string.Empty;
        try
        {
            var xForwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(xForwardedFor))
            {
                ipAddress = xForwardedFor.Split(',')[0];
            }
            if (string.IsNullOrEmpty(ipAddress))
            {
                ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            }
        }
        catch { ipAddress = "127.0.0.1"; }
        return ipAddress;
    }
}
