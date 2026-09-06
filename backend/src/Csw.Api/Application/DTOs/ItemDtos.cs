namespace Csw.Api.Application.DTOs;

public record UnitDto(Guid Id, string Name, string Abbreviation);

public record ItemDto(
    Guid Id,
    string Code,
    string Name,
    string Category,
    string? Description,
    Guid UnitId,
    string UnitName,
    string UnitAbbreviation,
    decimal MinimumStockLevel,
    decimal ReorderLevel,
    decimal PreferredStockLevel,
    decimal CurrentStock,
    string StockStatus,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record ItemCreateRequest(
    string Code,
    string Name,
    string Category,
    string? Description,
    Guid UnitId,
    decimal MinimumStockLevel,
    decimal ReorderLevel,
    decimal PreferredStockLevel
);

public record ItemUpdateRequest(
    string Name,
    string? Description,
    Guid UnitId,
    decimal MinimumStockLevel,
    decimal ReorderLevel,
    decimal PreferredStockLevel,
    bool IsActive
);

public record PagedResult<T>(List<T> Data, int Total, int Page, int PageSize);
