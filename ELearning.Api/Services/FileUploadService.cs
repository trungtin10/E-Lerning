using ELearning.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks; // Cần thiết cho Task
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ELearning.Api.Services
{
    public class FileUploadService : IFileUploadService
    {
        private readonly IWebHostEnvironment _env;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<FileUploadService> _logger; // Đã thêm khai báo field này

        public FileUploadService(IWebHostEnvironment env, ApplicationDbContext context, ILogger<FileUploadService> logger)
        {
            _env = env;
            _context = context;
            _logger = logger;
        }

        public void EnsureCompanyFolder(int companyId)
        {
            var companyPath = Path.Combine(_env.ContentRootPath, "uploads", companyId.ToString());
            if (!Directory.Exists(companyPath))
            {
                Directory.CreateDirectory(companyPath);
                Directory.CreateDirectory(Path.Combine(companyPath, "branding"));
                Directory.CreateDirectory(Path.Combine(companyPath, "media"));
                Directory.CreateDirectory(Path.Combine(companyPath, "courses"));
            }
        }

        public void EnsureLessonFolder(int companyId, int lessonId, int? courseId = null)
        {
            if (!courseId.HasValue)
            {
                throw new ArgumentException("courseId is required to maintain the directory hierarchy: company -> courses -> courseId -> lessons -> lessonId");
            }
            
            var path = Path.Combine(_env.ContentRootPath, "uploads", companyId.ToString(), "courses", courseId.Value.ToString(), "lessons", lessonId.ToString());

            if (!Directory.Exists(path))
            {
                Directory.CreateDirectory(path);
                Directory.CreateDirectory(Path.Combine(path, "videos"));
                Directory.CreateDirectory(Path.Combine(path, "images"));
                Directory.CreateDirectory(Path.Combine(path, "docs"));
            }
        }

        public void EnsureCourseFolder(int companyId, int courseId)
        {
            var coursePath = Path.Combine(_env.ContentRootPath, "uploads", companyId.ToString(), "courses", courseId.ToString());
            if (!Directory.Exists(coursePath))
            {
                Directory.CreateDirectory(coursePath);
                Directory.CreateDirectory(Path.Combine(coursePath, "intro"));
                Directory.CreateDirectory(Path.Combine(coursePath, "intro", "videos"));
                Directory.CreateDirectory(Path.Combine(coursePath, "intro", "docs"));
                Directory.CreateDirectory(Path.Combine(coursePath, "lessons"));
            }
        }

        public async Task DeleteLessonFolderAsync(int companyId, int lessonId, int? courseId = null)
        {
            if (!courseId.HasValue)
            {
                throw new ArgumentException("courseId is required to locate the nested lesson folder for deletion.");
            }

            var path = Path.Combine(_env.ContentRootPath, "uploads", companyId.ToString(), "courses", courseId.Value.ToString(), "lessons", lessonId.ToString());

            if (Directory.Exists(path))
            {
                try
                {
                    Directory.Delete(path, recursive: true);
                    await UpdateCompanyStorageUsageAsync(companyId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to delete lesson folder for company {CompanyId}, lesson {LessonId}", companyId, lessonId);
                }
            }
        }

        public async Task DeleteCourseFolderAsync(int companyId, int courseId)
        {
            var coursePath = Path.Combine(_env.ContentRootPath, "uploads", companyId.ToString(), "courses", courseId.ToString());
            if (Directory.Exists(coursePath))
            {
                try
                {
                    Directory.Delete(coursePath, recursive: true);
                    await UpdateCompanyStorageUsageAsync(companyId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to delete course folder for company {CompanyId}, course {CourseId}", companyId, courseId);
                }
            }
        }

        private async Task UpdateCompanyStorageUsageAsync(int companyId)
        {
            var company = await _context.Companies.FindAsync(companyId);
            if (company != null)
            {
                company.StorageUsedBytes = await GetCompanyStorageUsageAsync(companyId);
                await _context.SaveChangesAsync();
            }
        }

        public void CleanupEmptyFolders(int companyId)
        {
            var companyPath = Path.Combine(_env.ContentRootPath, "uploads", companyId.ToString());
            if (!Directory.Exists(companyPath)) return;
            DeleteEmptyDirectories(companyPath);
        }

        private static void DeleteEmptyDirectories(string root)
        {
            foreach (var dir in Directory.GetDirectories(root))
            {
                DeleteEmptyDirectories(dir);
                if (!Directory.EnumerateFileSystemEntries(dir).Any())
                    Directory.Delete(dir);
            }
        }

        public async Task<string> SaveFileAsync(IFormFile file, int? companyId, string subDir, string? preferredFileName = null)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty", nameof(file));

            var companyFolder = (companyId.HasValue && companyId.Value > 0) ? companyId.Value.ToString() : "system";
            var uploadDir = Path.Combine(_env.ContentRootPath, "uploads", companyFolder, subDir);

            if (!Directory.Exists(uploadDir))
                Directory.CreateDirectory(uploadDir);

            string fileName;
            if (!string.IsNullOrEmpty(preferredFileName))
            {
                var safeName = MakeFileNameSafe(preferredFileName);
                fileName = $"{Path.GetFileNameWithoutExtension(safeName)}_{Guid.NewGuid():N}{Path.GetExtension(safeName)}";
            }
            else
            {
                fileName = $"{Guid.NewGuid():N}{Path.GetExtension(file.FileName)}";
            }

            var filePath = Path.Combine(uploadDir, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            if (companyId.HasValue && companyId.Value > 0)
            {
                var company = await _context.Companies.FindAsync(companyId.Value);
                if (company != null)
                {
                    company.StorageUsedBytes += file.Length;
                    await _context.SaveChangesAsync();
                }
            }

            return $"/uploads/{companyFolder}/{subDir}/{fileName}";
        }

        public async Task<string> SaveFileAsync(byte[] content, string fileName, int? companyId, string subDir)
        {
            if (content == null || content.Length == 0)
                throw new ArgumentException("Content is empty", nameof(content));

            var companyFolder = (companyId.HasValue && companyId.Value > 0) ? companyId.Value.ToString() : "system";
            var uploadDir = Path.Combine(_env.ContentRootPath, "uploads", companyFolder, subDir);

            if (!Directory.Exists(uploadDir))
                Directory.CreateDirectory(uploadDir);

            var safeName = MakeFileNameSafe(fileName);
            var finalFileName = $"{Path.GetFileNameWithoutExtension(safeName)}_{Guid.NewGuid():N}{Path.GetExtension(safeName)}";
            var filePath = Path.Combine(uploadDir, finalFileName);

            await File.WriteAllBytesAsync(filePath, content);

            if (companyId.HasValue && companyId.Value > 0)
            {
                var company = await _context.Companies.FindAsync(companyId.Value);
                if (company != null)
                {
                    company.StorageUsedBytes += content.Length;
                    await _context.SaveChangesAsync();
                }
            }

            return $"/uploads/{companyFolder}/{subDir}/{finalFileName}";
        }

        public async Task<bool> DeleteFileAsync(string fileUrl, int? companyId)
        {
            if (string.IsNullOrEmpty(fileUrl)) return false;

            var physicalPath = GetPhysicalPath(fileUrl);
            if (File.Exists(physicalPath))
            {
                var fileInfo = new FileInfo(physicalPath);
                long fileSize = fileInfo.Length;
                File.Delete(physicalPath);

                if (companyId.HasValue && companyId.Value > 0)
                {
                    var company = await _context.Companies.FindAsync(companyId.Value);
                    if (company != null)
                    {
                        company.StorageUsedBytes = Math.Max(0, company.StorageUsedBytes - fileSize);
                        await _context.SaveChangesAsync();
                    }
                }
                return true;
            }

            return false;
        }

        public string GetPhysicalPath(string fileUrl)
        {
            return Path.Combine(_env.ContentRootPath, fileUrl.TrimStart('/'));
        }

        public async Task<long> GetCompanyStorageUsageAsync(int companyId)
        {
            var companyFolder = companyId.ToString();
            var companyPath = Path.Combine(_env.ContentRootPath, "uploads", companyFolder);

            if (!Directory.Exists(companyPath))
                return 0;

            var dirInfo = new DirectoryInfo(companyPath);
            var totalSize = dirInfo.EnumerateFiles("*", SearchOption.AllDirectories).Sum(fi => fi.Length);
            
            return totalSize;
        }

        public async Task<StorageBreakdown> GetCompanyStorageBreakdownAsync(int companyId)
        {
            var companyFolder = companyId.ToString();
            var companyPath = Path.Combine(_env.ContentRootPath, "uploads", companyFolder);

            if (!Directory.Exists(companyPath))
                return new StorageBreakdown(0, 0, 0, 0);

            var dirInfo = new DirectoryInfo(companyPath);
            var files = dirInfo.EnumerateFiles("*", SearchOption.AllDirectories);

            long total = 0;
            long videos = 0;
            long images = 0;
            long docs = 0;

            var videoExts = new[] { ".mp4", ".mov", ".avi", ".mkv", ".webm" };
            var imageExts = new[] { ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp" };
            var docExts = new[] { ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt" };

            foreach (var file in files)
            {
                total += file.Length;
                var ext = file.Extension.ToLower();
                if (videoExts.Contains(ext)) videos += file.Length;
                else if (imageExts.Contains(ext)) images += file.Length;
                else if (docExts.Contains(ext)) docs += file.Length;
            }

            return new StorageBreakdown(total, videos, images, docs);
        }

        private string MakeFileNameSafe(string fileName)
        {
            if (string.IsNullOrEmpty(fileName)) return "file";
            var extension = Path.GetExtension(fileName);
            var nameOnly = Path.GetFileNameWithoutExtension(fileName);

            var safeName = new string(nameOnly.Select(c => char.IsLetterOrDigit(c) ? c : '-').ToArray());
            
            while (safeName.Contains("--")) safeName = safeName.Replace("--", "-");
            
            return safeName.Trim('-') + extension;
        }
    }
}