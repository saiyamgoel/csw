using Csw.Api.Application.DTOs;
using Csw.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Csw.Api.Controllers;

[ApiController]
[Route("api/v1/product-types")]
[Authorize]
public class ProductTypesController(ProductTypeService svc) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25) =>
        Ok(await svc.GetPagedAsync(search, page, pageSize));

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Create([FromBody] ProductTypeCreateRequest req)
    {
        var pt = await svc.CreateAsync(req);
        return CreatedAtAction(nameof(GetAll), new { id = pt.Id }, pt);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Update(Guid id, [FromBody] ProductTypeUpdateRequest req)
    {
        var pt = await svc.UpdateAsync(id, req);
        return pt == null ? NotFound() : Ok(pt);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var ok = await svc.DeactivateAsync(id);
        return ok ? NoContent() : NotFound();
    }
}
