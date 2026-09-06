namespace Csw.Api.Domain.Entities;

public class Unit
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Abbreviation { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public List<Item> Items { get; set; } = [];
}
