using Csw.Api.Application.DTOs;
using Csw.Api.Domain.Entities;
using Csw.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Csw.Api.Application.Services;

public class ProductTypeService(AppDbContext db)
{
    private static ProductTypeDto ToDto(ProductType pt) =>
        new(pt.Id, pt.Code, pt.Name, pt.Description, pt.IsActive, pt.CreatedAt, pt.UpdatedAt);

    public async Task<PagedResult<ProductTypeDto>> GetPagedAsync(string? search, int page, int pageSize)
    {
        var q = db.ProductTypes.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(p => p.Name.Contains(search) || p.Code.Contains(search));

        var total = await q.CountAsync();
        var items = await q.OrderBy(p => p.Code)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync();

        return new PagedResult<ProductTypeDto>(items.Select(ToDto).ToList(), total, page, pageSize);
    }

    public async Task<ProductTypeDto> CreateAsync(ProductTypeCreateRequest req)
    {
        if (await db.ProductTypes.AnyAsync(p => p.Code == req.Code.ToUpper()))
            throw new InvalidOperationException($"Product type code '{req.Code}' already exists.");

        var pt = new ProductType
        {
            Code = req.Code.ToUpper().Trim(),
            Name = req.Name.Trim(),
            Description = req.Description?.Trim()
        };
        db.ProductTypes.Add(pt);
        await db.SaveChangesAsync();
        return ToDto(pt);
    }

    public async Task<ProductTypeDto?> UpdateAsync(Guid id, ProductTypeUpdateRequest req)
    {
        var pt = await db.ProductTypes.FindAsync(id);
        if (pt == null) return null;
        pt.Name = req.Name.Trim();
        pt.Description = req.Description?.Trim();
        pt.IsActive = req.IsActive;
        pt.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return ToDto(pt);
    }

    public async Task<bool> DeactivateAsync(Guid id)
    {
        var pt = await db.ProductTypes.FindAsync(id);
        if (pt == null) return false;
        pt.IsActive = false;
        pt.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return true;
    }
}
