namespace Csw.Api.Application.DTOs;

public record LoginRequest(string Email, string Password);

public record UserDto(Guid Id, string Email, string FullName, List<string> Roles, bool IsActive = true, DateTime CreatedAt = default);

public record LoginResponse(string Token, DateTime ExpiresAt, UserDto User);
