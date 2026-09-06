namespace Csw.Api.Domain.Entities;

public enum TransactionType
{
    OpeningBalance,
    Receipt,
    Consumption,
    PositiveAdjustment,
    NegativeAdjustment
}

public class InventoryBalance
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ItemId { get; set; }
    public Item Item { get; set; } = null!;
    public decimal QuantityOnHand { get; set; }
    public decimal QuantityReserved { get; set; }
    public decimal QuantityAvailable => QuantityOnHand - QuantityReserved;
    public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;
}

public class InventoryTransaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ItemId { get; set; }
    public Item Item { get; set; } = null!;
    public TransactionType TransactionType { get; set; }
    public decimal Quantity { get; set; }
    public int Sign { get; set; } = 1;
    public string? Reference { get; set; }
    public string? Notes { get; set; }
    public DateTime TransactionDate { get; set; }
    public DateTime PostedAt { get; set; } = DateTime.UtcNow;
    public Guid? PostedByUserId { get; set; }
    public string IdempotencyKey { get; set; } = Guid.NewGuid().ToString();
    public bool IsVoided { get; set; }
}
