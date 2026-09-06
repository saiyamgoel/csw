using Csw.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Csw.Api.Controllers;

[ApiController]
[Route("api/v1/dashboard")]
[Authorize]
public class DashboardController(DashboardService svc) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<IActionResult> Summary() =>
        Ok(await svc.GetSummaryAsync());
}
