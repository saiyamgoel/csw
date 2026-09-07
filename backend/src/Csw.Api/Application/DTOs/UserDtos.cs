namespace Csw.Api.Application.DTOs;


public record UserCreateRequest(
    string Email,
    string FullName,
    string Password,
    List<string> Roles
);

public record UserUpdateRequest(
    string FullName,
    bool IsActive
);

public record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword
);

public record AssignRoleRequest(string RoleName);

public record RoleDto(Guid Id, string Name, string Description);
