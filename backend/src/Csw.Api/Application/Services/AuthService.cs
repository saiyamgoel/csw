using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Csw.Api.Application.DTOs;
using Csw.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Csw.Api.Application.Services;

public class AuthService(AppDbContext db, IConfiguration config)
{
    public async Task<LoginResponse?> LoginAsync(LoginRequest req)
    {
        var user = await db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == req.Email && u.IsActive);

        if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return null;

        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        var token = GenerateToken(user.Id, user.Email, user.FullName, roles);
        var expiresAt = DateTime.UtcNow.AddHours(config.GetValue<int>("Jwt:ExpiryHours", 8));

        return new LoginResponse(token, expiresAt, new UserDto(user.Id, user.Email, user.FullName, roles));
    }

    public async Task<UserDto?> GetCurrentUserAsync(Guid userId)
    {
        var user = await db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

        if (user == null) return null;
        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        return new UserDto(user.Id, user.Email, user.FullName, roles);
    }

    private string GenerateToken(Guid userId, string email, string fullName, List<string> roles)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:SecretKey"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = DateTime.UtcNow.AddHours(config.GetValue<int>("Jwt:ExpiryHours", 8));

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new("name", fullName),
        };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: expiry,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
