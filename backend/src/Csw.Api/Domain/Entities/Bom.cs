namespace Csw.Api.Domain.Entities;

public enum BomVersionStatus { Draft, Active, Superseded }

public class BomHeader
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductVariantId { get; set; }
    public ProductVariant ProductVariant { get; set; } = null!;
    public Guid? CurrentVersionId { get; set; }
    public BomVersion? CurrentVersion { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public List<BomVersion> Versions { get; set; } = [];
}

public class BomVersion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BomHeaderId { get; set; }
    public BomHeader BomHeader { get; set; } = null!;
    public int VersionNumber { get; set; }
    public BomVersionStatus Status { get; set; } = BomVersionStatus.Draft;
    public DateOnly EffectiveFrom { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public DateOnly? EffectiveTo { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public Guid? ApprovedByUserId { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? ChangeReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public List<BomLine> Lines { get; set; } = [];
}

public class BomLine
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BomVersionId { get; set; }
    public BomVersion BomVersion { get; set; } = null!;
    public int LineNumber { get; set; }
    public Guid ItemId { get; set; }
    public Item Item { get; set; } = null!;
    public decimal Quantity { get; set; }
    public Guid UnitId { get; set; }
    public Unit Unit { get; set; } = null!;
    public decimal WastePercent { get; set; } = 0;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
