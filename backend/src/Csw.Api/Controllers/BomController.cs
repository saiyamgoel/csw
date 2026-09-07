using Csw.Api.Application.DTOs;
using Csw.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Csw.Api.Controllers;

[ApiController]
[Route("api/v1/boms")]
[Authorize]
public class BomController(BomService svc) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetHeaders([FromQuery] Guid? productVariantId) =>
        Ok(await svc.GetHeadersAsync(productVariantId));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetHeader(Guid id) => Ok(await svc.GetHeaderByIdAsync(id));

    [HttpPost]
    [Authorize(Roles = "Administrator,InventoryUser")]
    public async Task<IActionResult> CreateHeader([FromBody] BomHeaderCreateRequest req) =>
        Ok(await svc.CreateHeaderAsync(req));

    [HttpGet("{id:guid}/versions")]
    public async Task<IActionResult> GetVersions(Guid id) =>
        Ok(await svc.GetVersionsAsync(id));

    [HttpGet("{id:guid}/versions/{versionId:guid}")]
    public async Task<IActionResult> GetVersion(Guid id, Guid versionId) =>
        Ok(await svc.GetVersionByIdAsync(versionId));

    [HttpPost("{id:guid}/versions")]
    [Authorize(Roles = "Administrator,InventoryUser")]
    public async Task<IActionResult> CreateVersion(Guid id, [FromBody] BomVersionCreateRequest req) =>
        Ok(await svc.CreateVersionAsync(id, req));

    [HttpPost("{id:guid}/versions/{versionId:guid}/activate")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Activate(Guid id, Guid versionId, [FromBody] BomActivateRequest req) =>
        Ok(await svc.ActivateVersionAsync(id, versionId, req));

    [HttpPost("{id:guid}/versions/{versionId:guid}/lines")]
    [Authorize(Roles = "Administrator,InventoryUser")]
    public async Task<IActionResult> AddLine(Guid id, Guid versionId, [FromBody] BomLineCreateRequest req) =>
        Ok(await svc.AddLineAsync(versionId, req));

    [HttpPut("{id:guid}/versions/{versionId:guid}/lines/{lineId:guid}")]
    [Authorize(Roles = "Administrator,InventoryUser")]
    public async Task<IActionResult> UpdateLine(Guid id, Guid versionId, Guid lineId, [FromBody] BomLineUpdateRequest req) =>
        Ok(await svc.UpdateLineAsync(versionId, lineId, req));

    [HttpDelete("{id:guid}/versions/{versionId:guid}/lines/{lineId:guid}")]
    [Authorize(Roles = "Administrator,InventoryUser")]
    public async Task<IActionResult> DeleteLine(Guid id, Guid versionId, Guid lineId)
    {
        await svc.DeleteLineAsync(versionId, lineId);
        return NoContent();
    }
}
