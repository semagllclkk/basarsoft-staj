using Microsoft.AspNetCore.Mvc;
using WebApplication2.Dtos;
using WebApplication2.Models;
using WebApplication2.Responces;
using WebApplication2.Services;

namespace WebApplication2.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PolygonController : ControllerBase
    {
        private readonly IPolygonService _service;

        public PolygonController(IPolygonService service)
        {
            _service = service;
        }

        [HttpPost("add")]
        public async Task<ActionResult<Response<PolygonA>>> Add([FromBody] PolygonDTO dto)
        {
            var result = await _service.AddPolygonAsync(dto);
            return result.success ? Ok(result) : BadRequest(result);
        }

        [HttpGet]
        public async Task<ActionResult<List<PolygonA>>> GetAll()
        {
            var data = await _service.GetAllPolygonsAsync();
            return Ok(data);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Response<PolygonA>>> Get(int id)
        {
            var result = await _service.GetPolygonByIdAsync(id);
            return result.success ? Ok(result) : NotFound(result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Response<PolygonA>>> Update(int id, [FromBody] PolygonDTO dto)
        {
            var result = await _service.UpdatePolygonAsync(id, dto);
            return result.success ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<Response<PolygonA>>> Delete(int id)
        {
            var result = await _service.DeletePolygonAsync(id);
            return result.success ? Ok(result) : NotFound(result);
        }

        [HttpPost("check-intersection")]
        public async Task<IActionResult> CheckIntersection([FromBody] CheckIntersectionRequest request)
        {
            if (string.IsNullOrEmpty(request.Wkt))
            {
                return BadRequest(new { message = "WKT alanı gereklidir" });
            }

            var result = await _service.CheckIntersectionAsync(request.Wkt);

            if (!result.success)
            {
                return BadRequest(new { message = result.message });
            }

            return Ok(result.data);
        }
        public class CheckIntersectionRequest
        {
            public string Wkt { get; set; }
        }
    }
}
