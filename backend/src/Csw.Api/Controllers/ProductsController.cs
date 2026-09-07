using Csw.Api.Application.DTOs;
using Csw.Api.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Csw.Api.Controllers;

[ApiController]
[Route("api/v1/products")]
[Authorize]
public class ProductsController(ProductService svc) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? productTypeId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25) =>
        Ok(await svc.GetAllAsync(productTypeId, page, pageSize));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id) => Ok(await svc.GetByIdAsync(id));

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Create([FromBody] ProductCreateRequest req) =>
        Ok(await svc.CreateAsync(req));

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Update(Guid id, [FromBody] ProductUpdateRequest req) =>
        Ok(await svc.UpdateAsync(id, req));

    [HttpGet("{id:guid}/variants")]
    public async Task<IActionResult> GetVariants(Guid id, [FromQuery] bool activeOnly = false) =>
        Ok(await svc.GetVariantsAsync(id, activeOnly));

    [HttpGet("variants")]
    public async Task<IActionResult> GetAllVariants([FromQuery] Guid? productId)
    {
        if (productId.HasValue) return Ok(await svc.GetVariantsAsync(productId.Value));
        var allVariants = new List<ProductVariantDto>();
        var products = await svc.GetAllAsync(null, 1, 999);
        foreach (var p in products.Data)
            allVariants.AddRange(await svc.GetVariantsAsync(p.Id));
        return Ok(allVariants.OrderBy(v => v.VariantCode).ToList());
    }

    [HttpGet("variants/{id:guid}")]
    public async Task<IActionResult> GetVariantById(Guid id) =>
        Ok(await svc.GetVariantByIdAsync(id));

    [HttpPost("variants")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> CreateVariant([FromBody] ProductVariantCreateRequest req) =>
        Ok(await svc.CreateVariantAsync(req));

    [HttpPut("variants/{id:guid}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> UpdateVariant(Guid id, [FromBody] ProductVariantUpdateRequest req) =>
        Ok(await svc.UpdateVariantAsync(id, req));
}
