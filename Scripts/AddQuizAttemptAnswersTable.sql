-- Bảng lưu đáp án học viên đã chọn cho từng câu hỏi (chạy thủ công nếu migration không chạy được)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'QuizAttemptAnswers')
BEGIN
    CREATE TABLE QuizAttemptAnswers (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        QuizAttemptId INT NOT NULL,
        QuestionId INT NOT NULL,
        SelectedAnswerId INT NOT NULL,
        CONSTRAINT FK_QuizAttemptAnswers_QuizAttempts FOREIGN KEY (QuizAttemptId) REFERENCES QuizAttempts(Id) ON DELETE CASCADE,
        CONSTRAINT FK_QuizAttemptAnswers_Questions FOREIGN KEY (QuestionId) REFERENCES Questions(Id),
        CONSTRAINT FK_QuizAttemptAnswers_Answers FOREIGN KEY (SelectedAnswerId) REFERENCES Answers(Id)
    );
    CREATE INDEX IX_QuizAttemptAnswers_QuizAttemptId ON QuizAttemptAnswers(QuizAttemptId);
    CREATE INDEX IX_QuizAttemptAnswers_QuestionId ON QuizAttemptAnswers(QuestionId);
    CREATE INDEX IX_QuizAttemptAnswers_SelectedAnswerId ON QuizAttemptAnswers(SelectedAnswerId);
END
