using WebApplication2.Dtos;
using WebApplication2.Models;
using WebApplication2.Responces;

namespace WebApplication2.Services
{
    public interface ILineService
    {
        Task<List<LineA>> GetAllLinesAsync();
        Task<Response<LineA>> GetLineByIdAsync(int id);
        Task<Response<LineA>> AddLineAsync(LineDTO dto);
        Task<Response<LineA>> UpdateLineAsync(int id, LineDTO dto);
        Task<Response<LineA>> DeleteLineAsync(int id);
    }
}