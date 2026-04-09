using ELearning.Api;
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
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.DependencyInjection;

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
    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            var userId = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return;

            var userManager = context.HttpContext.RequestServices.GetRequiredService<UserManager<ApplicationUser>>();
            var dbUser = await userManager.FindByIdAsync(userId);
            if (dbUser == null || !dbUser.IsActive)
                context.Fail("Tài khoản đã bị tạm khóa hoặc không còn tồn tại.");
        }
    };
});

builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IVnPayService, VnPayService>();
builder.Services.AddScoped<IMoMoService, MoMoService>();
builder.Services.AddHttpClient();

var app = builder.Build();

// Áp dụng migrations tự động
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await context.Database.MigrateAsync();

    // Fallbacks giữ tương thích DB cũ
    try
    {
        await context.Database.ExecuteSqlRawAsync(
            "IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('CourseEnrollments') AND name = 'TotalLearningTimeMinutes') " +
            "ALTER TABLE [CourseEnrollments] ADD [TotalLearningTimeMinutes] int NOT NULL DEFAULT 0");
    }
    catch { /* ignore */ }

    try
    {
        await context.Database.ExecuteSqlRawAsync(
            "IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'AuditLogs') " +
            "CREATE TABLE [AuditLogs] ([Id] bigint NOT NULL IDENTITY(1,1), [UserId] nvarchar(450) NULL, [UserName] nvarchar(100) NULL, [Action] nvarchar(50) NOT NULL, " +
            "[EntityType] nvarchar(100) NULL, [EntityId] nvarchar(100) NULL, [OldValue] nvarchar(max) NULL, [NewValue] nvarchar(max) NULL, " +
            "[IpAddress] nvarchar(100) NULL, [Details] nvarchar(500) NULL, [CreatedAt] datetime2 NOT NULL, CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id]))");
    }
    catch { /* ignore */ }

    // Heal schema drift: bổ sung cột còn thiếu cho bảng AuditLogs nếu DB cũ chưa đồng bộ.
    try
    {
        await context.Database.ExecuteSqlRawAsync(
            "IF COL_LENGTH('AuditLogs','UserId') IS NULL ALTER TABLE [AuditLogs] ADD [UserId] nvarchar(450) NULL;" +
            "IF COL_LENGTH('AuditLogs','UserName') IS NULL ALTER TABLE [AuditLogs] ADD [UserName] nvarchar(100) NULL;" +
            "IF COL_LENGTH('AuditLogs','EntityType') IS NULL ALTER TABLE [AuditLogs] ADD [EntityType] nvarchar(100) NULL;" +
            "IF COL_LENGTH('AuditLogs','EntityId') IS NULL ALTER TABLE [AuditLogs] ADD [EntityId] nvarchar(100) NULL;" +
            "IF COL_LENGTH('AuditLogs','OldValue') IS NULL ALTER TABLE [AuditLogs] ADD [OldValue] nvarchar(max) NULL;" +
            "IF COL_LENGTH('AuditLogs','NewValue') IS NULL ALTER TABLE [AuditLogs] ADD [NewValue] nvarchar(max) NULL;" +
            "IF COL_LENGTH('AuditLogs','IpAddress') IS NULL ALTER TABLE [AuditLogs] ADD [IpAddress] nvarchar(100) NULL;" +
            "IF COL_LENGTH('AuditLogs','Details') IS NULL ALTER TABLE [AuditLogs] ADD [Details] nvarchar(500) NULL;");
    }
    catch { /* ignore */ }

    // DB đôi khi lệch migration (đã ghi __EFMigrationsHistory nhưng thiếu bảng) — tạo UserNotifications nếu chưa có.
    try
    {
        await context.Database.ExecuteSqlRawAsync("""
            IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'UserNotifications' AND schema_id = SCHEMA_ID('dbo'))
            BEGIN
                CREATE TABLE [dbo].[UserNotifications] (
                    [Id] bigint NOT NULL IDENTITY(1,1),
                    [UserId] nvarchar(450) NOT NULL,
                    [Title] nvarchar(200) NOT NULL,
                    [Content] nvarchar(max) NULL,
                    [Type] nvarchar(30) NOT NULL,
                    [Severity] nvarchar(20) NOT NULL,
                    [IsRead] bit NOT NULL CONSTRAINT [DF_UserNotifications_IsRead] DEFAULT (0),
                    [ReadAt] datetime2 NULL,
                    [LinkUrl] nvarchar(max) NULL,
                    [PayloadJson] nvarchar(max) NULL,
                    [CreatedAt] datetime2 NOT NULL,
                    CONSTRAINT [PK_UserNotifications] PRIMARY KEY ([Id]),
                    CONSTRAINT [FK_UserNotifications_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
                );
                CREATE NONCLUSTERED INDEX [IX_UserNotifications_UserId_IsRead_CreatedAt]
                    ON [dbo].[UserNotifications] ([UserId], [IsRead], [CreatedAt]);
            END
            """);
    }
    catch { /* ignore */ }

    try
    {
        await context.Database.ExecuteSqlRawAsync("""
            IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'AnnouncementUserStates' AND schema_id = SCHEMA_ID('dbo'))
            BEGIN
                CREATE TABLE [dbo].[AnnouncementUserStates] (
                    [Id] bigint NOT NULL IDENTITY(1,1),
                    [AnnouncementId] int NOT NULL,
                    [UserId] nvarchar(450) NOT NULL,
                    [DismissedAt] datetime2 NULL,
                    [AcknowledgedAt] datetime2 NULL,
                    [CreatedAt] datetime2 NOT NULL,
                    CONSTRAINT [PK_AnnouncementUserStates] PRIMARY KEY ([Id]),
                    CONSTRAINT [FK_AnnouncementUserStates_Announcements_AnnouncementId] FOREIGN KEY ([AnnouncementId]) REFERENCES [Announcements]([Id]) ON DELETE CASCADE,
                    CONSTRAINT [FK_AnnouncementUserStates_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers]([Id]) ON DELETE CASCADE
                );
                CREATE UNIQUE INDEX [IX_AnnouncementUserStates_AnnouncementId_UserId] ON [dbo].[AnnouncementUserStates] ([AnnouncementId], [UserId]);
            END
            """);
    }
    catch { /* ignore */ }

    try
    {
        await context.Database.ExecuteSqlRawAsync("""
            IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'LearnerBehaviorEvents' AND schema_id = SCHEMA_ID('dbo'))
            BEGIN
                CREATE TABLE [dbo].[LearnerBehaviorEvents] (
                    [Id] bigint NOT NULL IDENTITY(1,1),
                    [UserId] nvarchar(450) NOT NULL,
                    [CourseId] int NOT NULL,
                    [EnrollmentId] int NULL,
                    [EventType] nvarchar(50) NOT NULL,
                    [EntityType] nvarchar(50) NULL,
                    [EntityId] nvarchar(100) NULL,
                    [Metadata] nvarchar(500) NULL,
                    [CreatedAt] datetime2 NOT NULL,
                    CONSTRAINT [PK_LearnerBehaviorEvents] PRIMARY KEY ([Id]),
                    CONSTRAINT [FK_LearnerBehaviorEvents_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers]([Id]) ON DELETE NO ACTION,
                    CONSTRAINT [FK_LearnerBehaviorEvents_CourseEnrollments_EnrollmentId] FOREIGN KEY ([EnrollmentId]) REFERENCES [CourseEnrollments]([Id]) ON DELETE SET NULL,
                    CONSTRAINT [FK_LearnerBehaviorEvents_Courses_CourseId] FOREIGN KEY ([CourseId]) REFERENCES [Courses]([Id]) ON DELETE NO ACTION
                );
                CREATE INDEX [IX_LearnerBehaviorEvents_EnrollmentId] ON [dbo].[LearnerBehaviorEvents] ([EnrollmentId]);
                CREATE INDEX [IX_LearnerBehaviorEvents_UserId] ON [dbo].[LearnerBehaviorEvents] ([UserId]);
                CREATE INDEX [IX_LearnerBehaviorEvents_CourseId] ON [dbo].[LearnerBehaviorEvents] ([CourseId]);
            END
            """);
    }
    catch { /* ignore */ }
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
app.MapAuthProfileEndpoints();

app.Run();
