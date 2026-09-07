using Csw.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Csw.Api.Controllers;

[ApiController]
[Route("api/v1")]
[Authorize]
public class ReportsController(ReportService svc) : ControllerBase
{
    [HttpGet("reports/current-inventory")]
    public async Task<IActionResult> CurrentInventory([FromQuery] string? category) =>
        Ok(await svc.GetCurrentInventoryAsync(category));

    [HttpGet("reports/low-stock")]
    public async Task<IActionResult> LowStock() =>
        Ok(await svc.GetLowStockAsync());

    [HttpGet("reports/stock-movement")]
    public async Task<IActionResult> StockMovement(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] Guid? itemId)
    {
        var dateFrom = from ?? DateTime.Today.AddDays(-30);
        var dateTo   = to ?? DateTime.Today;
        return Ok(await svc.GetStockMovementAsync(dateFrom, dateTo, itemId));
    }

    [HttpGet("audit/events")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> GetAuditLog(
        [FromQuery] string? action,
        [FromQuery] string? username,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
        => Ok(await svc.GetAuditLogAsync(action, username, from, to, page, pageSize));
}
