using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ELearning.Api.Services;
using ELearning.Api.Data;
using System;
using System.Threading.Tasks;

namespace ELearning.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MediaController : BaseApiController
    {
        private readonly IFileUploadService _fileUpload;

        public MediaController(ApplicationDbContext context, IConfiguration config, IFileUploadService fileUpload)
            : base(context, config)
        {
            _fileUpload = fileUpload;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Không có file nào được chọn.");

            try
            {
                var companyId = await GetUserCompanyIdAsync();
                var url = await _fileUpload.SaveFileAsync(file, companyId, "media", file.FileName);
                return Ok(new { url, fileName = file.FileName });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi khi upload file: {ex.Message}");
            }
        }
    }
}
