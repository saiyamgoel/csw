using Csw.Api.Application.DTOs;
using Csw.Api.Domain.Entities;
using Csw.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Csw.Api.Application.Services;

public class ItemService(AppDbContext db)
{
    private static string GetStockStatus(Item item)
    {
        var qty = item.Balance?.QuantityOnHand ?? 0;
        if (qty <= 0) return "OUT_OF_STOCK";
        if (qty <= item.MinimumStockLevel) return "LOW_STOCK";
        return "IN_STOCK";
    }

    private static ItemDto ToDto(Item item) => new(
        item.Id, item.Code, item.Name,
        item.Category == ItemCategory.RawMaterial ? "RAW_MATERIAL"
            : item.Category == ItemCategory.Accessory ? "ACCESSORY" : "PACKAGING",
        item.Description,
        item.UnitId, item.Unit.Name, item.Unit.Abbreviation,
        item.MinimumStockLevel, item.ReorderLevel, item.PreferredStockLevel,
        item.Balance?.QuantityOnHand ?? 0,
        GetStockStatus(item),
        item.IsActive, item.CreatedAt, item.UpdatedAt
    );

    private IQueryable<Item> BaseQuery() =>
        db.Items.Include(i => i.Unit).Include(i => i.Balance);

    public async Task<PagedResult<ItemDto>> GetPagedAsync(string? category, string? search, int page, int pageSize)
    {
        var q = BaseQuery().AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
        {
            var cat = category.ToUpper() switch
            {
                "RAW_MATERIAL" => ItemCategory.RawMaterial,
                "ACCESSORY" => ItemCategory.Accessory,
                "PACKAGING" => ItemCategory.Packaging,
                _ => (ItemCategory?)null
            };
            if (cat.HasValue) q = q.Where(i => i.Category == cat.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(i => i.Name.Contains(search) || i.Code.Contains(search));

        var total = await q.CountAsync();
        var items = await q
            .OrderBy(i => i.Category).ThenBy(i => i.Code)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync();

        return new PagedResult<ItemDto>(items.Select(ToDto).ToList(), total, page, pageSize);
    }

    public async Task<ItemDto?> GetByIdAsync(Guid id)
    {
        var item = await BaseQuery().FirstOrDefaultAsync(i => i.Id == id);
        return item == null ? null : ToDto(item);
    }

    public async Task<ItemDto> CreateAsync(ItemCreateRequest req, Guid createdByUserId)
    {
        if (await db.Items.AnyAsync(i => i.Code == req.Code))
            throw new InvalidOperationException($"Item code '{req.Code}' already exists.");

        var cat = req.Category.ToUpper() switch
        {
            "RAW_MATERIAL" => ItemCategory.RawMaterial,
            "ACCESSORY" => ItemCategory.Accessory,
            "PACKAGING" => ItemCategory.Packaging,
            _ => throw new ArgumentException($"Invalid category: {req.Category}")
        };

        var item = new Item
        {
            Code = req.Code.ToUpper().Trim(),
            Name = req.Name.Trim(),
            Category = cat,
            Description = req.Description?.Trim(),
            UnitId = req.UnitId,
            MinimumStockLevel = req.MinimumStockLevel,
            ReorderLevel = req.ReorderLevel,
            PreferredStockLevel = req.PreferredStockLevel
        };

        db.Items.Add(item);
        db.InventoryBalances.Add(new InventoryBalance { ItemId = item.Id, QuantityOnHand = 0 });
        await db.SaveChangesAsync();

        return ToDto(await BaseQuery().FirstAsync(i => i.Id == item.Id));
    }

    public async Task<ItemDto?> UpdateAsync(Guid id, ItemUpdateRequest req)
    {
        var item = await db.Items.FindAsync(id);
        if (item == null) return null;

        item.Name = req.Name.Trim();
        item.Description = req.Description?.Trim();
        item.UnitId = req.UnitId;
        item.MinimumStockLevel = req.MinimumStockLevel;
        item.ReorderLevel = req.ReorderLevel;
        item.PreferredStockLevel = req.PreferredStockLevel;
        item.IsActive = req.IsActive;
        item.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return ToDto(await BaseQuery().FirstAsync(i => i.Id == id));
    }

    public async Task<bool> DeactivateAsync(Guid id)
    {
        var item = await db.Items.FindAsync(id);
        if (item == null) return false;
        item.IsActive = false;
        item.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<List<UnitDto>> GetUnitsAsync() =>
        await db.Units.Where(u => u.IsActive)
            .OrderBy(u => u.Name)
            .Select(u => new UnitDto(u.Id, u.Name, u.Abbreviation))
            .ToListAsync();
}
