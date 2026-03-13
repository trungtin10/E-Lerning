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

        // 3. Danh mục chuyên ngành (Chỉ thêm nếu trống)
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
    }
}
