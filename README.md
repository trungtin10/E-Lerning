# E-Learning SaaS System - Hệ Thống Đào Tạo Trực Tuyến Đa Nền Tảng

Hệ thống E-Learning SaaS là một nền tảng quản lý đào tạo (LMS) hiện đại, hỗ trợ mô hình đa doanh nghiệp (Multi-tenant). Hệ thống cho phép các công ty đăng ký, tạo không gian đào tạo riêng và quản lý khóa học cho nhân viên của mình một cách chuyên nghiệp.

## 🚀 Công Nghệ Sử Dụng

### Backend (ELearning.Api)
- **Framework**: .NET 8 / ASP.NET Core API
- **ORM**: Entity Framework Core
- **Database**: SQL Server
- **Authentication**: ASP.NET Core Identity & JWT (JSON Web Token)
- **Mail Service**: SendGrid / SMTP
- **Payment Gateway**: VNPay Integration

### Frontend (ELearning.UI)
- **Framework**: React.js (Vite)
- **Styling**: Bootstrap 5, Vanilla CSS, Lucide React (Icons)
- **State Management**: React Context API
- **API Client**: Axios
- **Editor**: TinyMCE / Quill (cho quản lý nội dung bài học)

## ✨ Tính Năng Chính

### 1. Quản Trị Hệ Thống (SuperAdmin)
- **Quản lý Công ty (Tenants)**: Tạo mới, kích hoạt/khóa công ty, cấu hình tên miền con (subdomain).
- **Gói Dịch Vụ**: Quản lý các gói dịch vụ (Free, Basic, Pro...) và giới hạn dung lượng/người dùng.
- **Thống Kê Tổng Quan**: Theo dõi tăng trưởng người dùng, doanh thu và dung lượng lưu trữ toàn hệ thống.
- **Quản Lý Thông Báo**: Gửi thông báo dạng Banner hoặc Popup đến toàn bộ người dùng.

### 2. Quản Trị Doanh Nghiệp (Company Admin)
- **Quản lý Khóa Học**: Tạo khóa học, bài học, phân mục chuyên ngành.
- **Quản lý Nhân Viên**: Phân quyền Editor, Quản lý hoặc Học viên.
- **Theo Dõi Học Viên**: Xem tiến độ học tập và kết quả của từng học viên.
- **Quản lý Dung Lượng**: Theo dõi chi tiết dung lượng Video, Hình ảnh và Tài liệu đã tải lên.

### 3. Cổng Học Tập (Learner)
- **Trải Nghiệm Học Tập**: Giao diện học tập hiện đại, hỗ trợ video, tài liệu PDF và bài kiểm tra.
- **Cá Nhân Hóa**: Theo dõi các khóa học đang tham gia, tiến độ hoàn thành.
- **Chứng Chỉ**: Tự động cấp chứng chỉ sau khi hoàn thành khóa học (Đang phát triển).

## 📁 Cấu Trúc Thư Mục

```text
├── ELearning.Api/          # Source code Backend (ASP.NET Core)
│   ├── Controllers/        # Các API Endpoints
│   ├── Data/               # DBContext và Migration
│   ├── Models/             # Thực thể dữ liệu
│   ├── Services/           # Logic xử lý nghiệp vụ (Upload, Email, Audit...)
│   └── DTOs/               # Data Transfer Objects
├── ELearning.UI/           # Source code Frontend (React)
│   ├── src/
│   │   ├── components/     # Các thành phần giao diện dùng chung
│   │   ├── pages/          # Các trang chức năng (Admin, User, Auth)
│   │   ├── api/            # Cấu hình Axios và gọi API
│   │   └── context/        # Quản lý State toàn cục (Auth, Notify, Language)
│   └── public/             # Tài nguyên tĩnh
└── Hệ thống E-Lerning.sln  # Visual Studio Solution file
```

## 🛠️ Hướng Dẫn Cài Đặt

### Yêu cầu hệ thống
- .NET 8 SDK
- Node.js (v18+)
- SQL Server

### Các bước thực hiện

1. **Cấu hình Cơ sở dữ liệu**:
   - Mở file `appsettings.json` trong `ELearning.Api`.
   - Cập nhật chuỗi kết nối `DefaultConnection`.
   - Chạy lệnh migration: `dotnet ef database update`.

2. **Chạy Backend**:
   - `cd ELearning.Api`
   - `dotnet run` (API sẽ chạy tại `http://localhost:5211`)

3. **Chạy Frontend**:
   - `cd ELearning.UI`
   - `npm install`
   - `npm run dev` (Ứng dụng sẽ chạy tại `http://localhost:5173`)

## 📝 Quy Định Lưu Trữ Tệp Tin

Hệ thống tự động phân loại tệp tin theo cấu trúc:
`uploads/{companyId}/courses/{courseId}/lessons/{lessonId}/`
Việc xóa khóa học hoặc bài học trên giao diện sẽ đồng thời xóa các tệp tin vật lý tương ứng để tối ưu dung lượng server.

---
© 2026 Mạng Xuyên Việt - Dự án Hệ Thống E-Learning SaaS.
