-- Chạy script này nếu migration chưa được áp dụng
-- Thêm cột TotalLearningTimeMinutes vào bảng CourseEnrollments

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('CourseEnrollments') 
    AND name = 'TotalLearningTimeMinutes'
)
BEGIN
    ALTER TABLE [CourseEnrollments] ADD [TotalLearningTimeMinutes] int NOT NULL DEFAULT 0;
END
GO
