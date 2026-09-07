using Csw.Api.Application.DTOs;
using Csw.Api.Domain.Entities;
using Csw.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Csw.Api.Application.Services;

public class UserService(AppDbContext db)
{
    private static UserDto ToDto(User u) => new(
        u.Id, u.Email, u.FullName,
        u.UserRoles.Select(ur => ur.Role.Name).ToList(),
        IsActive: u.IsActive, CreatedAt: u.CreatedAt
    );

    private IQueryable<User> BaseQuery() =>
        db.Users.Include(u => u.UserRoles).ThenInclude(ur => ur.Role);

    public async Task<PagedResult<UserDto>> GetPagedAsync(string? search, int page, int pageSize)
    {
        var q = BaseQuery().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(u => u.FullName.Contains(search) || u.Email.Contains(search));
        var total = await q.CountAsync();
        var users = await q.OrderBy(u => u.FullName).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return new PagedResult<UserDto>(users.Select(ToDto).ToList(), total, page, pageSize);
    }

    public async Task<UserDto?> GetByIdAsync(Guid id)
    {
        var u = await BaseQuery().FirstOrDefaultAsync(u => u.Id == id);
        return u == null ? null : ToDto(u);
    }

    public async Task<UserDto> CreateAsync(UserCreateRequest req)
    {
        if (await db.Users.AnyAsync(u => u.Email == req.Email))
            throw new InvalidOperationException($"Email '{req.Email}' is already in use.");

        var user = new User
        {
            Email = req.Email.Trim().ToLower(),
            FullName = req.FullName.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password)
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        // Assign roles
        foreach (var roleName in req.Roles)
        {
            var role = await db.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
            if (role != null)
                db.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
        }
        await db.SaveChangesAsync();

        return ToDto(await BaseQuery().FirstAsync(u => u.Id == user.Id));
    }

    public async Task<UserDto?> UpdateAsync(Guid id, UserUpdateRequest req)
    {
        var u = await db.Users.FindAsync(id);
        if (u == null) return null;
        u.FullName = req.FullName.Trim();
        u.IsActive = req.IsActive;
        u.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return ToDto(await BaseQuery().FirstAsync(u => u.Id == id));
    }

    public async Task<bool> AssignRoleAsync(Guid userId, string roleName)
    {
        var role = await db.Roles.FirstOrDefaultAsync(r => r.Name == roleName)
            ?? throw new InvalidOperationException($"Role '{roleName}' not found.");
        if (await db.UserRoles.AnyAsync(ur => ur.UserId == userId && ur.RoleId == role.Id))
            return true;
        db.UserRoles.Add(new UserRole { UserId = userId, RoleId = role.Id });
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveRoleAsync(Guid userId, Guid roleId)
    {
        var ur = await db.UserRoles.FindAsync(userId, roleId);
        if (ur == null) return false;
        db.UserRoles.Remove(ur);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest req)
    {
        var u = await db.Users.FindAsync(userId)
            ?? throw new InvalidOperationException("User not found.");
        if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, u.PasswordHash))
            throw new InvalidOperationException("Current password is incorrect.");
        u.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        u.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }

    public async Task<List<RoleDto>> GetRolesAsync() =>
        await db.Roles.OrderBy(r => r.Name)
            .Select(r => new RoleDto(r.Id, r.Name, r.Description))
            .ToListAsync();
}
