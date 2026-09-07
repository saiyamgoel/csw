using Csw.Api.Application.DTOs;
using Csw.Api.Domain.Entities;
using Csw.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Csw.Api.Application.Services;

public class ReportService(AppDbContext db)
{
    private static string GetStockStatus(Item i)
    {
        var qty = i.Balance?.QuantityOnHand ?? 0;
        if (qty <= 0) return "OUT_OF_STOCK";
        if (qty <= i.MinimumStockLevel) return "LOW_STOCK";
        return "IN_STOCK";
    }

    private static string CategoryLabel(ItemCategory c) => c switch
    {
        ItemCategory.RawMaterial => "Raw Material",
        ItemCategory.Accessory   => "Accessory",
        ItemCategory.Packaging   => "Packaging",
        _ => c.ToString()
    };

    public async Task<List<CurrentInventoryReportRow>> GetCurrentInventoryAsync(string? category)
    {
        var q = db.Items.Include(i => i.Unit).Include(i => i.Balance)
            .Where(i => i.IsActive).AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
        {
            var cat = category.ToUpper() switch
            {
                "RAW_MATERIAL" => (ItemCategory?)ItemCategory.RawMaterial,
                "ACCESSORY"    => ItemCategory.Accessory,
                "PACKAGING"    => ItemCategory.Packaging,
                _ => null
            };
            if (cat.HasValue) q = q.Where(i => i.Category == cat.Value);
        }

        var items = await q.OrderBy(i => i.Category).ThenBy(i => i.Code).ToListAsync();
        return items.Select(i => new CurrentInventoryReportRow(
            i.Code, i.Name, CategoryLabel(i.Category),
            i.Unit.Name, i.Unit.Abbreviation,
            i.Balance?.QuantityOnHand ?? 0,
            i.MinimumStockLevel, i.ReorderLevel,
            GetStockStatus(i)
        )).ToList();
    }

    public async Task<List<LowStockReportRow>> GetLowStockAsync()
    {
        var items = await db.Items
            .Include(i => i.Unit).Include(i => i.Balance)
            .Where(i => i.IsActive && i.Balance != null && i.Balance.QuantityOnHand <= i.MinimumStockLevel)
            .OrderBy(i => i.Balance!.QuantityOnHand)
            .ToListAsync();

        return items.Select(i => new LowStockReportRow(
            i.Code, i.Name, CategoryLabel(i.Category), i.Unit.Abbreviation,
            i.Balance!.QuantityOnHand, i.MinimumStockLevel,
            i.MinimumStockLevel - i.Balance!.QuantityOnHand
        )).ToList();
    }

    public async Task<List<StockMovementReportRow>> GetStockMovementAsync(DateTime from, DateTime to, Guid? itemId)
    {
        var q = db.InventoryTransactions
            .Include(t => t.Item).ThenInclude(i => i.Unit)
            .Where(t => !t.IsVoided && t.TransactionDate >= from.Date && t.TransactionDate <= to.Date)
            .AsQueryable();

        if (itemId.HasValue) q = q.Where(t => t.ItemId == itemId.Value);

        var txs = await q.OrderBy(t => t.TransactionDate).ThenBy(t => t.PostedAt).ToListAsync();

        var posterIds = txs.Select(t => t.PostedByUserId).Where(id => id.HasValue)
            .Select(id => id!.Value).Distinct().ToList();
        var posters = await db.Users.Where(u => posterIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.FullName);

        return txs.Select(t => new StockMovementReportRow(
            t.TransactionDate, t.Item.Code, t.Item.Name,
            t.TransactionType.ToString(), t.Sign, t.Quantity, t.Reference,
            t.PostedByUserId.HasValue && posters.TryGetValue(t.PostedByUserId.Value, out var name) ? name : "System"
        )).ToList();
    }

    public async Task<PagedResult<AuditEventDto>> GetAuditLogAsync(
        string? action, string? username, DateTime? from, DateTime? to, int page, int pageSize)
    {
        var q = db.AuditEvents.AsQueryable();
        if (!string.IsNullOrWhiteSpace(action)) q = q.Where(a => a.Action.Contains(action));
        if (!string.IsNullOrWhiteSpace(username)) q = q.Where(a => a.Username != null && a.Username.Contains(username));
        if (from.HasValue) q = q.Where(a => a.EventTime >= from.Value);
        if (to.HasValue) q = q.Where(a => a.EventTime <= to.Value.AddDays(1));

        var total = await q.CountAsync();
        var events = await q.OrderByDescending(a => a.EventTime)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResult<AuditEventDto>(
            events.Select(a => new AuditEventDto(
                a.Id, a.EventTime, a.Username, a.Action,
                a.EntityType, a.EntityId, a.Details, a.Status
            )).ToList(),
            total, page, pageSize
        );
    }
}
