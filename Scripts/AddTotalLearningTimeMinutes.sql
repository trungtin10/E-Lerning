-- Thêm cột TotalLearningTimeMinutes vào CourseEnrollments (chạy thủ công nếu migration không chạy được)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('CourseEnrollments') AND name = 'TotalLearningTimeMinutes')
BEGIN
    ALTER TABLE CourseEnrollments ADD TotalLearningTimeMinutes INT NOT NULL DEFAULT 0;
END
