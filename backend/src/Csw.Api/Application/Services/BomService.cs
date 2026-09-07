using Csw.Api.Application.DTOs;
using Csw.Api.Domain.Entities;
using Csw.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Csw.Api.Application.Services;

public class BomService(AppDbContext db)
{
    private static BomHeaderDto ToHeaderDto(BomHeader h) => new(
        h.Id, h.ProductVariantId, h.ProductVariant?.VariantCode ?? string.Empty,
        h.ProductVariant?.Name ?? string.Empty,
        h.CurrentVersionId, h.CurrentVersion?.Status.ToString(),
        h.CurrentVersion?.VersionNumber, h.IsActive, h.Notes, h.CreatedAt);

    private static BomVersionDto ToVersionDto(BomVersion v) => new(
        v.Id, v.BomHeaderId, v.VersionNumber, v.Status.ToString(),
        v.EffectiveFrom, v.EffectiveTo, v.ChangeReason, v.CreatedAt, v.UpdatedAt,
        v.Lines.OrderBy(l => l.LineNumber).Select(l => new BomLineDto(
            l.Id, l.LineNumber, l.ItemId, l.Item?.Code ?? string.Empty, l.Item?.Name ?? string.Empty,
            l.Quantity, l.UnitId, l.Unit?.Abbreviation ?? string.Empty, l.WastePercent, l.Notes)).ToList());

    private static BomVersionSummaryDto ToSummaryDto(BomVersion v) => new(
        v.Id, v.VersionNumber, v.Status.ToString(), v.EffectiveFrom, v.EffectiveTo,
        v.ChangeReason, v.CreatedAt, v.Lines.Count);

    public async Task<List<BomHeaderDto>> GetHeadersAsync(Guid? productVariantId)
    {
        var q = db.BomHeaders
            .Include(h => h.ProductVariant)
            .Include(h => h.CurrentVersion)
            .AsQueryable();
        if (productVariantId.HasValue) q = q.Where(h => h.ProductVariantId == productVariantId.Value);
        var headers = await q.OrderBy(h => h.ProductVariant.VariantCode).ToListAsync();
        return headers.Select(ToHeaderDto).ToList();
    }

    public async Task<BomHeaderDto> GetHeaderByIdAsync(Guid id)
    {
        var h = await db.BomHeaders
            .Include(h => h.ProductVariant)
            .Include(h => h.CurrentVersion)
            .FirstOrDefaultAsync(h => h.Id == id)
            ?? throw new InvalidOperationException("BOM not found.");
        return ToHeaderDto(h);
    }

    public async Task<BomHeaderDto> CreateHeaderAsync(BomHeaderCreateRequest req)
    {
        _ = await db.ProductVariants.FindAsync(req.ProductVariantId)
            ?? throw new InvalidOperationException("Product variant not found.");
        if (await db.BomHeaders.AnyAsync(h => h.ProductVariantId == req.ProductVariantId))
            throw new InvalidOperationException("A BOM already exists for this variant.");
        var h = new BomHeader { ProductVariantId = req.ProductVariantId, Notes = req.Notes };
        db.BomHeaders.Add(h);
        await db.SaveChangesAsync();
        return await GetHeaderByIdAsync(h.Id);
    }

    public async Task<List<BomVersionSummaryDto>> GetVersionsAsync(Guid headerId)
    {
        var versions = await db.BomVersions
            .Include(v => v.Lines)
            .Where(v => v.BomHeaderId == headerId)
            .OrderByDescending(v => v.VersionNumber).ToListAsync();
        return versions.Select(ToSummaryDto).ToList();
    }

    public async Task<BomVersionDto> GetVersionByIdAsync(Guid versionId)
    {
        var v = await db.BomVersions
            .Include(v => v.Lines).ThenInclude(l => l.Item)
            .Include(v => v.Lines).ThenInclude(l => l.Unit)
            .FirstOrDefaultAsync(v => v.Id == versionId)
            ?? throw new InvalidOperationException("BOM version not found.");
        return ToVersionDto(v);
    }

    public async Task<BomVersionDto> CreateVersionAsync(Guid headerId, BomVersionCreateRequest req)
    {
        var header = await db.BomHeaders.Include(h => h.Versions)
            .FirstOrDefaultAsync(h => h.Id == headerId)
            ?? throw new InvalidOperationException("BOM not found.");

        var nextNum = header.Versions.Any() ? header.Versions.Max(v => v.VersionNumber) + 1 : 1;
        var version = new BomVersion
        {
            BomHeaderId = headerId, VersionNumber = nextNum,
            EffectiveFrom = req.EffectiveFrom, ChangeReason = req.ChangeReason
        };
        db.BomVersions.Add(version);
        await db.SaveChangesAsync();
        return await GetVersionByIdAsync(version.Id);
    }

    public async Task<BomLineDto> AddLineAsync(Guid versionId, BomLineCreateRequest req)
    {
        var version = await db.BomVersions.Include(v => v.Lines)
            .FirstOrDefaultAsync(v => v.Id == versionId)
            ?? throw new InvalidOperationException("BOM version not found.");
        if (version.Status != BomVersionStatus.Draft)
            throw new InvalidOperationException("Only DRAFT versions can be edited.");

        var nextLine = version.Lines.Any() ? version.Lines.Max(l => l.LineNumber) + 1 : 1;
        var item = await db.Items.Include(i => i.Unit).FirstOrDefaultAsync(i => i.Id == req.ItemId)
            ?? throw new InvalidOperationException("Item not found.");
        var unit = await db.Units.FindAsync(req.UnitId)
            ?? throw new InvalidOperationException("Unit not found.");

        var line = new BomLine
        {
            BomVersionId = versionId, LineNumber = nextLine,
            ItemId = req.ItemId, Quantity = req.Quantity,
            UnitId = req.UnitId, WastePercent = req.WastePercent, Notes = req.Notes
        };
        db.BomLines.Add(line);
        await db.SaveChangesAsync();
        return new BomLineDto(line.Id, line.LineNumber, item.Id, item.Code, item.Name,
            line.Quantity, unit.Id, unit.Abbreviation, line.WastePercent, line.Notes);
    }

    public async Task<BomLineDto> UpdateLineAsync(Guid versionId, Guid lineId, BomLineUpdateRequest req)
    {
        var version = await db.BomVersions.FindAsync(versionId)
            ?? throw new InvalidOperationException("BOM version not found.");
        if (version.Status != BomVersionStatus.Draft)
            throw new InvalidOperationException("Only DRAFT versions can be edited.");

        var line = await db.BomLines.Include(l => l.Item).Include(l => l.Unit)
            .FirstOrDefaultAsync(l => l.Id == lineId && l.BomVersionId == versionId)
            ?? throw new InvalidOperationException("BOM line not found.");

        var unit = await db.Units.FindAsync(req.UnitId)
            ?? throw new InvalidOperationException("Unit not found.");

        line.Quantity = req.Quantity; line.UnitId = req.UnitId;
        line.WastePercent = req.WastePercent; line.Notes = req.Notes;
        line.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return new BomLineDto(line.Id, line.LineNumber, line.Item.Id, line.Item.Code, line.Item.Name,
            line.Quantity, unit.Id, unit.Abbreviation, line.WastePercent, line.Notes);
    }

    public async Task DeleteLineAsync(Guid versionId, Guid lineId)
    {
        var version = await db.BomVersions.FindAsync(versionId)
            ?? throw new InvalidOperationException("BOM version not found.");
        if (version.Status != BomVersionStatus.Draft)
            throw new InvalidOperationException("Only DRAFT versions can be edited.");
        var line = await db.BomLines.FirstOrDefaultAsync(l => l.Id == lineId && l.BomVersionId == versionId)
            ?? throw new InvalidOperationException("BOM line not found.");
        db.BomLines.Remove(line);
        await db.SaveChangesAsync();
    }

    public async Task<BomVersionDto> ActivateVersionAsync(Guid headerId, Guid versionId, BomActivateRequest req)
    {
        var header = await db.BomHeaders.Include(h => h.Versions)
            .FirstOrDefaultAsync(h => h.Id == headerId)
            ?? throw new InvalidOperationException("BOM not found.");

        var version = header.Versions.FirstOrDefault(v => v.Id == versionId)
            ?? throw new InvalidOperationException("BOM version not found.");
        if (version.Status != BomVersionStatus.Draft)
            throw new InvalidOperationException("Only DRAFT versions can be activated.");
        if (!await db.BomLines.AnyAsync(l => l.BomVersionId == versionId))
            throw new InvalidOperationException("Cannot activate a BOM version with no lines.");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Supersede current active version
        var currentActive = header.Versions.FirstOrDefault(v => v.Status == BomVersionStatus.Active);
        if (currentActive != null)
        {
            currentActive.Status = BomVersionStatus.Superseded;
            currentActive.EffectiveTo = today;
            currentActive.UpdatedAt = DateTime.UtcNow;
        }

        version.Status = BomVersionStatus.Active;
        version.EffectiveFrom = today;
        if (req.ChangeReason != null) version.ChangeReason = req.ChangeReason;
        version.ApprovedAt = DateTime.UtcNow;
        version.UpdatedAt = DateTime.UtcNow;

        header.CurrentVersionId = versionId;
        header.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return await GetVersionByIdAsync(versionId);
    }
}
