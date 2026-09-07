using Csw.Api.Application.DTOs;
using Csw.Api.Domain.Entities;
using Csw.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Csw.Api.Application.Services;

public class SupplierService(AppDbContext db)
{
    private static SupplierDto ToDto(Supplier s) => new(
        s.Id, s.Name, s.ContactName, s.Phone, s.Email, s.Notes, s.IsActive, s.CreatedAt
    );

    public async Task<PagedResult<SupplierDto>> GetPagedAsync(string? search, bool? activeOnly, int page, int pageSize)
    {
        var q = db.Suppliers.AsQueryable();
        if (activeOnly == true) q = q.Where(s => s.IsActive);
        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(s => s.Name.Contains(search) || (s.ContactName != null && s.ContactName.Contains(search)));

        var total = await q.CountAsync();
        var items = await q.OrderBy(s => s.Name).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return new PagedResult<SupplierDto>(items.Select(ToDto).ToList(), total, page, pageSize);
    }

    public async Task<SupplierDto?> GetByIdAsync(Guid id)
    {
        var s = await db.Suppliers.FindAsync(id);
        return s == null ? null : ToDto(s);
    }

    public async Task<SupplierDto> CreateAsync(SupplierCreateRequest req)
    {
        var s = new Supplier
        {
            Name = req.Name.Trim(),
            ContactName = req.ContactName?.Trim(),
            Phone = req.Phone?.Trim(),
            Email = req.Email?.Trim(),
            Notes = req.Notes?.Trim()
        };
        db.Suppliers.Add(s);
        await db.SaveChangesAsync();
        return ToDto(s);
    }

    public async Task<SupplierDto?> UpdateAsync(Guid id, SupplierUpdateRequest req)
    {
        var s = await db.Suppliers.FindAsync(id);
        if (s == null) return null;
        s.Name = req.Name.Trim();
        s.ContactName = req.ContactName?.Trim();
        s.Phone = req.Phone?.Trim();
        s.Email = req.Email?.Trim();
        s.Notes = req.Notes?.Trim();
        s.IsActive = req.IsActive;
        await db.SaveChangesAsync();
        return ToDto(s);
    }

    public async Task<bool> DeactivateAsync(Guid id)
    {
        var s = await db.Suppliers.FindAsync(id);
        if (s == null) return false;
        s.IsActive = false;
        await db.SaveChangesAsync();
        return true;
    }
}
