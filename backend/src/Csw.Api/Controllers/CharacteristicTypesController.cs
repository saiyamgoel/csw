using Csw.Api.Application.DTOs;
using Csw.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Csw.Api.Controllers;

[ApiController]
[Route("api/v1/characteristic-types")]
[Authorize]
public class CharacteristicTypesController(CharacteristicTypeService svc) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool activeOnly = false) =>
        Ok(await svc.GetAllAsync(activeOnly));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id) => Ok(await svc.GetByIdAsync(id));

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Create([FromBody] CharacteristicTypeCreateRequest req) =>
        Ok(await svc.CreateAsync(req));

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CharacteristicTypeUpdateRequest req) =>
        Ok(await svc.UpdateAsync(id, req));

    [HttpPost("{id:guid}/values")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> AddValue(Guid id, [FromBody] CharacteristicValueCreateRequest req) =>
        Ok(await svc.AddValueAsync(id, req));

    [HttpPut("values/{valueId:guid}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> UpdateValue(Guid valueId, [FromBody] CharacteristicValueUpdateRequest req) =>
        Ok(await svc.UpdateValueAsync(valueId, req));
}
