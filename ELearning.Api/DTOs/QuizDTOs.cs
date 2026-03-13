using System;
using System.Collections.Generic;

namespace ELearning.Api.DTOs;

public record QuizDto(
    int Id,
    string Title,
    string? Description,
    int PassingScore,
    int? TimeLimitMinutes,
    List<QuestionDto> Questions
);

public record QuizDataDto(
    int Id,
    string Title,
    int PassingScore,
    int? TimeLimitMinutes,
    List<QuestionDto> Questions
);

public record QuestionDto(
    int Id,
    string Content,
    string QuestionType,
    List<AnswerDto> Answers
);

public record AnswerDto(
    int Id,
    string Content,
    bool? IsCorrect = null
);

public record CreateQuizDto(
    int CourseId,
    string Title,
    string? Description,
    int PassingScore = 80,
    int? TimeLimitMinutes = 15
);

public record UpdateQuizDto(int PassingScore, int? TimeLimitMinutes);

public record UpsertQuestionDto(
    int? Id,
    int QuizId,
    string Content,
    string QuestionType,
    List<UpsertAnswerDto> Answers
);

public record UpsertAnswerDto(
    int? Id,
    string Content,
    bool IsCorrect
);

public record SubmitQuizDto(
    int QuizId,
    List<UserAnswerDto> SelectedAnswers
);

public record UserAnswerDto(
    int QuestionId,
    int AnswerId
);

public record QuizResultDto(
    int Score,
    bool IsPassed,
    int CorrectAnswers,
    int TotalQuestions
);
