using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;

namespace ELearning.Api.DTOs;

public record CourseSummaryDto(
    int Id,
    string? CourseCode,
    string? Title,
    string? ThumbnailUrl,
    int CategoryId,
    string? CategoryName,
    int? CompanyId,
    string? CompanyName,
    string? InstructorName,
    bool IsPublished,
    DateTime CreatedAt,
    DateTime StartDate,
    DateTime? EndDate
);

public record CourseDetailDto(
    int Id,
    string? CourseCode,
    string? Title,
    string? Description,
    string? ThumbnailUrl,
    int CategoryId,
    string? CategoryName,
    DateTime StartDate,
    DateTime? EndDate,
    List<LessonDto> Lessons,
    bool ShowIntroVideo = false,
    string? IntroVideoUrl = null,
    string? IntroExternalVideoUrl = null,
    string? IntroSectionsJson = null,
    List<string>? IntroDocUrls = null,
    bool IsPublished = false,
    bool ShowIntroDocs = false
);

public record LessonSectionDto(string Title, string? Content, bool ShowVideo, bool ShowQuiz, bool ShowDocs = false, string? VideoUrl = null, List<string>? VideoUrls = null, List<string>? DocUrls = null);

public class JsonSection
{
    [System.Text.Json.Serialization.JsonPropertyName("title")]
    public string? Title { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("content")]
    public string? Content { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("showVideo")]
    public bool ShowVideo { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("showQuiz")]
    public bool ShowQuiz { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("showDocs")]
    public bool ShowDocs { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("videoUrl")]
    public string? VideoUrl { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("videoUrls")]
    public List<string>? VideoUrls { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("docUrls")]
    public List<string>? DocUrls { get; set; }
}

public record LessonDto(
    int Id,
    string? Title,
    string? Overview,
    string? Content,
    string? VideoUrl,
    string? ReviewContent,
    string? EssayQuestion,
    DateTime? ScheduledDate,
    string? LessonType,
    int DurationInMinutes,
    int OrderIndex,
    List<LessonSectionDto>? Sections,
    string? Section1Title,
    string? Section2Title,
    string? Section3Title,
    string? Section4Title,
    string? Section5Title,
    string? VideoUrl1,
    string? VideoUrl2,
    string? VideoUrl3,
    string? VideoUrl4,
    string? VideoUrl5,
    string? ExternalVideoUrl1,
    string? ExternalVideoUrl2,
    string? ExternalVideoUrl3,
    string? ExternalVideoUrl4,
    string? ExternalVideoUrl5,
    bool ShowVideo1,
    bool ShowVideo2,
    bool ShowVideo3,
    bool ShowVideo4,
    bool ShowVideo5,
    bool ShowQuiz1,
    bool ShowQuiz2,
    bool ShowQuiz3,
    bool ShowQuiz4,
    bool ShowQuiz5
);

public class CreateLessonFormDto
{
    public int CourseId { get; set; }
    public string Title { get; set; } = null!;
    public string? LessonType { get; set; }
    public int OrderIndex { get; set; }
    public string? Overview { get; set; }
    public string? Content { get; set; }
    public string? ReviewContent { get; set; }
    public string? EssayQuestion { get; set; }
    public DateTime? ScheduledDate { get; set; }

    public IFormFile? VideoFile1 { get; set; }
    public IFormFile? VideoFile2 { get; set; }
    public IFormFile? VideoFile3 { get; set; }
    public IFormFile? VideoFile4 { get; set; }
    public IFormFile? VideoFile5 { get; set; }
    public IFormFile? VideoFile0 { get; set; }
    public IFormFile? VideoFile6 { get; set; }
    public IFormFile? VideoFile7 { get; set; }
    public IFormFile? VideoFile8 { get; set; }
    public IFormFile? VideoFile9 { get; set; }
    public IFormFile? VideoFile10 { get; set; }
    public IFormFile? VideoFile11 { get; set; }
    public IFormFile? VideoFile12 { get; set; }
    public IFormFile? VideoFile13 { get; set; }
    public IFormFile? VideoFile14 { get; set; }
    public IFormFile? VideoFile15 { get; set; }
    public IFormFile? VideoFile16 { get; set; }
    public IFormFile? VideoFile17 { get; set; }
    public IFormFile? VideoFile18 { get; set; }
    public IFormFile? VideoFile19 { get; set; }

    public string? ExternalVideoUrl1 { get; set; }
    public string? ExternalVideoUrl2 { get; set; }
    public string? ExternalVideoUrl3 { get; set; }
    public string? ExternalVideoUrl4 { get; set; }
    public string? ExternalVideoUrl5 { get; set; }

    public string? Section1Title { get; set; }
    public string? Section2Title { get; set; }
    public string? Section3Title { get; set; }
    public string? Section4Title { get; set; }
    public string? Section5Title { get; set; }

    public string? SectionsJson { get; set; }

    public bool ShowVideo1 { get; set; }
    public bool ShowVideo2 { get; set; }
    public bool ShowVideo3 { get; set; }
    public bool ShowVideo4 { get; set; }
    public bool ShowVideo5 { get; set; }

    public bool ShowQuiz1 { get; set; }
    public bool ShowQuiz2 { get; set; }
    public bool ShowQuiz3 { get; set; }
    public bool ShowQuiz4 { get; set; }
    public bool ShowQuiz5 { get; set; }
}

public class CreateCourseFormDto
{
    public string? CourseCode { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public int? CategoryId { get; set; }
    public int? CompanyId { get; set; }
    public bool? IsPublished { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public IFormFile? ThumbnailFile { get; set; }

    public bool? ShowIntroVideo { get; set; }
    public bool? ShowIntroDocs { get; set; }
    public string? IntroExternalVideoUrl { get; set; }
    public IFormFile? IntroVideoFile { get; set; }
    public string? IntroSectionsJson { get; set; }
    public string? IntroDocUrlsJson { get; set; }
}

public record ReorderLessonsDto(List<int> LessonIds);
