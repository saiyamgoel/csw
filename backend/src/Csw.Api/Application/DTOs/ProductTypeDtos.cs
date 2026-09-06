namespace Csw.Api.Application.DTOs;

public record ProductTypeDto(
    Guid Id,
    string Code,
    string Name,
    string? Description,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record ProductTypeCreateRequest(string Code, string Name, string? Description);
public record ProductTypeUpdateRequest(string Name, string? Description, bool IsActive);
