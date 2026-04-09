using System.Text.Json;
using ELearning.Api.Data;
using ELearning.Api.DTOs;
using ELearning.Api.Models;
using ELearning.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ELearning.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CourseController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _config;
    private readonly IAuditService _audit;
    private readonly ILogger<CourseController> _logger;

    public CourseController(ApplicationDbContext context, IWebHostEnvironment env, IConfiguration config, IAuditService audit, ILogger<CourseController> logger)
    {
        _context = context;
        _env = env;
        _config = config;
        _audit = audit;
        _logger = logger;
    }

    private async Task<int?> GetUserCompanyIdAsync()
    {
        var claim = User.FindFirst("CompanyId")?.Value
            ?? User.FindFirst(c => string.Equals(c.Type, "CompanyId", StringComparison.OrdinalIgnoreCase))?.Value;
        if (int.TryParse(claim, out int cid)) return cid;
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            return user?.CompanyId;
        }
        return null;
    }

    private string GetBaseUrl()
    {
        var configuredDomain = _config["AppSettings:AppDomain"];
        if (!string.IsNullOrEmpty(configuredDomain)) return configuredDomain.TrimEnd('/');
        
        if (Request.Headers.TryGetValue("X-Forwarded-Host", out var forwardedHost))
        {
            var proto = Request.Headers["X-Forwarded-Proto"].FirstOrDefault() ?? "https";
            return $"{proto}://{forwardedHost}";
        }

        var host = Request.Host.Value ?? string.Empty;
        if (host.Contains("localhost:5211")) return $"{Request.Scheme}://{host.Replace("5211", "5173")}";
        return $"{Request.Scheme}://{host}";
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CourseSummaryDto>>> GetCourses()
    {
        try
        {
            var query = _context.Courses.Include(c => c.Category).Include(c => c.Company).AsQueryable();
            if (!User.IsInRole("SuperAdmin"))
            {
                var companyId = await GetUserCompanyIdAsync() ?? 0;
                if (companyId > 0)
                    query = query.Where(c => c.CompanyId == companyId || c.CompanyId == null);
                else
                    query = query.Where(c => c.CompanyId == null);
            }
            var baseUrl = GetBaseUrl();
            return await query.OrderByDescending(c => c.CreatedAt).Select(c => new CourseSummaryDto(c.Id, c.CourseCode, c.Title, c.ThumbnailUrl != null ? (c.ThumbnailUrl.StartsWith("http") ? c.ThumbnailUrl : baseUrl + c.ThumbnailUrl) : null, c.CategoryId, c.Category != null ? c.Category.Name : "Chưa phân loại", c.CompanyId, c.Company != null ? c.Company.CompanyName : "Hệ thống tổng", null, c.IsPublished, c.CreatedAt, c.StartDate, c.EndDate)).ToListAsync();
        }
        catch (Exception ex) { return StatusCode(500, $"Lỗi: {ex.Message}"); }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CourseDetailDto>> GetCourseDetail(int id)
    {
        try
        {
            var course = await _context.Courses.Include(c => c.Lessons).Include(c => c.Category).FirstOrDefaultAsync(c => c.Id == id);
            if (course == null) return NotFound();
            var lessons = course.Lessons.OrderBy(l => l.OrderIndex).ToList();

            var lessonDtos = lessons.Select(l =>
            {
                List<LessonSectionDto>? sections = null;
                if (!string.IsNullOrEmpty(l.SectionsJson))
                {
                    try
                    {
                        var jsonOpts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                        var list = JsonSerializer.Deserialize<List<JsonSection>>(l.SectionsJson, jsonOpts);
                        sections = list?.Select(s =>
                        {
                            var urls = (s.VideoUrls != null && s.VideoUrls.Count > 0)
                                ? s.VideoUrls
                                : (!string.IsNullOrEmpty(s.VideoUrl) ? new List<string> { s.VideoUrl } : null);
                            return new LessonSectionDto(s.Title ?? "", s.Content, s.ShowVideo, s.ShowQuiz, s.VideoUrl, urls);
                        }).ToList();
                    }
                    catch { }
                }
                if (sections == null)
                {
                    var hasContent = !string.IsNullOrWhiteSpace(l.Overview) || !string.IsNullOrWhiteSpace(l.Content) || !string.IsNullOrWhiteSpace(l.ReviewContent) || !string.IsNullOrWhiteSpace(l.EssayQuestion);
                    var hasMedia = l.VideoUrl1 != null || l.VideoUrl2 != null || l.VideoUrl3 != null || l.VideoUrl4 != null || l.VideoUrl5 != null;
                    var hasQuiz = l.ShowQuiz1 || l.ShowQuiz2 || l.ShowQuiz3 || l.ShowQuiz4 || l.ShowQuiz5;
                    if (!hasContent && !hasMedia && !hasQuiz)
                    {
                        sections = new List<LessonSectionDto> { new("1. Phần nội dung", null, false, false, null) };
                    }
                    else
                    {
                        sections = new List<LessonSectionDto>
                        {
                            new(l.Section1Title ?? "1. Giới thiệu bài học", l.Overview, l.ShowVideo1, l.ShowQuiz1, l.VideoUrl1),
                            new(l.Section2Title ?? "2. Bài giảng chi tiết", l.Content, l.ShowVideo2, l.ShowQuiz2, l.VideoUrl2),
                            new(l.Section3Title ?? "3. Phần ôn tập", l.ReviewContent, l.ShowVideo3, l.ShowQuiz3, l.VideoUrl3),
                            new(l.Section4Title ?? "4. Câu hỏi tự luận", l.EssayQuestion, l.ShowVideo4, l.ShowQuiz4, l.VideoUrl4),
                            new(l.Section5Title ?? "5. Tổng kết bài học", null, l.ShowVideo5, l.ShowQuiz5, l.VideoUrl5)
                        };
                    }
                }
                return new LessonDto(
                    l.Id, l.Title, l.Overview, l.Content, null, l.ReviewContent, l.EssayQuestion, l.ScheduledDate, l.LessonType ?? "Video", l.DurationInMinutes, l.OrderIndex,
                    sections,
                    l.Section1Title, l.Section2Title, l.Section3Title, l.Section4Title, l.Section5Title,
                    l.VideoUrl1 != null ? (l.VideoUrl1.StartsWith("http") ? l.VideoUrl1 : l.VideoUrl1) : null,
                    l.VideoUrl2 != null ? (l.VideoUrl2.StartsWith("http") ? l.VideoUrl2 : l.VideoUrl2) : null,
                    l.VideoUrl3 != null ? (l.VideoUrl3.StartsWith("http") ? l.VideoUrl3 : l.VideoUrl3) : null,
                    l.VideoUrl4 != null ? (l.VideoUrl4.StartsWith("http") ? l.VideoUrl4 : l.VideoUrl4) : null,
                    l.VideoUrl5 != null ? (l.VideoUrl5.StartsWith("http") ? l.VideoUrl5 : l.VideoUrl5) : null,
                    l.ExternalVideoUrl1, l.ExternalVideoUrl2, l.ExternalVideoUrl3, l.ExternalVideoUrl4, l.ExternalVideoUrl5,
                    l.ShowVideo1, l.ShowVideo2, l.ShowVideo3, l.ShowVideo4, l.ShowVideo5,
                    l.ShowQuiz1, l.ShowQuiz2, l.ShowQuiz3, l.ShowQuiz4, l.ShowQuiz5
                );
            }).ToList();

            return Ok(new CourseDetailDto(
                course.Id, course.CourseCode, course.Title, course.Description,
                course.ThumbnailUrl != null ? (course.ThumbnailUrl.StartsWith("http") ? course.ThumbnailUrl : course.ThumbnailUrl) : null,
                course.CategoryId, course.Category != null ? course.Category.Name : null, course.StartDate, course.EndDate, lessonDtos,
                course.ShowIntroVideo,
                course.IntroVideoUrl != null ? (course.IntroVideoUrl.StartsWith("http") ? course.IntroVideoUrl : course.IntroVideoUrl) : null,
                course.IntroExternalVideoUrl
            ));
        }
        catch (Exception ex)
        {
            var msg = ex.InnerException?.Message ?? ex.Message;
            return StatusCode(500, new { error = msg, detail = ex.ToString() });
        }
    }

    private async Task<string?> SaveVideoFile(IFormFile? file)
    {
        if (file == null || file.Length == 0) return null;
        var uploadDir = Path.Combine(_env.ContentRootPath, "uploads/videos");
        if (!Directory.Exists(uploadDir)) Directory.CreateDirectory(uploadDir);
        var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
        var filePath = Path.Combine(uploadDir, fileName);
        using (var stream = new FileStream(filePath, FileMode.Create)) { await file.CopyToAsync(stream); }
        return $"/uploads/videos/{fileName}";
    }

    [HttpPut("{id}")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UpdateCourse(int id, [FromForm] CreateCourseFormDto form)
    {
        try
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null) return NotFound();
            course.CourseCode = form.CourseCode ?? course.CourseCode;
            course.Title = form.Title ?? course.Title;
            course.Description = form.Description ?? course.Description;
            course.IsPublished = form.IsPublished;
            course.CategoryId = form.CategoryId ?? course.CategoryId;
            if (User.IsInRole("SuperAdmin"))
                course.CompanyId = form.CompanyId.HasValue && form.CompanyId.Value > 0 ? form.CompanyId : null;
            course.StartDate = form.StartDate ?? course.StartDate;
            course.EndDate = form.EndDate;
            course.ShowIntroVideo = form.ShowIntroVideo;
            course.IntroExternalVideoUrl = form.IntroExternalVideoUrl;
            var introVid = await SaveVideoFile(form.IntroVideoFile);
            if (introVid != null) course.IntroVideoUrl = introVid;
            await _context.SaveChangesAsync();
            await _audit.LogAsync("Update", "Course", id.ToString(), null, course.Title, "Cập nhật khóa học");
            return Ok();
        }
        catch (Exception ex) { return StatusCode(500, ex.Message); }
    }

    [HttpPut("lessons/{id}")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UpdateLesson(int id, [FromForm] CreateLessonFormDto form)
    {
        try
        {
            var lesson = await _context.Lessons.FindAsync(id);
            if (lesson == null) return NotFound();

            lesson.Title = form.Title ?? lesson.Title;
            lesson.ScheduledDate = form.ScheduledDate;

            if (!string.IsNullOrEmpty(form.SectionsJson))
            {
                var jsonOpts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var sections = JsonSerializer.Deserialize<List<JsonSection>>(form.SectionsJson, jsonOpts);
                if (sections != null && sections.Count > 0)
                {
                    var formFiles = Request.Form.Files;
                    if (formFiles.Count == 0)
                    {
                        var requestForm = await Request.ReadFormAsync();
                        formFiles = requestForm.Files;
                    }
                    foreach (var file in formFiles)
                    {
                        var name = file.Name ?? "";
                        if (name.StartsWith("VideoFile_") && name.Length > 10)
                        {
                            var parts = name.Split('_');
                            if (parts.Length >= 3 && int.TryParse(parts[1], out int sectionIndex) && sectionIndex >= 0 && sectionIndex < sections.Count)
                            {
                                sections[sectionIndex].VideoUrls ??= new List<string>();
                                var url = await SaveVideoFile(file);
                                if (url != null) sections[sectionIndex].VideoUrls!.Add(url);
                            }
                        }
                    }
                    for (int i = 0; i < sections.Count; i++)
                    {
                        var sec = sections[i];
                        if (sec?.VideoUrls != null && sec.VideoUrls.Count > 0)
                            sec.VideoUrl = sec.VideoUrls[0];
                    }
                    lesson.SectionsJson = JsonSerializer.Serialize(sections);
                    lesson.Overview = sections.Count > 0 ? sections[0]?.Content : null;
                    lesson.Content = sections.Count > 1 ? sections[1].Content : null;
                    lesson.ReviewContent = sections.Count > 2 ? sections[2].Content : null;
                    lesson.EssayQuestion = sections.Count > 3 ? sections[3].Content : null;
                    lesson.Section1Title = sections.Count > 0 ? sections[0]?.Title : null;
                    lesson.Section2Title = sections.Count > 1 ? sections[1]?.Title : null;
                    lesson.Section3Title = sections.Count > 2 ? sections[2]?.Title : null;
                    lesson.Section4Title = sections.Count > 3 ? sections[3]?.Title : null;
                    lesson.Section5Title = sections.Count > 4 ? sections[4]?.Title : null;
                    lesson.ShowVideo1 = sections.Count > 0 && sections[0].ShowVideo;
                    lesson.ShowVideo2 = sections.Count > 1 && sections[1].ShowVideo;
                    lesson.ShowVideo3 = sections.Count > 2 && sections[2].ShowVideo;
                    lesson.ShowVideo4 = sections.Count > 3 && sections[3].ShowVideo;
                    lesson.ShowVideo5 = sections.Count > 4 && sections[4].ShowVideo;
                    lesson.ShowQuiz1 = sections.Count > 0 && sections[0].ShowQuiz;
                    lesson.ShowQuiz2 = sections.Count > 1 && sections[1].ShowQuiz;
                    lesson.ShowQuiz3 = sections.Count > 2 && sections[2].ShowQuiz;
                    lesson.ShowQuiz4 = sections.Count > 3 && sections[3].ShowQuiz;
                    lesson.ShowQuiz5 = sections.Count > 4 && sections[4].ShowQuiz;
                    lesson.VideoUrl1 = sections.Count > 0 ? (sections[0].VideoUrls?.FirstOrDefault() ?? sections[0].VideoUrl) : null;
                    lesson.VideoUrl2 = sections.Count > 1 ? (sections[1].VideoUrls?.FirstOrDefault() ?? sections[1].VideoUrl) : null;
                    lesson.VideoUrl3 = sections.Count > 2 ? (sections[2].VideoUrls?.FirstOrDefault() ?? sections[2].VideoUrl) : null;
                    lesson.VideoUrl4 = sections.Count > 3 ? (sections[3].VideoUrls?.FirstOrDefault() ?? sections[3].VideoUrl) : null;
                    lesson.VideoUrl5 = sections.Count > 4 ? (sections[4].VideoUrls?.FirstOrDefault() ?? sections[4].VideoUrl) : null;
                }
                await _context.SaveChangesAsync();
                var sectionDtos = (sections ?? new List<JsonSection>()).Select(s =>
                {
                    var urls = (s.VideoUrls != null && s.VideoUrls.Count > 0) ? s.VideoUrls : (!string.IsNullOrEmpty(s.VideoUrl) ? new List<string> { s.VideoUrl } : null);
                    return new { title = s.Title, content = s.Content, showVideo = s.ShowVideo, showQuiz = s.ShowQuiz, videoUrls = urls ?? new List<string>() };
                }).ToList();
                return Ok(new { sections = sectionDtos });
            }
            else
            {
                lesson.Overview = form.Overview;
                lesson.Content = form.Content;
                lesson.ReviewContent = form.ReviewContent;
                lesson.EssayQuestion = form.EssayQuestion;
                lesson.Section1Title = form.Section1Title ?? lesson.Section1Title;
                lesson.Section2Title = form.Section2Title ?? lesson.Section2Title;
                lesson.Section3Title = form.Section3Title ?? lesson.Section3Title;
                lesson.Section4Title = form.Section4Title ?? lesson.Section4Title;
                lesson.Section5Title = form.Section5Title ?? lesson.Section5Title;
                lesson.ShowVideo1 = form.ShowVideo1; lesson.ShowVideo2 = form.ShowVideo2;
                lesson.ShowVideo3 = form.ShowVideo3; lesson.ShowVideo4 = form.ShowVideo4;
                lesson.ShowVideo5 = form.ShowVideo5;
                lesson.ShowQuiz1 = form.ShowQuiz1; lesson.ShowQuiz2 = form.ShowQuiz2;
                lesson.ShowQuiz3 = form.ShowQuiz3; lesson.ShowQuiz4 = form.ShowQuiz4;
                lesson.ShowQuiz5 = form.ShowQuiz5;
                lesson.ExternalVideoUrl1 = form.ExternalVideoUrl1; lesson.ExternalVideoUrl2 = form.ExternalVideoUrl2;
                lesson.ExternalVideoUrl3 = form.ExternalVideoUrl3; lesson.ExternalVideoUrl4 = form.ExternalVideoUrl4;
                lesson.ExternalVideoUrl5 = form.ExternalVideoUrl5;
                var v1 = await SaveVideoFile(form.VideoFile1); if (v1 != null) lesson.VideoUrl1 = v1;
                var v2 = await SaveVideoFile(form.VideoFile2); if (v2 != null) lesson.VideoUrl2 = v2;
                var v3 = await SaveVideoFile(form.VideoFile3); if (v3 != null) lesson.VideoUrl3 = v3;
                var v4 = await SaveVideoFile(form.VideoFile4); if (v4 != null) lesson.VideoUrl4 = v4;
                var v5 = await SaveVideoFile(form.VideoFile5); if (v5 != null) lesson.VideoUrl5 = v5;
            }

            await _context.SaveChangesAsync();
            await _audit.LogAsync("Update", "Lesson", id.ToString(), null, lesson.Title, "Cập nhật bài học");
            return Ok();
        }
        catch (Exception ex) { return StatusCode(500, ex.Message); }
    }

    [HttpPost("lessons")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> CreateLesson([FromForm] CreateLessonFormDto form)
    {
        try
        {
            var lesson = new Lesson { CourseId = form.CourseId, Title = form.Title ?? "Bài học mới", OrderIndex = form.OrderIndex };
            _context.Lessons.Add(lesson);
            await _context.SaveChangesAsync();
            await _audit.LogAsync("Create", "Lesson", lesson.Id.ToString(), null, lesson.Title, "Tạo bài học mới");
            return Ok(new { Id = lesson.Id, Title = lesson.Title });
        }
        catch (Exception ex) { return StatusCode(500, ex.Message); }
    }

    [HttpPost("lessons/reorder")]
    public async Task<IActionResult> ReorderLessons([FromBody] ReorderLessonsDto dto)
    {
        try {
            for (int i = 0; i < dto.LessonIds.Count; i++) {
                var lesson = await _context.Lessons.FindAsync(dto.LessonIds[i]);
                if (lesson != null) lesson.OrderIndex = i + 1;
            }
            await _context.SaveChangesAsync();
            await _audit.LogAsync("Update", "Lesson", null, null, null, "Sắp xếp lại thứ tự bài học");
            return Ok();
        } catch (Exception ex) { return StatusCode(500, ex.Message); }
    }

    [HttpDelete("{id}/video")]
    public async Task<IActionResult> DeleteIntroVideo(int id)
    {
        try
        {
            var course = await _context.Courses.FindAsync(id);
            if (course == null) return NotFound();
            if (!string.IsNullOrEmpty(course.IntroVideoUrl))
            {
                var filePath = Path.Combine(_env.ContentRootPath, course.IntroVideoUrl.TrimStart('/'));
                if (System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath);
                course.IntroVideoUrl = null;
                await _context.SaveChangesAsync();
                await _audit.LogAsync("Delete", "Course", id.ToString(), null, null, "Xóa video giới thiệu khóa học");
            }
            return Ok();
        }
        catch (Exception ex) { return StatusCode(500, ex.Message); }
    }

    [HttpDelete("lessons/{id}/video/{num}")]
    public async Task<IActionResult> DeleteLessonVideo(int id, int num, [FromQuery] int? videoIndex = null)
    {
        try
        {
            var lesson = await _context.Lessons.FindAsync(id);
            if (lesson == null) return NotFound();
            string? videoUrl = null;
            if (!string.IsNullOrEmpty(lesson.SectionsJson))
            {
                var jsonOpts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var sections = JsonSerializer.Deserialize<List<JsonSection>>(lesson.SectionsJson, jsonOpts);
                if (sections != null && num - 1 < sections.Count)
                {
                    var sec = sections[num - 1];
                    var urls = sec.VideoUrls ?? (!string.IsNullOrEmpty(sec.VideoUrl) ? new List<string> { sec.VideoUrl } : null);
                    if (urls != null && urls.Count > 0)
                    {
                        var idx = videoIndex ?? 0;
                        if (idx >= 0 && idx < urls.Count)
                        {
                            videoUrl = urls[idx];
                            urls.RemoveAt(idx);
                            if (urls.Count == 0) { sec.VideoUrls = null; sec.VideoUrl = null; }
                            else { sec.VideoUrl = urls[0]; sec.VideoUrls = urls; }
                            lesson.SectionsJson = JsonSerializer.Serialize(sections);
                            if (num <= 5) { var v = urls.Count > 0 ? urls[0] : null; switch(num) { case 1: lesson.VideoUrl1=v; break; case 2: lesson.VideoUrl2=v; break; case 3: lesson.VideoUrl3=v; break; case 4: lesson.VideoUrl4=v; break; case 5: lesson.VideoUrl5=v; break; } }
                        }
                    }
                    else if (videoIndex == null && !string.IsNullOrEmpty(sec.VideoUrl))
                    {
                        videoUrl = sec.VideoUrl;
                        sec.VideoUrl = null;
                        lesson.SectionsJson = JsonSerializer.Serialize(sections);
                        if (num <= 5) { switch(num) { case 1: lesson.VideoUrl1=null; break; case 2: lesson.VideoUrl2=null; break; case 3: lesson.VideoUrl3=null; break; case 4: lesson.VideoUrl4=null; break; case 5: lesson.VideoUrl5=null; break; } }
                    }
                }
            }
            else
            {
                videoUrl = num switch { 1=>lesson.VideoUrl1, 2=>lesson.VideoUrl2, 3=>lesson.VideoUrl3, 4=>lesson.VideoUrl4, 5=>lesson.VideoUrl5, _=>null };
                if (!string.IsNullOrEmpty(videoUrl) && videoIndex == null)
                {
                    switch(num) { case 1: lesson.VideoUrl1=null; break; case 2: lesson.VideoUrl2=null; break; case 3: lesson.VideoUrl3=null; break; case 4: lesson.VideoUrl4=null; break; case 5: lesson.VideoUrl5=null; break; }
                }
                else
                {
                    videoUrl = null;
                }
            }
            if (!string.IsNullOrEmpty(videoUrl))
            {
                var filePath = Path.Combine(_env.ContentRootPath, videoUrl.TrimStart('/'));
                if (System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath);
                await _context.SaveChangesAsync();
                await _audit.LogAsync("Delete", "Lesson", id.ToString(), null, null, $"Xóa video bài học mục {num}");
            }
            return Ok();
        }
        catch (Exception ex) { return StatusCode(500, ex.Message); }
    }

    [HttpDelete("lessons/{id}")]
    public async Task<IActionResult> DeleteLesson(int id)
    {
        try
        {
            var exists = await _context.Lessons.AnyAsync(l => l.Id == id);
            if (!exists) return NotFound();

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Xóa LessonProgress
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM LessonProgresses WHERE LessonId = {0}", id);
                // 2. Bỏ liên kết Quiz
                await _context.Database.ExecuteSqlRawAsync("UPDATE Quizzes SET LessonId = NULL WHERE LessonId = {0}", id);
                // 3. Xóa Lesson
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Lessons WHERE Id = {0}", id);

                await transaction.CommitAsync();
                await _audit.LogAsync("Delete", "Lesson", id.ToString(), null, null, "Xóa bài học");
                return Ok();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        catch (Exception ex)
        {
            var msg = ex.InnerException?.Message ?? ex.Message;
            return StatusCode(500, msg);
        }
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> CreateCourse([FromForm] CreateCourseFormDto form)
    {
        try
        {
            if (form.CategoryId == null || form.CategoryId == 0)
                return BadRequest("Vui lòng chọn danh mục khóa học.");

            int? companyId = form.CompanyId.HasValue && form.CompanyId.Value > 0 ? form.CompanyId : null;
            if (companyId == null && !User.IsInRole("SuperAdmin"))
            {
                var claim = User.FindFirst("CompanyId")?.Value;
                if (int.TryParse(claim, out int cid) && cid > 0) companyId = cid;
            }

            var course = new Course 
            { 
                CourseCode = form.CourseCode ?? "", 
                Title = form.Title ?? "", 
                Description = form.Description, 
                CategoryId = form.CategoryId.Value, 
                CompanyId = companyId,
                IsPublished = form.IsPublished,
                StartDate = form.StartDate ?? DateTime.UtcNow, 
                EndDate = form.EndDate,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            _context.Courses.Add(course);
            await _context.SaveChangesAsync();
            try
            {
                await _audit.LogAsync("Create", "Course", course.Id.ToString(), null, course.Title, $"Khóa học {course.Title} đã được tạo");
            }
            catch (Exception auditEx)
            {
                _logger.LogError(auditEx, "Audit log failed for Create Course {CourseId}", course.Id);
            }
            return Ok();
        }
        catch (Exception ex) 
        { 
            var message = ex.InnerException != null ? ex.Message + " | " + ex.InnerException.Message : ex.Message;
            return StatusCode(500, message); 
        }
    }

    [HttpGet("categories")]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetCategories() 
    { 
        var query = _context.Categories.AsQueryable();
        if (!User.IsInRole("SuperAdmin"))
        {
            var companyId = await GetUserCompanyIdAsync() ?? 0;
            if (companyId > 0)
                query = query.Where(c => c.CompanyId == companyId);
            else
                query = query.Where(c => c.CompanyId == null);
        }
        return await query
            .Select(c => new CategoryDto(c.Id, c.Name, c.Description, c.CompanyId))
            .ToListAsync(); 
    }

    [HttpPost("categories")]
    public async Task<ActionResult<CategoryDto>> CreateCategory([FromBody] CategoryDto dto)
    {
        try
        {
            var companyId = dto.CompanyId;
            if (!User.IsInRole("SuperAdmin"))
            {
                var cid = await GetUserCompanyIdAsync();
                companyId = cid > 0 ? cid : null;
            }

            var category = new Category
            {
                Name = dto.Name,
                Description = dto.Description,
                CompanyId = companyId
            };
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();
            await _audit.LogAsync("Create", "Category", category.Id.ToString(), null, category.Name, "Tạo danh mục khóa học");
            return Ok(new CategoryDto(category.Id, category.Name, category.Description, category.CompanyId));
        }
        catch (Exception ex) { return StatusCode(500, ex.Message); }
    }

    [HttpPut("categories/{id}")]
    public async Task<IActionResult> UpdateCategory(int id, [FromBody] CategoryDto dto)
    {
        try
        {
            var existing = await _context.Categories.FindAsync(id);
            if (existing == null) return NotFound();
            
            if (!User.IsInRole("SuperAdmin"))
            {
                var companyId = await GetUserCompanyIdAsync();
                if (existing.CompanyId != companyId) return StatusCode(403, "Không có quyền chỉnh sửa danh mục này.");
            }

            existing.Name = dto.Name;
            existing.Description = dto.Description;
            await _context.SaveChangesAsync();
            await _audit.LogAsync("Update", "Category", id.ToString(), null, existing.Name, "Cập nhật danh mục");
            return Ok();
        }
        catch (Exception ex) { return StatusCode(500, ex.Message); }
    }

    [HttpDelete("categories/{id}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        try
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null) return NotFound();

            if (!User.IsInRole("SuperAdmin"))
            {
                var companyId = await GetUserCompanyIdAsync();
                if (category.CompanyId != companyId) return StatusCode(403, "Không có quyền xóa danh mục này.");
            }

            var name = category.Name;
            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();
            await _audit.LogAsync("Delete", "Category", id.ToString(), name, null, "Xóa danh mục khóa học");
            return Ok();
        }
        catch (Exception ex) { return StatusCode(500, ex.Message); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCourse(int id)
    {
        var course = await _context.Courses.FindAsync(id);
        if (course == null) return NotFound();
        var title = course.Title;
        _context.Courses.Remove(course);
        await _context.SaveChangesAsync();
        await _audit.LogAsync("Delete", "Course", id.ToString(), title, null, "Xóa khóa học");
        return Ok();
    }
}
