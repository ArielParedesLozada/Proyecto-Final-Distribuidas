using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FuelService.Domain.Entities;
using FuelService.Data.Repository;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Authorization;

namespace FuelService.Presentation;

[Route("/")]
[ApiController]
public class FuelRegistryController : ControllerBase
{
    private readonly ILogger<FuelRegistryController> _logger;
    private readonly IRepository<FuelRegister, Guid> _repository;
    public FuelRegistryController(IRepository<FuelRegister, Guid> repository, ILogger<FuelRegistryController> logger)
    {
        _repository = repository;
        _logger = logger;
    }
    [HttpGet]
    [Authorize(Policy = "ADMIN-OR-SUPERVISOR")]
    public async Task<ActionResult<IEnumerable<FuelRegister>>> GetRoutes(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20
        )
    {
        try
        {
            var routes = await _repository.GetAllPagedAsync(page, pageSize);
            return Ok(routes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving routes");
            return StatusCode(500, "Internal server error");
        }
    }

    
}