namespace Csw.Api.Domain.Entities;

public class AuditEvent
{
    public long Id { get; set; }
    public DateTime EventTime { get; set; } = DateTime.UtcNow;
    public Guid? UserId { get; set; }
    public string? Username { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? Details { get; set; }
    public string Status { get; set; } = "SUCCESS";
}
