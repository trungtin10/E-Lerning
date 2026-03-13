using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace ELearning.Api.Services;

public interface IEmailService
{
    Task SendActivationEmailAsync(string toEmail, string fullName, string account, string password, string activationLink);
    Task SendEmailAsync(string toEmail, string subject, string htmlBody); // Thêm hàm này để khớp với các yêu cầu khác nếu có
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendActivationEmailAsync(string toEmail, string fullName, string account, string password, string activationLink)
    {
        bool hidePassword = password.Contains("*");
        var htmlBody = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px; color: #1e293b; background-color: #ffffff;'>
                <h2 style='color: #4f46e5; text-align: center; font-size: 28px; margin-bottom: 25px; font-weight: bold;'>Chào mừng {fullName.ToUpper()}!</h2>
                <p style='text-align: center; font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 30px;'>Hệ thống E-Learning đã khởi tạo thành công tài khoản quản trị cho công ty của bạn.</p>

                <div style='background-color: #f8fafc; padding: 30px; border-radius: 12px; margin: 20px 0; border: 1px solid #f1f5f9; text-align: left;'>
                    <p style='margin: 10px 0; font-size: 16px;'><strong>Tài khoản:</strong> {account}</p>
                    {(hidePassword ? "" : $"<p style='margin: 10px 0; font-size: 16px;'><strong>Mật khẩu:</strong> {password}</p>")}
                    
                    <div style='text-align: center; margin-top: 30px;'>
                        <a href='{activationLink}' style='background-color: #4f46e5; color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; letter-spacing: 0.5px;'>KÍCH HOẠT TÀI KHOẢN NGAY</a>
                    </div>
                </div>

                <p style='color: #f43f5e; font-size: 14px; text-align: center; margin-top: 20px;'>
                    * Lưu ý: Link kích hoạt này chỉ có hiệu lực trong vòng <strong>24 giờ</strong>.
                </p>

                <hr style='border: none; border-top: 1px solid #f1f5f9; margin: 50px 0;'>
                <p style='font-size: 13px; color: #94a3b8; text-align: center;'>
                    Đây là email tự động, vui lòng không trả lời email này.
                </p>
                <!-- Unique ID to prevent Gmail trimming: {Guid.NewGuid()} -->
                <div style='display:none; color:#ffffff; font-size:1px;'>{Guid.NewGuid()}</div>
            </div>";

        await SendEmailAsync(toEmail, $"Kích hoạt tài khoản Quản trị E-Learning [ID: {Guid.NewGuid().ToString().Substring(0, 8)}]", htmlBody);
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        var email = new MimeMessage();
        email.From.Add(new MailboxAddress(_config["EmailSettings:SenderName"], _config["EmailSettings:SenderEmail"]));
        email.To.Add(MailboxAddress.Parse(toEmail));
        email.Subject = subject;

        var builder = new BodyBuilder { HtmlBody = htmlBody };
        email.Body = builder.ToMessageBody();

        using var smtp = new SmtpClient();
        await smtp.ConnectAsync(_config["EmailSettings:SmtpServer"], int.Parse(_config["EmailSettings:SmtpPort"]!), SecureSocketOptions.StartTls);
        await smtp.AuthenticateAsync(_config["EmailSettings:SenderEmail"], _config["EmailSettings:AppPassword"]);
        await smtp.SendAsync(email);
        await smtp.DisconnectAsync(true);
    }
}
