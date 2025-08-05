using WebApplication2.Dtos;
using WebApplication2.Models;
using WebApplication2.Responces;

namespace WebApplication2.Services
{
    public interface IPointService
    {
        Task<List<PointA>> GetAllPointsAsync();
        Task<Response<PointA>> GetPointByIdAsync(int id);
        Task<Response<PointA>> AddPointAsync(PointDTO dto);
        Task<Response<PointA>> UpdatePointAsync(int id, PointDTO dto);
        Task<Response<PointA>> DeletePointAsync(int id);
        Task<Response<List<PointA>>> SearchPointsByNameAsync(string name);
    }
}