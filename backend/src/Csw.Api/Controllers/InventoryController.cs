using System.Security.Claims;
using Csw.Api.Application.DTOs;
using Csw.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Csw.Api.Controllers;

[ApiController]
[Route("api/v1/inventory")]
[Authorize]
public class InventoryController(InventoryLedgerService svc) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

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
        => Ok(await svc.PostReceiptAsync(req, CurrentUserId));

    [HttpPost("transactions/consumption")]
    [Authorize(Roles = "Administrator,InventoryUser,ProductionUser")]
    public async Task<IActionResult> PostConsumption([FromBody] PostConsumptionRequest req)
        => Ok(await svc.PostConsumptionAsync(req, CurrentUserId));

    [HttpPost("transactions/adjustment")]
    [Authorize(Roles = "Administrator,InventoryUser")]
    public async Task<IActionResult> PostAdjustment([FromBody] PostAdjustmentRequest req)
        => Ok(await svc.PostAdjustmentAsync(req, CurrentUserId));

    [HttpPost("transactions/opening-balance")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> PostOpeningBalance([FromBody] PostOpeningBalanceRequest req)
        => Ok(await svc.PostOpeningBalanceAsync(req, CurrentUserId));

    [HttpPost("transactions/{id:guid}/void")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> VoidTransaction(Guid id)
        => Ok(await svc.VoidTransactionAsync(id, CurrentUserId));
}
