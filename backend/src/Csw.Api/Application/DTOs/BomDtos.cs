namespace Csw.Api.Application.DTOs;

public record BomHeaderDto(
    Guid Id, Guid ProductVariantId, string VariantCode, string VariantName,
    Guid? CurrentVersionId, string? CurrentVersionStatus, int? CurrentVersionNumber,
    bool IsActive, string? Notes, DateTime CreatedAt);

public record BomVersionDto(
    Guid Id, Guid BomHeaderId, int VersionNumber, string Status,
    DateOnly EffectiveFrom, DateOnly? EffectiveTo,
    string? ChangeReason, DateTime CreatedAt, DateTime UpdatedAt,
    List<BomLineDto> Lines);

public record BomVersionSummaryDto(
    Guid Id, int VersionNumber, string Status,
    DateOnly EffectiveFrom, DateOnly? EffectiveTo,
    string? ChangeReason, DateTime CreatedAt, int LineCount);

public record BomLineDto(
    Guid Id, int LineNumber, Guid ItemId, string ItemCode, string ItemName,
    decimal Quantity, Guid UnitId, string UnitAbbreviation, decimal WastePercent, string? Notes);

public record BomHeaderCreateRequest(Guid ProductVariantId, string? Notes);
public record BomVersionCreateRequest(DateOnly EffectiveFrom, string? ChangeReason);
public record BomLineCreateRequest(Guid ItemId, decimal Quantity, Guid UnitId, decimal WastePercent, string? Notes);
public record BomLineUpdateRequest(decimal Quantity, Guid UnitId, decimal WastePercent, string? Notes);
public record BomActivateRequest(string? ChangeReason);
