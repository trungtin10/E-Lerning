using System;
using System.Collections.Generic;

namespace ELearning.Api.DTOs;

public record UserCourseProgressDto(
    int CourseId,
    string CourseTitle,
    double ProgressPercentage,
    List<UserLessonProgressDto> Lessons
);

public record UserLessonProgressDto(
    int LessonId,
    string Title,
    string? Overview,
    string? Content,
    string? ReviewContent,
    string? EssayQuestion,
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
    bool ShowQuiz5,
    string? Section1Title,
    string? Section2Title,
    string? Section3Title,
    string? Section4Title,
    string? Section5Title,
    string LessonType,
    bool IsCompleted,
    DateTime? CompletedAt
);

public class CompleteLessonDto
{
    public int LessonId { get; set; }
}

public class EnrollmentRequestDto
{
    public int CourseId { get; set; }
}

public record MyEnrolledCourseDto(
    int Id,
    string? CourseCode,
    string? Title,
    string? ThumbnailUrl,
    string? CategoryName,
    DateTime StartDate,
    DateTime? EndDate,
    double ProgressPercentage,
    string Status,
    DateTime EnrolledAt
);
