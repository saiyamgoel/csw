namespace Csw.Api.Application.DTOs;

public record InventoryBalanceDto(
    Guid ItemId,
    string ItemCode,
    string ItemName,
    string Category,
    string UnitName,
    string UnitAbbreviation,
    decimal QuantityOnHand,
    decimal QuantityReserved,
    decimal QuantityAvailable,
    string StockStatus,
    decimal MinimumStockLevel,
    decimal ReorderLevel
);

public record InventoryTransactionDto(
    Guid Id,
    Guid ItemId,
    string ItemCode,
    string ItemName,
    string TransactionType,
    decimal Quantity,
    int Sign,
    string? Reference,
    string? Notes,
    DateTime TransactionDate,
    DateTime PostedAt,
    string PostedByName,
    bool IsVoided,
    Guid? VoidedBy
);

public record PostReceiptRequest(
    Guid ItemId,
    decimal Quantity,
    string? Reference,
    string? Notes,
    DateTime TransactionDate
);

public record PostConsumptionRequest(
    Guid ItemId,
    decimal Quantity,
    string? Reference,
    string? Notes,
    DateTime TransactionDate
);

public record PostAdjustmentRequest(
    Guid ItemId,
    decimal Quantity,
    bool IsPositive,
    string? Reference,
    string? Notes,
    DateTime TransactionDate
);

public record PostOpeningBalanceRequest(
    Guid ItemId,
    decimal Quantity,
    string? Notes
);

public record LedgerQueryParams(
    Guid? ItemId,
    string? TransactionType,
    DateTime? From,
    DateTime? To,
    int Page,
    int PageSize
);
