using System.Security.Claims;
using Csw.Api.Application.DTOs;
using Csw.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Csw.Api.Controllers;

[ApiController]
[Route("api/v1")]
[Authorize]
public class UsersController(UserService svc) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("users")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
        => Ok(await svc.GetPagedAsync(search, page, pageSize));

    [HttpGet("users/{id:guid}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var u = await svc.GetByIdAsync(id);
        return u == null ? NotFound() : Ok(u);
    }

    [HttpPost("users")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Create([FromBody] UserCreateRequest req)
    {
        var u = await svc.CreateAsync(req);
        return CreatedAtAction(nameof(GetById), new { id = u.Id }, u);
    }

    [HttpPut("users/{id:guid}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UserUpdateRequest req)
    {
        var u = await svc.UpdateAsync(id, req);
        return u == null ? NotFound() : Ok(u);
    }

    [HttpPost("users/{id:guid}/roles")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> AssignRole(Guid id, [FromBody] AssignRoleRequest req)
    {
        await svc.AssignRoleAsync(id, req.RoleName);
        return NoContent();
    }

    [HttpDelete("users/{id:guid}/roles/{roleId:guid}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> RemoveRole(Guid id, Guid roleId)
    {
        await svc.RemoveRoleAsync(id, roleId);
        return NoContent();
    }

    [HttpGet("roles")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> GetRoles() =>
        Ok(await svc.GetRolesAsync());

    [HttpPut("auth/me/password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
    {
        await svc.ChangePasswordAsync(CurrentUserId, req);
        return NoContent();
    }
}
