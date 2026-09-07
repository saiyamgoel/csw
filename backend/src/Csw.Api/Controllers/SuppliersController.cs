using Csw.Api.Application.DTOs;
using Csw.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Csw.Api.Controllers;

[ApiController]
[Route("api/v1/suppliers")]
[Authorize]
public class SuppliersController(SupplierService svc) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] bool? activeOnly,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
        => Ok(await svc.GetPagedAsync(search, activeOnly, page, pageSize));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var s = await svc.GetByIdAsync(id);
        return s == null ? NotFound() : Ok(s);
    }

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Create([FromBody] SupplierCreateRequest req)
    {
        var s = await svc.CreateAsync(req);
        return CreatedAtAction(nameof(GetById), new { id = s.Id }, s);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Update(Guid id, [FromBody] SupplierUpdateRequest req)
    {
        var s = await svc.UpdateAsync(id, req);
        return s == null ? NotFound() : Ok(s);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var ok = await svc.DeactivateAsync(id);
        return ok ? NoContent() : NotFound();
    }
}
