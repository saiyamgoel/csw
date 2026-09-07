using Csw.Api.Application.DTOs;
using Csw.Api.Domain.Entities;
using Csw.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Csw.Api.Application.Services;

public class ProductService(AppDbContext db, CodeGenerationService codeSvc)
{
    private static ProductDto ToDto(Product p) => new(
        p.Id, p.ProductTypeId, p.ProductType?.Name ?? string.Empty,
        p.Name, p.Description, p.IsActive, p.CreatedAt, p.Variants.Count(v => v.IsActive));

    public async Task<PagedResult<ProductDto>> GetAllAsync(Guid? productTypeId, int page, int pageSize)
    {
        var q = db.Products.Include(p => p.ProductType).Include(p => p.Variants).AsQueryable();
        if (productTypeId.HasValue) q = q.Where(p => p.ProductTypeId == productTypeId.Value);
        var total = await q.CountAsync();
        var items = await q.OrderBy(p => p.Name)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return new PagedResult<ProductDto>(items.Select(ToDto).ToList(), total, page, pageSize);
    }

    public async Task<ProductDto> GetByIdAsync(Guid id)
    {
        var p = await db.Products.Include(p => p.ProductType).Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new InvalidOperationException("Product not found.");
        return ToDto(p);
    }

    public async Task<ProductDto> CreateAsync(ProductCreateRequest req)
    {
        _ = await db.ProductTypes.FindAsync(req.ProductTypeId)
            ?? throw new InvalidOperationException("Product type not found.");
        var p = new Product
        {
            ProductTypeId = req.ProductTypeId, Name = req.Name, Description = req.Description
        };
        db.Products.Add(p);
        await db.SaveChangesAsync();
        return await GetByIdAsync(p.Id);
    }

    public async Task<ProductDto> UpdateAsync(Guid id, ProductUpdateRequest req)
    {
        var p = await db.Products.Include(p => p.ProductType).Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new InvalidOperationException("Product not found.");
        p.Name = req.Name; p.Description = req.Description;
        p.IsActive = req.IsActive; p.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return ToDto(p);
    }

    public async Task<List<ProductVariantDto>> GetVariantsAsync(Guid productId, bool activeOnly = false)
    {
        var q = db.ProductVariants
            .Include(v => v.Product)
            .Include(v => v.Unit)
            .Include(v => v.Characteristics).ThenInclude(c => c.CharacteristicType)
            .Include(v => v.Characteristics).ThenInclude(c => c.CharacteristicValue)
            .Include(v => v.BomHeader)
            .Where(v => v.ProductId == productId).AsQueryable();
        if (activeOnly) q = q.Where(v => v.IsActive);
        var variants = await q.OrderBy(v => v.VariantCode).ToListAsync();
        return variants.Select(ToVariantDto).ToList();
    }

    public async Task<ProductVariantDto> GetVariantByIdAsync(Guid id)
    {
        var v = await db.ProductVariants
            .Include(v => v.Product)
            .Include(v => v.Unit)
            .Include(v => v.Characteristics).ThenInclude(c => c.CharacteristicType)
            .Include(v => v.Characteristics).ThenInclude(c => c.CharacteristicValue)
            .Include(v => v.BomHeader)
            .FirstOrDefaultAsync(v => v.Id == id)
            ?? throw new InvalidOperationException("Product variant not found.");
        return ToVariantDto(v);
    }

    public async Task<ProductVariantDto> CreateVariantAsync(ProductVariantCreateRequest req)
    {
        var product = await db.Products.FindAsync(req.ProductId)
            ?? throw new InvalidOperationException("Product not found.");

        var code = await codeSvc.GenerateCodeAsync(req.Characteristics);
        if (await db.ProductVariants.AnyAsync(v => v.VariantCode == code.Code))
            throw new InvalidOperationException($"Variant code '{code.Code}' already exists.");

        var variant = new ProductVariant
        {
            ProductId = req.ProductId, VariantCode = code.Code,
            Name = req.Name, UnitId = req.UnitId,
            SellingPrice = req.SellingPrice, Notes = req.Notes
        };
        db.ProductVariants.Add(variant);
        await db.SaveChangesAsync();

        foreach (var (typeId, valueId) in req.Characteristics)
        {
            db.ProductVariantCharacteristics.Add(new ProductVariantCharacteristic
            {
                ProductVariantId = variant.Id,
                CharacteristicTypeId = typeId,
                CharacteristicValueId = valueId
            });
        }
        await db.SaveChangesAsync();
        return await GetVariantByIdAsync(variant.Id);
    }

    public async Task<ProductVariantDto> UpdateVariantAsync(Guid id, ProductVariantUpdateRequest req)
    {
        var v = await db.ProductVariants.Include(v => v.Product).Include(v => v.Unit)
            .Include(v => v.Characteristics).ThenInclude(c => c.CharacteristicType)
            .Include(v => v.Characteristics).ThenInclude(c => c.CharacteristicValue)
            .Include(v => v.BomHeader)
            .FirstOrDefaultAsync(v => v.Id == id)
            ?? throw new InvalidOperationException("Product variant not found.");
        v.Name = req.Name; v.UnitId = req.UnitId;
        v.SellingPrice = req.SellingPrice; v.Notes = req.Notes;
        v.IsActive = req.IsActive; v.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return ToVariantDto(v);
    }

    private static ProductVariantDto ToVariantDto(ProductVariant v) => new(
        v.Id, v.ProductId, v.Product?.Name ?? string.Empty, v.VariantCode, v.Name,
        v.UnitId, v.Unit?.Name ?? string.Empty, v.SellingPrice, v.IsActive, v.Notes,
        v.CreatedAt,
        v.Characteristics.Select(c => new VariantCharacteristicDto(
            c.CharacteristicTypeId, c.CharacteristicType?.Name ?? string.Empty,
            c.CharacteristicValueId, c.CharacteristicValue?.Code ?? string.Empty,
            c.CharacteristicValue?.Name ?? string.Empty)).ToList(),
        v.BomHeader != null);
}
