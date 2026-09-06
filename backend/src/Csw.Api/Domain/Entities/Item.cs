namespace Csw.Api.Domain.Entities;

public enum ItemCategory { RawMaterial, Accessory, Packaging }

public class Item
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public ItemCategory Category { get; set; }
    public string? Description { get; set; }
    public Guid UnitId { get; set; }
    public Unit Unit { get; set; } = null!;
    public decimal MinimumStockLevel { get; set; }
    public decimal ReorderLevel { get; set; }
    public decimal PreferredStockLevel { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public InventoryBalance? Balance { get; set; }
    public List<InventoryTransaction> Transactions { get; set; } = [];
    public List<Supplier> Suppliers { get; set; } = [];
}
