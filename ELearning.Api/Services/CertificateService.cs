using ELearning.Api.Data;
using ELearning.Api.Models;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using QuestPDF.Previewer;

namespace ELearning.Api.Services
{
    public interface ICertificateService
    {
        Task<(bool Success, string Message, string? Url, string? Code)> CheckAndIssueCertificateAsync(string userId, int courseId);
        Task<(bool Success, string Message, string? Url, string? Code)> IssueCertificateManualAsync(string userId, int courseId);
        Task<byte[]> GenerateCertificatePdfAsync(int certificateId);
    }

    public class CertificateService : ICertificateService
    {
        private readonly ApplicationDbContext _context;
        private readonly IFileUploadService _fileUpload;
        private readonly IAuditService _audit;

        public CertificateService(ApplicationDbContext context, IFileUploadService fileUpload, IAuditService audit)
        {
            _context = context;
            _fileUpload = fileUpload;
            _audit = audit;
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public async Task<(bool Success, string Message, string? Url, string? Code)> CheckAndIssueCertificateAsync(string userId, int courseId)
        {
            var enrollment = await _context.CourseEnrollments
                .Include(e => e.Course)
                .Include(e => e.User)
                .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == courseId);

            if (enrollment == null) return (false, "Bạn chưa đăng ký khóa học này.", null, null);
            if (enrollment.ProgressPercentage < 100) return (false, $"Tiến độ ({enrollment.ProgressPercentage}%) chưa đạt 100%.", null, null);

            var finalQuiz = await _context.Quizzes.FirstOrDefaultAsync(q => q.CourseId == courseId && q.SectionNumber == 0);
            if (finalQuiz != null)
            {
                var bestAttempt = await _context.QuizAttempts.Where(a => a.UserId == userId && a.QuizId == finalQuiz.Id).OrderByDescending(a => a.Score).FirstOrDefaultAsync();
                if (bestAttempt == null || !bestAttempt.IsPassed) return (false, "Bạn chưa đạt yêu cầu bài thi cuối khóa.", null, null);
            }

            return await IssueInternalAsync(enrollment);
        }

        public async Task<(bool Success, string Message, string? Url, string? Code)> IssueCertificateManualAsync(string userId, int courseId)
        {
            var enrollment = await _context.CourseEnrollments
                .Include(e => e.Course)
                .Include(e => e.User)
                .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == courseId);

            if (enrollment == null) return (false, "Không tìm thấy thông tin đăng ký học.", null, null);
            
            // Ràng buộc: Chỉ cấp khi đã hoàn thành 100% bài học
            if (enrollment.ProgressPercentage < 100) 
                return (false, $"Học viên chưa đủ điều kiện (Tiến độ hiện tại: {enrollment.ProgressPercentage}%). Cần hoàn thành 100% bài học.", null, null);

            return await IssueInternalAsync(enrollment);
        }

        private async Task<(bool Success, string Message, string? Url, string? Code)> IssueInternalAsync(CourseEnrollment enrollment)
        {
            var existing = await _context.Certificates.FirstOrDefaultAsync(c => c.UserId == enrollment.UserId && c.CourseId == enrollment.CourseId);
            if (existing != null) return (true, "Đã cấp chứng chỉ.", existing.CertificateUrl, existing.CertificateCode);

            var template = await _context.CertificateTemplates
                .Where(t => t.CompanyId == enrollment.User.CompanyId || t.CompanyId == null)
                .OrderByDescending(t => t.CompanyId).FirstOrDefaultAsync();

            string certCode = $"CERT-{enrollment.CourseId}-{enrollment.UserId.Substring(0, 5).ToUpper()}-{DateTime.UtcNow:yyyyMMdd}";
            
            var certificate = new Certificate
            {
                UserId = enrollment.UserId,
                CourseId = enrollment.CourseId,
                IssuedAt = DateTime.UtcNow,
                CertificateCode = certCode,
                TemplateId = template?.Id
            };

            _context.Certificates.Add(certificate);
            await _context.SaveChangesAsync();

            // Generate real PDF
            var pdfBytes = await GenerateCertificatePdfAsync(certificate.Id);
            string fileName = $"{certCode}.pdf";
            string filePath = await _fileUpload.SaveFileAsync(pdfBytes, fileName, enrollment.User.CompanyId, "certificates");

            certificate.CertificateUrl = filePath;
            enrollment.Status = "Completed";
            if (!enrollment.CompletedAt.HasValue) enrollment.CompletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await _audit.LogAsync("Generate", "Certificate", certificate.Id.ToString(), null, enrollment.Course?.Title, "Cấp chứng chỉ");

            return (true, "Cấp chứng chỉ thành công!", filePath, certCode);
        }

        public async Task<byte[]> GenerateCertificatePdfAsync(int certificateId)
        {
            var cert = await _context.Certificates
                .Include(c => c.User).ThenInclude(u => u.Company)
                .Include(c => c.Course)
                .Include(c => c.Template)
                .FirstOrDefaultAsync(c => c.Id == certificateId);

            if (cert == null) throw new Exception("Không tìm thấy chứng chỉ.");

            var companyName = cert.User?.Company?.CompanyName ?? "Hệ thống E-Learning";
            var companyIndustry = cert.User?.Company?.Industry ?? "Giáo dục & Đào tạo";

            // Create PDF using QuestPDF
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(0.5f, Unit.Inch);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(12).FontFamily(Fonts.Verdana));

                    page.Content().Layers(layers =>
                    {
                        // Background pattern/border
                        layers.Layer().Border(10).BorderColor(Colors.Amber.Medium);
                        layers.Layer().Padding(5).Border(2).BorderColor(Colors.Amber.Lighten2);

                        layers.PrimaryLayer().Padding(40).Column(col =>
                        {
                            // Header
                            col.Item().AlignCenter().Text(companyName.ToUpper()).FontSize(20).Bold().FontColor(Colors.Grey.Darken3);
                            col.Item().AlignCenter().Text($"Lĩnh vực: {companyIndustry}").FontSize(12).Italic().FontColor(Colors.Grey.Medium);
                            
                            col.Item().PaddingTop(20).AlignCenter().Text("CHỨNG CHỈ HOÀN THÀNH").FontSize(42).ExtraBold().FontColor(Colors.Indigo.Medium);
                            
                            col.Item().PaddingTop(30).AlignCenter().Text("Chứng nhận học viên").FontSize(18).FontColor(Colors.Grey.Darken1);
                            col.Item().AlignCenter().Text(cert.User.FullName ?? cert.User.UserName).FontSize(36).Bold().FontColor(Colors.Black);
                            
                            col.Item().PaddingTop(20).AlignCenter().Text("Đã hoàn thành xuất sắc khóa học").FontSize(18).FontColor(Colors.Grey.Darken1);
                            col.Item().AlignCenter().Text(cert.Course.Title).FontSize(28).Bold().FontColor(Colors.Indigo.Darken3);
                            
                            col.Item().PaddingTop(40).Row(row =>
                            {
                                row.RelativeItem().Column(c => {
                                    c.Item().Text($"Ngày cấp: {cert.IssuedAt:dd/MM/yyyy}").FontSize(14);
                                    c.Item().Text($"Mã số: {cert.CertificateCode}").FontSize(14);
                                });
                                
                                row.RelativeItem().Column(c => {
                                    c.Item().AlignCenter().Text(cert.Template?.SignerTitle ?? "GIÁM ĐỐC ĐÀO TẠ").Bold().FontSize(14);
                                    c.Item().PaddingTop(40).AlignCenter().BorderTop(1).AlignCenter().Text(cert.Template?.SignerName ?? companyName).FontSize(18).Bold();
                                });
                            });
                        });
                    });

                    page.Footer().PaddingBottom(20).AlignCenter().Text(x =>
                    {
                        x.Span("Chứng chỉ được cấp bởi ");
                        x.Span(companyName).Bold();
                        x.Span(" thông qua hệ thống quản lý học tập E-Learning SaaS");
                    });
                });
            });

            return document.GeneratePdf();
        }
    }
}
