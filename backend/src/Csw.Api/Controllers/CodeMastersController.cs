using Csw.Api.Application.DTOs;
using Csw.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Csw.Api.Controllers;

[ApiController]
[Route("api/v1")]
[Authorize]
public class CodeMastersController(CodeGenerationService svc) : ControllerBase
{
    [HttpGet("code-masters")]
    public async Task<IActionResult> GetAll() => Ok(await svc.GetCodeMastersAsync());

    [HttpPost("code-masters")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Create([FromBody] CodeMasterCreateRequest req) =>
        Ok(await svc.CreateCodeMasterAsync(req));

    [HttpPut("code-masters/{id:guid}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CodeMasterUpdateRequest req) =>
        Ok(await svc.UpdateCodeMasterAsync(id, req));

    [HttpPost("generate-code")]
    public async Task<IActionResult> GenerateCode([FromBody] GenerateCodeRequest req) =>
        Ok(await svc.GenerateCodeAsync(req.Selections));
}
