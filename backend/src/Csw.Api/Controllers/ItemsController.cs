using System.Security.Claims;
using Csw.Api.Application.DTOs;
using Csw.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Csw.Api.Controllers;

[ApiController]
[Route("api/v1")]
[Authorize]
public class ItemsController(ItemService itemService) : ControllerBase
{
    [HttpGet("units")]
    public async Task<IActionResult> GetUnits() =>
        Ok(await itemService.GetUnitsAsync());

    [HttpGet("items")]
    public async Task<IActionResult> GetItems(
        [FromQuery] string? category,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        var result = await itemService.GetPagedAsync(category, search, page, pageSize);
        return Ok(result);
    }

    [HttpGet("items/{id:guid}")]
    public async Task<IActionResult> GetItem(Guid id)
    {
        var item = await itemService.GetByIdAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost("items")]
    [Authorize(Roles = "Administrator,InventoryUser")]
    public async Task<IActionResult> CreateItem([FromBody] ItemCreateRequest req)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var item = await itemService.CreateAsync(req, userId);
        return CreatedAtAction(nameof(GetItem), new { id = item.Id }, item);
    }

    [HttpPut("items/{id:guid}")]
    [Authorize(Roles = "Administrator,InventoryUser")]
    public async Task<IActionResult> UpdateItem(Guid id, [FromBody] ItemUpdateRequest req)
    {
        var item = await itemService.UpdateAsync(id, req);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpDelete("items/{id:guid}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> DeleteItem(Guid id)
    {
        var ok = await itemService.DeactivateAsync(id);
        return ok ? NoContent() : NotFound();
    }
}
