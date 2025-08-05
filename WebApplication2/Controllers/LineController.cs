using Microsoft.AspNetCore.Mvc;
using WebApplication2.Dtos;
using WebApplication2.Models;
using WebApplication2.Responces;
using WebApplication2.Services;

namespace WebApplication2.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LineController : ControllerBase
    {
        private readonly ILineService _service;

        public LineController(ILineService service)
        {
            _service = service;
        }

        [HttpPost("add")]
        public async Task<ActionResult<Response<LineA>>> Add([FromBody] LineDTO dto)
        {
            var result = await _service.AddLineAsync(dto);
            return result.success ? Ok(result) : BadRequest(result);
        }

        [HttpGet]
        public async Task<ActionResult<List<LineA>>> GetAll()
        {
            var data = await _service.GetAllLinesAsync();
            return Ok(data);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Response<LineA>>> Get(int id)
        {
            var result = await _service.GetLineByIdAsync(id);
            return result.success ? Ok(result) : NotFound(result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Response<LineA>>> Update(int id, [FromBody] LineDTO dto)
        {
            var result = await _service.UpdateLineAsync(id, dto);
            return result.success ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<Response<LineA>>> Delete(int id)
        {
            var result = await _service.DeleteLineAsync(id);
            return result.success ? Ok(result) : NotFound(result);
        }
    }
}