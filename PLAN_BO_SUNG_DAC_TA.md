# KẾ HOẠCH BỔ SUNG THEO ĐẶC TẢ HỆ THỐNG E-LEARNING

## Tổng quan hiện trạng

Dự án hiện có:
- **Backend**: .NET Core API, SQL Server, Identity, JWT
- **Frontend**: React, Vite
- **Vai trò**: SuperAdmin, Admin, Instructor, Student (đã có)
- **Chức năng cơ bản**: Đăng nhập, CRUD khóa học, bài học, quiz, enrollment, tiến độ học tập

---

## 1. CÁC VAI TRÒ NGƯỜI DÙNG (User Roles)

### 1.1. So sánh đặc tả vs hiện tại

| Đặc tả | Hiện tại | Ghi chú |
|--------|----------|---------|
| Học viên (Nhân viên) | Student | ✓ Đã có |
| Giảng viên / Quản lý đào tạo | Instructor | ✓ Đã có |
| Quản trị viên | Admin, SuperAdmin | ✓ Đã có (Admin + SuperAdmin) |

### 1.2. Bổ sung đề xuất

- **CompanyAdmin** (Quản trị công ty): Quản lý khóa học, người dùng trong phạm vi công ty (nếu chưa có).
- Chuẩn hóa tên hiển thị: Student → "Học viên", Instructor → "Giảng viên", Admin → "Quản trị viên".

---

## 2. YÊU CẦU CHỨC NĂNG

### 2.1. Dành cho Học viên (Nhân viên)

| Yêu cầu | Trạng thái | Công việc |
|---------|------------|-----------|
| **Đăng nhập SSO** (Google, Azure AD) | Chưa có | Thêm OAuth2 cho Google, Microsoft |
| Xem danh sách khóa học theo phòng ban/cấp bậc | Một phần | Lọc khóa theo CompanyId, DepartmentId |
| Video streaming, PDF, slide | Video ✓, PDF/Slide | Thêm hỗ trợ PDF, slide (upload + viewer) |
| Lưu vết tiến độ (xem tiếp bài đang học dở) | ✓ Có | Đã có section progress, URL persist |
| Bài kiểm tra trắc nghiệm/tự luận | Trắc nghiệm ✓ | Bổ sung chấm tự luận, phản hồi |
| Xem điểm ngay sau khi làm trắc nghiệm | ✓ Có | Đã có |
| Chứng chỉ PDF sau khi hoàn thành | Chưa đủ | Tạo PDF, tải xuống, lưu URL |

### 2.2. Dành cho Giảng viên / Quản lý đào tạo

| Yêu cầu | Trạng thái | Công việc |
|---------|------------|-----------|
| CRUD khóa học | ✓ Có | — |
| Upload tài liệu đa phương tiện | Video ✓ | Thêm PDF, slide |
| Ngân hàng câu hỏi, thời gian, số lần làm lại | Một phần | Thêm số lần làm lại (retry limit) |
| Chấm tự luận + phản hồi | Chưa có | API chấm bài tự luận, lưu feedback |
| Báo cáo tiến độ theo nhân viên/phòng ban | Chưa có | Trang báo cáo, API analytics |
| Thông báo khi hoàn thành khóa bắt buộc | Chưa có | Notification (email/in-app) |

### 2.3. Dành cho Quản trị viên (Admin)

| Yêu cầu | Trạng thái | Công việc |
|---------|------------|-----------|
| Quản lý người dùng, phân quyền RBAC | Một phần | Giao diện gán role, quản lý user |
| Cấu hình dung lượng, băng thông | Chưa có | Settings: storage limit, bandwidth |
| Thiết lập email nhắc nhở tự động | Chưa có | Cron job + template email |
| Tích hợp HRM | Chưa có | API sync hoặc import CSV |

---

## 3. YÊU CẦU PHI CHỨC NĂNG

| Yêu cầu | Trạng thái | Công việc |
|---------|------------|-----------|
| Bảo mật Intranet/VPN | Chưa cấu hình | Hướng dẫn deploy, IP whitelist |
| Bảo vệ video/tài liệu (chống tải trái phép) | Một phần | Tokenized URL, watermark (tùy chọn) |
| Hiệu năng video streaming | Cơ bản | CDN, HLS/DASH (nếu cần) |
| UI/UX trực quan, Responsive | ✓ Có | Tiếp tục cải thiện |
| Ứng dụng di động (Flutter) | Chưa có | Roadmap Phase 3 |

---

## 4. ROADMAP TRIỂN KHAI

### Phase 1 – Hoàn thiện core (MVP production)

**Ưu tiên cao:**
1. **Chứng chỉ PDF**: Tạo và tải chứng chỉ khi hoàn thành khóa học.
2. **Phân quyền rõ ràng**: Giao diện Admin gán role, phân quyền theo route.
3. **Số lần làm lại quiz**: Thêm field `MaxAttempts` cho Quiz, kiểm tra trước khi cho làm.
4. **Lọc khóa học theo phòng ban**: Học viên chỉ thấy khóa của công ty/phòng ban mình.

**Ưu tiên trung bình:**
5. Hỗ trợ PDF/slide: Upload + viewer trong bài học.
6. Báo cáo tiến độ cơ bản: Trang Instructor xem tiến độ học viên.

### Phase 2 – Mở rộng nghiệp vụ

7. **SSO**: Google, Microsoft Azure AD.
8. **Chấm bài tự luận**: API + UI cho Instructor chấm và phản hồi.
9. **Thông báo**: Email khi hoàn thành khóa bắt buộc.
10. **Cấu hình hệ thống**: Trang Admin – dung lượng, email template, cron.

### Phase 3 – Tích hợp & mở rộng

11. Tích hợp HRM (API/CSV import).
12. Ứng dụng di động Flutter (nếu cần).
13. CDN/streaming tối ưu cho video.

---

## 5. CHI TIẾT CÔNG VIỆC PHASE 1

### 5.1. Chứng chỉ PDF
- Backend: Thư viện (e.g. QuestPDF, iTextSharp) tạo PDF chứng chỉ.
- Lưu `CertificateUrl` vào DB khi hoàn thành khóa.
- API `GET /certificate/{courseId}` trả file PDF.
- Frontend: Nút "Tải chứng chỉ" trên Dashboard/LearningView khi đã hoàn thành.

### 5.2. Phân quyền RBAC
- Middleware/Guard kiểm tra role trước khi vào route.
- Trang Admin: Danh sách user, dropdown gán role (Student, Instructor, Admin, SuperAdmin).
- Ẩn/hiện menu theo role.

### 5.3. Số lần làm lại Quiz
- Migration: Thêm `MaxAttempts` (nullable) vào bảng Quiz.
- API: Kiểm tra `QuizAttempts` count trước khi cho làm bài.
- Frontend: Hiển thị "Bạn đã hết lượt làm bài" nếu vượt quá.

### 5.4. Lọc khóa theo phòng ban
- User có `CompanyId`, `DepartmentId`.
- API `GET /course`: Lọc theo `CompanyId` (và `DepartmentId` nếu có).
- API `GET /learning/my-courses`: Đã lọc theo user.

---

## 6. CẤU TRÚC DỮ LIỆU BỔ SUNG (Gợi ý)

```
- Quiz: MaxAttempts (int?)
- Certificate: CertificateUrl, IssuedAt (đã có)
- User: CompanyId, DepartmentId (đã có)
- Notification: Bảng mới (UserId, CourseId, Type, ReadAt, CreatedAt)
- SystemSettings: Bảng mới (Key, Value) cho cấu hình
```

---

## 7. KIỂM TRA VÀ PHÊ DUYỆT

Sau khi bạn đọc và đồng ý với plan:
- Chọn Phase 1 hoặc từng mục cụ thể để triển khai trước.
- Có thể điều chỉnh thứ tự ưu tiên theo nhu cầu thực tế.

---

*Tài liệu tạo ngày: 2025-03-12*
