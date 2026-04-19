using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using System;
using System.IO;
using System.Threading.Tasks;

namespace ELearning.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MediaController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public MediaController(IWebHostEnvironment env)
        {
            _env = env;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Không có file nào được chọn.");

            try
            {
                var uploadDir = Path.Combine(_env.ContentRootPath, "uploads");
                if (!Directory.Exists(uploadDir))
                    Directory.CreateDirectory(uploadDir);

                var fileExtension = Path.GetExtension(file.FileName).ToLower();
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".pdf", ".docx", ".xlsx" };
                
                // Note: Simplified for now, you might want more strict validation
                // if (!Array.Exists(allowedExtensions, e => e == fileExtension))
                //    return BadRequest("Định dạng file không được hỗ trợ.");

                var fileName = $"media_{DateTime.Now:yyyyMMddHHmmss}_{Guid.NewGuid():N}{fileExtension}";
                var filePath = Path.Combine(uploadDir, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var url = $"/uploads/{fileName}";
                return Ok(new { url, fileName = file.FileName });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi khi upload file: {ex.Message}");
            }
        }
    }
}
