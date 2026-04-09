using ELearning.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ELearning.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var context = serviceProvider.GetRequiredService<ApplicationDbContext>();
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        // 1. Đảm bảo các Role tồn tại
        string[] roles = { "SuperAdmin", "Admin", "Instructor", "Student" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        // 2. Đảm bảo tài khoản SuperAdmin tồn tại và ĐÃ XÁC THỰC
        var superAdminAccount = "superadmin";
        var user = await userManager.FindByNameAsync(superAdminAccount);

        if (user == null)
        {
            user = new ApplicationUser {
                UserName = superAdminAccount,
                Email = "superadmin@elearning.com",
                FullName = "Hệ Thống Quản Trị",
                EmailConfirmed = true, // QUAN TRỌNG
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            var result = await userManager.CreateAsync(user, "Admin@123");
            if (result.Succeeded) 
            {
                await userManager.AddToRoleAsync(user, "SuperAdmin");
                Console.WriteLine("-> SuperAdmin seeded successfully.");
            }
            else
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                Console.WriteLine($"-> CRITICAL ERROR: Failed to seed SuperAdmin user: {errors}");
                // Không throw nữa để tránh crash app nếu chỉ là lỗi trùng email/username đã tồn tại ngầm
            }
        }
        else
        {
            // Cập nhật trạng thái nếu user đã tồn tại
            bool changed = false;
            if (!user.EmailConfirmed) { user.EmailConfirmed = true; changed = true; }
            if (!user.IsActive) { user.IsActive = true; changed = true; }
            if (changed) await userManager.UpdateAsync(user);

            if (!await userManager.IsInRoleAsync(user, "SuperAdmin"))
                await userManager.AddToRoleAsync(user, "SuperAdmin");
        }

        // 3. Gói dịch vụ mặc định (Basic / Plus / Pro) - Upsert để không cần xóa DB
        {
            var existing = await context.ServicePlans.ToListAsync();

            ServicePlan? FindByName(string name) =>
                existing.FirstOrDefault(p => string.Equals(p.Name, name, StringComparison.OrdinalIgnoreCase));

            var basic = FindByName("Basic");
            var plus = FindByName("Plus");
            var pro = FindByName("Pro");

            // Nếu DB cũ có Enterprise mà chưa có Plus -> đổi tên Enterprise thành Plus
            if (plus == null)
            {
                var enterprise = existing.FirstOrDefault(p => string.Equals(p.Name, "Enterprise", StringComparison.OrdinalIgnoreCase));
                if (enterprise != null)
                {
                    enterprise.Name = "Plus";
                    plus = enterprise;
                }
            }

            basic ??= new ServicePlan { Name = "Basic" };
            plus ??= new ServicePlan { Name = "Plus" };
            pro ??= new ServicePlan { Name = "Pro" };

            basic.Description = "Gói cơ bản cho doanh nghiệp nhỏ";
            basic.MaxUsers = 50;
            basic.StorageLimitGB = 10;
            basic.PriceMonthly = 132000;
            basic.PriceYearly = 132000 * 12;
            basic.SortOrder = 1;
            basic.IsActive = true;

            plus.Description = "Tận hưởng trải nghiệm đầy đủ";
            plus.MaxUsers = 200;
            plus.StorageLimitGB = 50;
            plus.PriceMonthly = 522500;
            plus.PriceYearly = 522500 * 12;
            plus.SortOrder = 2;
            plus.IsActive = true;

            pro.Description = "Tối đa hóa năng suất của bạn";
            pro.MaxUsers = 1000;
            pro.StorageLimitGB = 500;
            pro.PriceMonthly = 5225000;
            pro.PriceYearly = 5225000 * 12;
            pro.SortOrder = 3;
            pro.IsActive = true;

            if (basic.Id == 0) context.ServicePlans.Add(basic);
            if (plus.Id == 0) context.ServicePlans.Add(plus);
            if (pro.Id == 0) context.ServicePlans.Add(pro);

            await context.SaveChangesAsync();
        }

        // 4. Danh mục chuyên ngành (Chỉ thêm nếu trống)
        if (!await context.Categories.AnyAsync())
        {
            var categories = new List<Category>
            {
                new Category { Name = "Công nghệ thông tin", Description = "Lập trình, AI, Cloud" },
                new Category { Name = "Quản trị kinh doanh", Description = "Lãnh đạo, Vận hành" },
                new Category { Name = "Marketing", Description = "Truyền thông, Quảng cáo" }
            };
            context.Categories.AddRange(categories);
            await context.SaveChangesAsync();
        }

        // 5. Bản ghi mẫu nhật ký hoạt động (nếu bảng trống - để kiểm tra hiển thị)
        try
        {
            if (!await context.AuditLogs.AnyAsync())
            {
                context.AuditLogs.Add(new AuditLog
                {
                    UserId = user?.Id,
                    UserName = "Hệ thống",
                    Action = "Create",
                    EntityType = "System",
                    EntityId = "0",
                    Details = "Khởi tạo nhật ký hoạt động",
                    CreatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }
        }
        catch { /* Bỏ qua nếu schema AuditLogs cũ chưa đồng bộ */ }
    }
}
