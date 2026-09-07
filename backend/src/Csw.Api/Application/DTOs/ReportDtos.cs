namespace Csw.Api.Application.DTOs;

public record CurrentInventoryReportRow(
    string ItemCode,
    string ItemName,
    string Category,
    string UnitName,
    string UnitAbbreviation,
    decimal QuantityOnHand,
    decimal MinimumStockLevel,
    decimal ReorderLevel,
    string StockStatus
);

public record LowStockReportRow(
    string ItemCode,
    string ItemName,
    string Category,
    string UnitAbbreviation,
    decimal QuantityOnHand,
    decimal MinimumStockLevel,
    decimal Shortage
);

public record StockMovementReportRow(
    DateTime TransactionDate,
    string ItemCode,
    string ItemName,
    string TransactionType,
    int Sign,
    decimal Quantity,
    string? Reference,
    string PostedByName
);

public record AuditEventDto(
    long Id,
    DateTime EventTime,
    string? Username,
    string Action,
    string? EntityType,
    string? EntityId,
    string? Details,
    string Status
);
