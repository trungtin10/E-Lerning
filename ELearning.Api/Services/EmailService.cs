using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace ELearning.Api.Services;

public interface IEmailService
{
    Task SendActivationEmailAsync(string toEmail, string fullName, string account, string password, string activationLink);
    Task SendEmailAsync(string toEmail, string subject, string htmlBody);
    Task SendExpiryReminderAsync(string toEmail, string companyName, DateTime expiresAt, int daysLeft);
    Task SendPasswordResetEmailAsync(string toEmail, string fullName, string resetLink);
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
        email.From.Add(new MailboxAddress(_config["EmailSettings:SenderName"], _config["EmailSettings:SenderEmail"] ?? "noreply@localhost"));
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

    public async Task SendExpiryReminderAsync(string toEmail, string companyName, DateTime expiresAt, int daysLeft)
    {
        var htmlBody = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px; color: #1e293b;'>
                <h2 style='color: #dc2626;'>Nhắc nhở gia hạn gói dịch vụ</h2>
                <p>Kính gửi quý công ty <strong>{companyName}</strong>,</p>
                <p>Gói dịch vụ E-Learning của quý công ty sẽ hết hạn vào ngày <strong>{expiresAt:dd/MM/yyyy}</strong> (còn {daysLeft} ngày).</p>
                <p>Vui lòng liên hệ để gia hạn và tiếp tục sử dụng dịch vụ.</p>
                <hr style='border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;'>
                <p style='font-size: 13px; color: #94a3b8;'>Đây là email tự động từ hệ thống E-Learning.</p>
            </div>";
        await SendEmailAsync(toEmail, $"[E-Learning] Nhắc nhở gia hạn - Còn {daysLeft} ngày", htmlBody);
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string fullName, string resetLink)
    {
        var htmlBody = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px; color: #1e293b; background-color: #ffffff;'>
                <h2 style='color: #4f46e5; text-align: center; font-size: 24px; margin-bottom: 25px; font-weight: bold;'>Đặt lại mật khẩu</h2>
                <p style='font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 25px;'>Xin chào {fullName},</p>
                <p style='font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 25px;'>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng nhấn nút bên dưới để tiếp tục.</p>
                <div style='text-align: center; margin: 30px 0;'>
                    <a href='{resetLink}' style='background-color: #dc2626; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;'>ĐẶT LẠI MẬT KHẨU</a>
                </div>
                <p style='color: #94a3b8; font-size: 14px; margin-top: 20px;'>Link này có hiệu lực trong 24 giờ. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                <hr style='border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;'>
                <p style='font-size: 13px; color: #94a3b8; text-align: center;'>Đây là email tự động, vui lòng không trả lời.</p>
            </div>";
        await SendEmailAsync(toEmail, "[E-Learning] Đặt lại mật khẩu", htmlBody);
    }
}
