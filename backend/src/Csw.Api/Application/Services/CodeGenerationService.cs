using Csw.Api.Application.DTOs;
using Csw.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Csw.Api.Application.Services;

public class CodeGenerationService(AppDbContext db)
{
    public async Task<List<CodeMasterDto>> GetCodeMastersAsync()
    {
        var masters = await db.CodeMasters
            .Include(cm => cm.Rule).ThenInclude(r => r!.CharacteristicType)
            .OrderBy(cm => cm.SegmentOrder).ToListAsync();

        return masters.Select(cm => new CodeMasterDto(
            cm.Id, cm.SegmentName, cm.SegmentOrder, cm.Separator, cm.IsOptional, cm.Notes,
            cm.Rule?.CharacteristicTypeId, cm.Rule?.CharacteristicType.Name)).ToList();
    }

    public async Task<CodeMasterDto> CreateCodeMasterAsync(CodeMasterCreateRequest req)
    {
        var cm = new Domain.Entities.CodeMaster
        {
            SegmentName = req.SegmentName, SegmentOrder = req.SegmentOrder,
            Separator = req.Separator, IsOptional = req.IsOptional, Notes = req.Notes
        };
        db.CodeMasters.Add(cm);
        await db.SaveChangesAsync();

        if (req.CharacteristicTypeId.HasValue)
        {
            var rule = new Domain.Entities.CodeGenerationRule
            {
                CodeMasterId = cm.Id, CharacteristicTypeId = req.CharacteristicTypeId.Value
            };
            db.CodeGenerationRules.Add(rule);
            await db.SaveChangesAsync();
        }

        return (await GetCodeMastersAsync()).First(x => x.Id == cm.Id);
    }

    public async Task<CodeMasterDto> UpdateCodeMasterAsync(Guid id, CodeMasterUpdateRequest req)
    {
        var cm = await db.CodeMasters.Include(cm => cm.Rule).FirstOrDefaultAsync(cm => cm.Id == id)
            ?? throw new InvalidOperationException("Code master not found.");

        cm.SegmentName = req.SegmentName; cm.SegmentOrder = req.SegmentOrder;
        cm.Separator = req.Separator; cm.IsOptional = req.IsOptional;
        cm.Notes = req.Notes; cm.UpdatedAt = DateTime.UtcNow;

        if (req.CharacteristicTypeId.HasValue)
        {
            if (cm.Rule == null)
            {
                var rule = new Domain.Entities.CodeGenerationRule
                    { CodeMasterId = cm.Id, CharacteristicTypeId = req.CharacteristicTypeId.Value };
                db.CodeGenerationRules.Add(rule);
            }
            else
            {
                cm.Rule.CharacteristicTypeId = req.CharacteristicTypeId.Value;
                cm.Rule.UpdatedAt = DateTime.UtcNow;
            }
        }
        else if (cm.Rule != null)
        {
            db.CodeGenerationRules.Remove(cm.Rule);
        }

        await db.SaveChangesAsync();
        return (await GetCodeMastersAsync()).First(x => x.Id == cm.Id);
    }

    // Generates composite code from characteristic value selections.
    // selections: CharacteristicTypeId → CharacteristicValueId
    public async Task<GenerateCodeResponse> GenerateCodeAsync(Dictionary<Guid, Guid> selections)
    {
        var masters = await db.CodeMasters
            .Include(cm => cm.Rule).ThenInclude(r => r!.CharacteristicType).ThenInclude(t => t.Values)
            .Where(cm => cm.Rule != null && cm.Rule.IsActive)
            .OrderBy(cm => cm.SegmentOrder).ToListAsync();

        var allValueIds = selections.Values.ToList();
        var values = await db.CharacteristicValues
            .Where(v => allValueIds.Contains(v.Id)).ToListAsync();
        var valueMap = values.ToDictionary(v => v.Id);

        var segments = new List<CodeSegmentResult>();
        var codeParts = new List<string>();
        var isFirst = true;

        foreach (var cm in masters)
        {
            var typeId = cm.Rule!.CharacteristicTypeId;
            if (!selections.TryGetValue(typeId, out var valueId))
            {
                if (!cm.IsOptional)
                    throw new InvalidOperationException($"Required segment '{cm.SegmentName}' has no selection.");
                continue;
            }

            if (!valueMap.TryGetValue(valueId, out var val))
                throw new InvalidOperationException($"Value not found for segment '{cm.SegmentName}'.");
            if (val.CharacteristicTypeId != typeId)
                throw new InvalidOperationException($"Value does not belong to type for segment '{cm.SegmentName}'.");

            var separator = isFirst ? string.Empty : cm.Separator;
            codeParts.Add(separator + val.Code);
            segments.Add(new CodeSegmentResult(cm.SegmentName, cm.Rule.CharacteristicType.Name, val.Code, val.Name));
            isFirst = false;
        }

        return new GenerateCodeResponse(string.Concat(codeParts), segments);
    }
}
