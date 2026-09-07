namespace Csw.Api.Domain.Entities;

public class Product
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductTypeId { get; set; }
    public ProductType ProductType { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public List<ProductVariant> Variants { get; set; } = [];
}

public class ProductVariant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string VariantCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Guid UnitId { get; set; }
    public Unit Unit { get; set; } = null!;
    public decimal? SellingPrice { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public List<ProductVariantCharacteristic> Characteristics { get; set; } = [];
    public BomHeader? BomHeader { get; set; }
}

public class ProductVariantCharacteristic
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductVariantId { get; set; }
    public ProductVariant ProductVariant { get; set; } = null!;
    public Guid CharacteristicTypeId { get; set; }
    public CharacteristicType CharacteristicType { get; set; } = null!;
    public Guid CharacteristicValueId { get; set; }
    public CharacteristicValue CharacteristicValue { get; set; } = null!;
}
