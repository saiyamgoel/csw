namespace Csw.Api.Application.DTOs;

public record CharacteristicTypeDto(
    Guid Id, string Code, string Name, string? Description, int SortOrder, bool IsActive,
    List<CharacteristicValueDto> Values);

public record CharacteristicValueDto(
    Guid Id, Guid CharacteristicTypeId, string Code, string Name, int SortOrder, bool IsActive);

public record CharacteristicTypeCreateRequest(string Code, string Name, string? Description, int SortOrder);
public record CharacteristicTypeUpdateRequest(string Name, string? Description, int SortOrder, bool IsActive);
public record CharacteristicValueCreateRequest(string Code, string Name, int SortOrder);
public record CharacteristicValueUpdateRequest(string Name, int SortOrder, bool IsActive);

public record CodeMasterDto(
    Guid Id, string SegmentName, int SegmentOrder, string Separator, bool IsOptional, string? Notes,
    Guid? CharacteristicTypeId, string? CharacteristicTypeName);

public record CodeMasterCreateRequest(string SegmentName, int SegmentOrder, string Separator, bool IsOptional, string? Notes, Guid? CharacteristicTypeId);
public record CodeMasterUpdateRequest(string SegmentName, int SegmentOrder, string Separator, bool IsOptional, string? Notes, Guid? CharacteristicTypeId);

public record GenerateCodeRequest(Dictionary<Guid, Guid> Selections);
public record GenerateCodeResponse(string Code, List<CodeSegmentResult> Segments);
public record CodeSegmentResult(string SegmentName, string CharacteristicTypeName, string ValueCode, string ValueName);
