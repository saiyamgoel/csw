using Csw.Api.Application.DTOs;
using Csw.Api.Domain.Entities;
using Csw.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Csw.Api.Application.Services;

public class CharacteristicTypeService(AppDbContext db)
{
    private static CharacteristicTypeDto ToDto(CharacteristicType t) => new(
        t.Id, t.Code, t.Name, t.Description, t.SortOrder, t.IsActive,
        t.Values.OrderBy(v => v.SortOrder).ThenBy(v => v.Code)
            .Select(v => new CharacteristicValueDto(v.Id, v.CharacteristicTypeId, v.Code, v.Name, v.SortOrder, v.IsActive)).ToList());

    public async Task<List<CharacteristicTypeDto>> GetAllAsync(bool activeOnly = false)
    {
        var q = db.CharacteristicTypes.Include(t => t.Values).AsQueryable();
        if (activeOnly) q = q.Where(t => t.IsActive);
        var types = await q.OrderBy(t => t.SortOrder).ThenBy(t => t.Name).ToListAsync();
        return types.Select(ToDto).ToList();
    }

    public async Task<CharacteristicTypeDto> GetByIdAsync(Guid id)
    {
        var t = await db.CharacteristicTypes.Include(t => t.Values)
            .FirstOrDefaultAsync(t => t.Id == id)
            ?? throw new InvalidOperationException("Characteristic type not found.");
        return ToDto(t);
    }

    public async Task<CharacteristicTypeDto> CreateAsync(CharacteristicTypeCreateRequest req)
    {
        if (await db.CharacteristicTypes.AnyAsync(t => t.Code == req.Code))
            throw new InvalidOperationException($"Code '{req.Code}' already exists.");
        var t = new CharacteristicType
        {
            Code = req.Code.ToUpper(), Name = req.Name,
            Description = req.Description, SortOrder = req.SortOrder
        };
        db.CharacteristicTypes.Add(t);
        await db.SaveChangesAsync();
        return ToDto(t);
    }

    public async Task<CharacteristicTypeDto> UpdateAsync(Guid id, CharacteristicTypeUpdateRequest req)
    {
        var t = await db.CharacteristicTypes.Include(t => t.Values)
            .FirstOrDefaultAsync(t => t.Id == id)
            ?? throw new InvalidOperationException("Characteristic type not found.");
        t.Name = req.Name; t.Description = req.Description;
        t.SortOrder = req.SortOrder; t.IsActive = req.IsActive;
        t.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return ToDto(t);
    }

    public async Task<CharacteristicValueDto> AddValueAsync(Guid typeId, CharacteristicValueCreateRequest req)
    {
        var type = await db.CharacteristicTypes.FindAsync(typeId)
            ?? throw new InvalidOperationException("Characteristic type not found.");
        if (await db.CharacteristicValues.AnyAsync(v => v.CharacteristicTypeId == typeId && v.Code == req.Code))
            throw new InvalidOperationException($"Value code '{req.Code}' already exists for this type.");
        var v = new CharacteristicValue
        {
            CharacteristicTypeId = typeId, Code = req.Code.ToUpper(),
            Name = req.Name, SortOrder = req.SortOrder
        };
        db.CharacteristicValues.Add(v);
        await db.SaveChangesAsync();
        return new CharacteristicValueDto(v.Id, v.CharacteristicTypeId, v.Code, v.Name, v.SortOrder, v.IsActive);
    }

    public async Task<CharacteristicValueDto> UpdateValueAsync(Guid valueId, CharacteristicValueUpdateRequest req)
    {
        var v = await db.CharacteristicValues.FindAsync(valueId)
            ?? throw new InvalidOperationException("Characteristic value not found.");
        v.Name = req.Name; v.SortOrder = req.SortOrder;
        v.IsActive = req.IsActive; v.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return new CharacteristicValueDto(v.Id, v.CharacteristicTypeId, v.Code, v.Name, v.SortOrder, v.IsActive);
    }
}
