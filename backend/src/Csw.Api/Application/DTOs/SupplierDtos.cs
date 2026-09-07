namespace Csw.Api.Application.DTOs;

public record SupplierDto(
    Guid Id,
    string Name,
    string? ContactName,
    string? Phone,
    string? Email,
    string? Notes,
    bool IsActive,
    DateTime CreatedAt
);

public record SupplierCreateRequest(
    string Name,
    string? ContactName,
    string? Phone,
    string? Email,
    string? Notes
);

public record SupplierUpdateRequest(
    string Name,
    string? ContactName,
    string? Phone,
    string? Email,
    string? Notes,
    bool IsActive
);
