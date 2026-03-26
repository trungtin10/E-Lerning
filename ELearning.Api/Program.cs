using ELearning.Api.Data;
using ELearning.Api.Models;
using ELearning.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Cấu hình để nhận diện đúng domain khi chạy qua proxy/ngrok
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
});

var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          policy.WithOrigins("http://localhost:5173", "https://glumpy-dyspeptically-felecia.ngrok-free.dev")
                                .AllowAnyHeader()
                                .AllowAnyMethod();
                      });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
    options.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
});

builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
    };
});

builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

var app = builder.Build();

// Áp dụng migrations tự động (tạo bảng ServicePlans, Transactions, v.v. nếu chưa có)
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await context.Database.MigrateAsync();
    // Đảm bảo cột TotalLearningTimeMinutes tồn tại (fallback nếu migration chưa áp dụng)
    try
    {
        await context.Database.ExecuteSqlRawAsync(
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('CourseEnrollments') AND name = 'TotalLearningTimeMinutes') " +
            "ALTER TABLE [CourseEnrollments] ADD [TotalLearningTimeMinutes] int NOT NULL DEFAULT 0");
    }
    catch { /* Bỏ qua nếu đã có cột hoặc lỗi khác */ }
    // Đảm bảo bảng QuizAttemptAnswers tồn tại (fallback nếu migration chưa áp dụng)
    try
    {
        await context.Database.ExecuteSqlRawAsync(
            "IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'QuizAttemptAnswers') " +
            "CREATE TABLE [QuizAttemptAnswers] ([Id] int NOT NULL IDENTITY(1,1), [QuizAttemptId] int NOT NULL, [QuestionId] int NOT NULL, [SelectedAnswerId] int NOT NULL, " +
            "CONSTRAINT [PK_QuizAttemptAnswers] PRIMARY KEY ([Id]), " +
            "CONSTRAINT [FK_QuizAttemptAnswers_QuizAttempts_QuizAttemptId] FOREIGN KEY ([QuizAttemptId]) REFERENCES [QuizAttempts]([Id]) ON DELETE CASCADE, " +
            "CONSTRAINT [FK_QuizAttemptAnswers_Questions_QuestionId] FOREIGN KEY ([QuestionId]) REFERENCES [Questions]([Id]), " +
            "CONSTRAINT [FK_QuizAttemptAnswers_Answers_SelectedAnswerId] FOREIGN KEY ([SelectedAnswerId]) REFERENCES [Answers]([Id]))");
    }
    catch { /* Bỏ qua nếu đã có bảng hoặc lỗi khác */ }
    // Đảm bảo bảng LearnerBehaviorEvents tồn tại (tracking hành vi học viên)
    try
    {
        await context.Database.ExecuteSqlRawAsync(
            "IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'LearnerBehaviorEvents') " +
            "CREATE TABLE [LearnerBehaviorEvents] ([Id] bigint NOT NULL IDENTITY(1,1), [UserId] nvarchar(450) NOT NULL, [CourseId] int NOT NULL, [EnrollmentId] int NULL, " +
            "[EventType] nvarchar(50) NOT NULL, [EntityType] nvarchar(50) NULL, [EntityId] nvarchar(100) NULL, [Metadata] nvarchar(500) NULL, [CreatedAt] datetime2 NOT NULL, " +
            "CONSTRAINT [PK_LearnerBehaviorEvents] PRIMARY KEY ([Id]), " +
            "CONSTRAINT [FK_LearnerBehaviorEvents_CourseEnrollments_EnrollmentId] FOREIGN KEY ([EnrollmentId]) REFERENCES [CourseEnrollments]([Id]) ON DELETE SET NULL)");
    }
    catch { /* Bỏ qua nếu đã có bảng hoặc lỗi khác */ }
    // Đảm bảo bảng AuditLogs tồn tại (fallback nếu migration chưa áp dụng)
    try
    {
        await context.Database.ExecuteSqlRawAsync(
            "IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'AuditLogs') " +
            "CREATE TABLE [AuditLogs] ([Id] bigint NOT NULL IDENTITY(1,1), [UserId] nvarchar(450) NULL, [UserName] nvarchar(100) NULL, [Action] nvarchar(50) NOT NULL, " +
            "[EntityType] nvarchar(100) NULL, [EntityId] nvarchar(100) NULL, [OldValue] nvarchar(max) NULL, [NewValue] nvarchar(max) NULL, " +
            "[IpAddress] nvarchar(100) NULL, [Details] nvarchar(500) NULL, [CreatedAt] datetime2 NOT NULL, CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id]))");
    }
    catch { /* Bỏ qua nếu đã có bảng hoặc lỗi khác */ }
}

// Seed dữ liệu mặc định (roles, superadmin, danh mục chuyên ngành)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    await DbSeeder.SeedAsync(services);
}

app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Tắt HttpsRedirection để tránh lỗi với ngrok
// app.UseHttpsRedirection();

// Cấu hình phục vụ file tĩnh từ thư mục 'uploads'
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(builder.Environment.ContentRootPath, "uploads")),
    RequestPath = "/uploads"
});

app.UseCors(MyAllowSpecificOrigins);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
