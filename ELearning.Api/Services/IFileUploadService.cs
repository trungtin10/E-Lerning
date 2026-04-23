using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace ELearning.Api.Services
{
    public interface IFileUploadService
    {
        /// <summary>
        /// Saves a file to a company-specific directory.
        /// </summary>
        /// <param name="file">The file to save.</param>
        /// <param name="companyId">The company ID. Use null or 0 for system/global files.</param>
        /// <param name="subDir">Subdirectory like "branding", "media", "documents", "videos", "avatars", "certificates", "tickets".</param>
        /// <param name="preferredFileName">Optional preferred filename. If null, a Guid-based name is generated.</param>
        /// <returns>The relative URL of the saved file.</returns>
        Task<string> SaveFileAsync(IFormFile file, int? companyId, string subDir, string? preferredFileName = null);

        /// <summary>
        /// Saves a byte array to a company-specific directory.
        /// </summary>
        Task<string> SaveFileAsync(byte[] content, string fileName, int? companyId, string subDir);

        /// <summary>
        /// Deletes a file and updates the company's storage usage.
        /// </summary>
        /// <param name="fileUrl">The relative URL of the file.</param>
        /// <param name="companyId">The company ID.</param>
        /// <returns>True if the file was deleted.</returns>
        Task<bool> DeleteFileAsync(string fileUrl, int? companyId);
        
        /// <summary>
        /// Gets the absolute physical path from a relative URL.
        /// </summary>
        string GetPhysicalPath(string fileUrl);

        /// <summary>
        /// Calculates the total storage usage of a company by scanning its directory.
        /// </summary>
        /// <param name="companyId">The company ID.</param>
        /// <returns>Total size in bytes.</returns>
        Task<long> GetCompanyStorageUsageAsync(int companyId);

        /// <summary>
        /// Initializes the root folder for a new company.
        /// </summary>
        void EnsureCompanyFolder(int companyId);

        /// <summary>
        /// Initializes a folder structure for a lesson.
        /// </summary>
        void EnsureLessonFolder(int companyId, int lessonId, int? courseId = null);

        /// <summary>
        /// Initializes a folder structure for a course (intro/, lessons/).
        /// </summary>
        void EnsureCourseFolder(int companyId, int courseId);

        /// <summary>
        /// Removes a course folder and all its contents.
        /// </summary>
        Task DeleteCourseFolderAsync(int companyId, int courseId);

        /// <summary>
        /// Removes a lesson folder and all its contents.
        /// </summary>
        Task DeleteLessonFolderAsync(int companyId, int lessonId, int? courseId = null);

        /// <summary>
        /// Removes empty directories inside the company upload folder.
        /// </summary>
        void CleanupEmptyFolders(int companyId);

        /// <summary>
        /// Returns a breakdown of storage usage by file type.
        /// </summary>
        Task<StorageBreakdown> GetCompanyStorageBreakdownAsync(int companyId);
    }

    public record StorageBreakdown(long Total, long Videos, long Images, long Documents);
}