namespace Csw.Api.Domain.Entities;

public class CharacteristicType
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public List<CharacteristicValue> Values { get; set; } = [];
    public List<CodeGenerationRule> Rules { get; set; } = [];
}

public class CharacteristicValue
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CharacteristicTypeId { get; set; }
    public CharacteristicType CharacteristicType { get; set; } = null!;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class CodeMaster
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string SegmentName { get; set; } = string.Empty;
    public int SegmentOrder { get; set; }
    public string Separator { get; set; } = "-";
    public bool IsOptional { get; set; } = false;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public CodeGenerationRule? Rule { get; set; }
}

public class CodeGenerationRule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CodeMasterId { get; set; }
    public CodeMaster CodeMaster { get; set; } = null!;
    public Guid CharacteristicTypeId { get; set; }
    public CharacteristicType CharacteristicType { get; set; } = null!;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
