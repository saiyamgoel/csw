using System.Security.Claims;
using Csw.Api.Application.DTOs;
using Csw.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Csw.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController(AuthService authService, AuditService audit) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var result = await authService.LoginAsync(req);
        if (result == null)
        {
            await audit.LogAsync("USER_LOGIN_FAILED", null, req.Email, details: "Invalid credentials");
            return Unauthorized(new { error = "Invalid email or password." });
        }
        await audit.LogAsync("USER_LOGIN", result.User.Id, result.User.Email);
        return Ok(result);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await authService.GetCurrentUserAsync(userId);
        if (user == null) return Unauthorized();
        return Ok(user);
    }
}
