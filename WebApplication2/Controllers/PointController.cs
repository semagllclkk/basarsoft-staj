using Microsoft.AspNetCore.Mvc;
using WebApplication2.Dtos;
using WebApplication2.Services;
using WebApplication2.Models;
using WebApplication2.Responces;

namespace WebApplication2.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PointController : ControllerBase
    {
        private readonly IPointService _service;

        public PointController(IPointService service)
        {
            _service = service;
        }

        [HttpPost("add")]
        public async Task<ActionResult<Response<PointA>>> AddPoint([FromBody] PointDTO dto)
        {
            var result = await _service.AddPointAsync(dto);
            return result.success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<Response<PointA>>> GetPointById(int id)
        {
            var result = await _service.GetPointByIdAsync(id);
            return result.success ? Ok(result) : NotFound(result);
        }

        [HttpGet]
        public async Task<ActionResult<List<PointA>>> GetAllPoints()
        {
            var points = await _service.GetAllPointsAsync();
            return Ok(points);
        }

        [HttpGet("search")]
        public async Task<ActionResult<List<PointA>>> SearchByName([FromQuery] string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest("Arama terimi boş olamaz.");

            var points = await _service.SearchPointsByNameAsync(name);
            return Ok(points);
        }

        [HttpDelete("{id:int}")]
        public async Task<ActionResult<Response<PointA>>> DeletePoint(int id)
        {
            var result = await _service.DeletePointAsync(id);
            return result.success ? Ok(result) : NotFound(result);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<Response<PointA>>> UpdatePoint(int id, [FromBody] PointDTO dto)
        {
            var result = await _service.UpdatePointAsync(id, dto);
            return result.success ? Ok(result) : NotFound(result);
        }
    }
}