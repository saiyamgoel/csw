namespace Csw.Api.Application.DTOs;

public record ProductDto(
    Guid Id, Guid ProductTypeId, string ProductTypeName, string Name, string? Description,
    bool IsActive, DateTime CreatedAt, int VariantCount);

public record ProductCreateRequest(Guid ProductTypeId, string Name, string? Description);
public record ProductUpdateRequest(string Name, string? Description, bool IsActive);

public record ProductVariantDto(
    Guid Id, Guid ProductId, string ProductName, string VariantCode, string Name,
    Guid UnitId, string UnitName, decimal? SellingPrice, bool IsActive, string? Notes,
    DateTime CreatedAt, List<VariantCharacteristicDto> Characteristics, bool HasBom);

public record VariantCharacteristicDto(
    Guid CharacteristicTypeId, string CharacteristicTypeName,
    Guid CharacteristicValueId, string CharacteristicValueCode, string CharacteristicValueName);

public record ProductVariantCreateRequest(
    Guid ProductId, string Name, Guid UnitId, decimal? SellingPrice, string? Notes,
    Dictionary<Guid, Guid> Characteristics); // typeId → valueId

public record ProductVariantUpdateRequest(
    string Name, Guid UnitId, decimal? SellingPrice, string? Notes, bool IsActive);
