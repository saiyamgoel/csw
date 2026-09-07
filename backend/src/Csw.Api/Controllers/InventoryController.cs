using System.Security.Claims;
using Csw.Api.Application.DTOs;
using Csw.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Csw.Api.Controllers;

[ApiController]
[Route("api/v1/inventory")]
[Authorize]
public class InventoryController(InventoryLedgerService svc, AuditService audit) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private string CurrentUsername =>
        User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("name") ?? "unknown";

    [HttpGet("balances")]
    public async Task<IActionResult> GetBalances([FromQuery] bool? lowStockOnly) =>
        Ok(await svc.GetAllBalancesAsync(lowStockOnly));

    [HttpGet("transactions")]
    public async Task<IActionResult> GetLedger(
        [FromQuery] Guid? itemId,
        [FromQuery] string? transactionType,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
        => Ok(await svc.GetLedgerAsync(new LedgerQueryParams(itemId, transactionType, from, to, page, pageSize)));

    [HttpPost("transactions/receipt")]
    [Authorize(Roles = "Administrator,InventoryUser")]
    public async Task<IActionResult> PostReceipt([FromBody] PostReceiptRequest req)
    {
        var result = await svc.PostReceiptAsync(req, CurrentUserId);
        await audit.LogAsync("RECEIPT_POST", CurrentUserId, CurrentUsername, "InventoryTransaction", result.Id.ToString(), $"Item:{req.ItemId} Qty:{req.Quantity}");
        return Ok(result);
    }

    [HttpPost("transactions/consumption")]
    [Authorize(Roles = "Administrator,InventoryUser,ProductionUser")]
    public async Task<IActionResult> PostConsumption([FromBody] PostConsumptionRequest req)
    {
        var result = await svc.PostConsumptionAsync(req, CurrentUserId);
        await audit.LogAsync("CONSUMPTION_POST", CurrentUserId, CurrentUsername, "InventoryTransaction", result.Id.ToString(), $"Item:{req.ItemId} Qty:{req.Quantity}");
        return Ok(result);
    }

    [HttpPost("transactions/adjustment")]
    [Authorize(Roles = "Administrator,InventoryUser")]
    public async Task<IActionResult> PostAdjustment([FromBody] PostAdjustmentRequest req)
    {
        var result = await svc.PostAdjustmentAsync(req, CurrentUserId);
        await audit.LogAsync("ADJUSTMENT_POST", CurrentUserId, CurrentUsername, "InventoryTransaction", result.Id.ToString(), $"Item:{req.ItemId} Qty:{req.Quantity} Positive:{req.IsPositive}");
        return Ok(result);
    }

    [HttpPost("transactions/opening-balance")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> PostOpeningBalance([FromBody] PostOpeningBalanceRequest req)
    {
        var result = await svc.PostOpeningBalanceAsync(req, CurrentUserId);
        await audit.LogAsync("OPENING_BALANCE_POST", CurrentUserId, CurrentUsername, "InventoryTransaction", result.Id.ToString(), $"Item:{req.ItemId} Qty:{req.Quantity}");
        return Ok(result);
    }

    [HttpPost("transactions/{id:guid}/void")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> VoidTransaction(Guid id)
    {
        var result = await svc.VoidTransactionAsync(id, CurrentUserId);
        await audit.LogAsync("TRANSACTION_VOID", CurrentUserId, CurrentUsername, "InventoryTransaction", id.ToString());
        return Ok(result);
    }
}
