namespace ELearning.Api.DTOs;

/// <summary>Danh sách học viên với tiến độ và kết quả bài làm (cho Admin). EnrollmentId=0, CourseId=0 khi user chưa đăng ký khóa nào.</summary>
public record LearnerEnrollmentDto(
    int EnrollmentId,
    string UserId,
    string FullName,
    string? Email,
    string? UserName,
    string? CompanyName,
    int CourseId,
    string CourseTitle,
    string? CourseCode,
    double ProgressPercentage,
    int TotalLearningTimeMinutes,
    string Status,
    DateTime EnrolledAt,
    DateTime? CompletedAt,
    int CompletedLessons,
    int TotalLessons,
    int QuizAttemptsCount,
    int QuizPassedCount,
    bool HasStartedLearning
);

/// <summary>Chi tiết tiến độ học viên trong một khóa</summary>
public record LearnerProgressDetailDto(
    int EnrollmentId,
    string UserName,
    string CourseTitle,
    double ProgressPercentage,
    int TotalLearningTimeMinutes,
    string Status,
    List<LearnerLessonProgressDto> LessonProgress,
    List<LearnerQuizAttemptDto> QuizAttempts,
    List<LearnerBehaviorEventDto> BehaviorEvents
);

public record LearnerLessonProgressDto(
    int LessonId,
    string LessonTitle,
    int OrderIndex,
    bool IsCompleted,
    DateTime? CompletedAt
);

public record LearnerQuizAttemptDto(
    int AttemptId,
    int QuizId,
    string QuizTitle,
    int Score,
    int CorrectAnswers,
    int TotalQuestions,
    bool IsPassed,
    DateTime CompletedAt
);

/// <summary>DTO ghi nhận hành vi học viên (tracking)</summary>
public record TrackBehaviorEventDto(
    int CourseId,
    string EventType,
    string? EntityType,
    string? EntityId,
    string? Metadata
);

/// <summary>Một sự kiện hành vi trong timeline</summary>
public record LearnerBehaviorEventDto(
    long Id,
    string EventType,
    string? EntityType,
    string? EntityId,
    string? Metadata,
    DateTime CreatedAt
);
