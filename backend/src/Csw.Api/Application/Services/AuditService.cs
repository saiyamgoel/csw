using Csw.Api.Domain.Entities;
using Csw.Api.Infrastructure.Data;

namespace Csw.Api.Application.Services;

public class AuditService(AppDbContext db)
{
    public async Task LogAsync(string action, Guid? userId, string? username,
        string? entityType = null, string? entityId = null, string? details = null)
    {
        db.AuditEvents.Add(new AuditEvent
        {
            Action = action,
            UserId = userId,
            Username = username,
            EntityType = entityType,
            EntityId = entityId,
            Details = details,
            EventTime = DateTime.UtcNow,
            Status = "SUCCESS"
        });
        await db.SaveChangesAsync();
    }
}
