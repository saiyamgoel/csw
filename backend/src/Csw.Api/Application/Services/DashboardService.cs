using Csw.Api.Application.DTOs;
using Csw.Api.Domain.Entities;
using Csw.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Csw.Api.Application.Services;

public class DashboardService(AppDbContext db)
{
    public async Task<DashboardSummaryDto> GetSummaryAsync()
    {
        var totalItems = await db.Items.CountAsync(i => i.IsActive);
        var rawMaterials = await db.Items.CountAsync(i => i.IsActive && i.Category == ItemCategory.RawMaterial);
        var accessories = await db.Items.CountAsync(i => i.IsActive && i.Category == ItemCategory.Accessory);
        var packaging = await db.Items.CountAsync(i => i.IsActive && i.Category == ItemCategory.Packaging);

        var lowStock = await db.Items
            .Include(i => i.Balance)
            .CountAsync(i => i.IsActive && i.Balance != null
                && i.Balance.QuantityOnHand > 0
                && i.Balance.QuantityOnHand <= i.MinimumStockLevel);

        var outOfStock = await db.Items
            .Include(i => i.Balance)
            .CountAsync(i => i.IsActive && (i.Balance == null || i.Balance.QuantityOnHand <= 0));

        var totalTransactions = await db.InventoryTransactions.CountAsync(t => !t.IsVoided);
        var activeProductTypes = await db.ProductTypes.CountAsync(p => p.IsActive);

        return new DashboardSummaryDto(totalItems, rawMaterials, accessories, packaging,
            lowStock, outOfStock, totalTransactions, activeProductTypes);
    }
}
