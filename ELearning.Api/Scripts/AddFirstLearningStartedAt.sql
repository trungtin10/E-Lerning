-- Thêm cột FirstLearningStartedAt vào bảng CourseEnrollments nếu chưa tồn tại
-- Chạy script này khi gặp lỗi: Invalid column name 'FirstLearningStartedAt'

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('CourseEnrollments') AND name = 'FirstLearningStartedAt'
)
BEGIN
    ALTER TABLE [CourseEnrollments] ADD [FirstLearningStartedAt] datetime2 NULL;
    PRINT 'Đã thêm cột FirstLearningStartedAt vào bảng CourseEnrollments.';
END
ELSE
BEGIN
    PRINT 'Cột FirstLearningStartedAt đã tồn tại.';
END
