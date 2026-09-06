namespace Csw.Api.Application.DTOs;

public record DashboardSummaryDto(
    int TotalItems,
    int RawMaterials,
    int Accessories,
    int Packaging,
    int LowStockCount,
    int OutOfStockCount,
    int TotalTransactions,
    int ActiveProductTypes
);
