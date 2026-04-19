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

var h = new Microsoft.AspNetCore.Identity.PasswordHasher<ELearning.Api.Models.ApplicationUser>();

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

builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.User.RequireUniqueEmail = false; // Cho phép một Email tạo nhiều tài khoản
})
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
            {
                context.Fail("Tài khoản đã bị tạm khóa hoặc không còn tồn tại.");
                return;
            }

            if (dbUser.CompanyId.HasValue)
            {
                var dbContext = context.HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
                var company = await dbContext.Companies.FindAsync(dbUser.CompanyId.Value);
                if (company != null && !company.IsActive)
                {
                    context.Fail("Công ty của bạn đã bị khóa.");
                    return;
                }
            }
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

// Áp dụng migrations tự động - Đã xóa để chuyển sang quản lý SQL thủ công

// Seed dữ liệu mặc định - Đã gỡ bỏ theo yêu cầu: Quản lý SQL thủ công 100%

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
