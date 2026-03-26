namespace ELearning.Api.DTOs;

public record UserNotificationDto(
    long Id,
    string Title,
    string? Content,
    string Type,
    string Severity,
    bool IsRead,
    DateTime? ReadAt,
    string? LinkUrl,
    DateTime CreatedAt
);

public record MarkNotificationReadDto(bool IsRead = true);

