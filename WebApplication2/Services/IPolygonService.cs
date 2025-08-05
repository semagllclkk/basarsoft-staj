using WebApplication2.Dtos;
using WebApplication2.Models;
using WebApplication2.Responces;

namespace WebApplication2.Services
{
    public interface IPolygonService
    {
        Task<List<PolygonA>> GetAllPolygonsAsync();
        Task<Response<PolygonA>> GetPolygonByIdAsync(int id);
        Task<Response<PolygonA>> AddPolygonAsync(PolygonDTO dto);
        Task<Response<PolygonA>> UpdatePolygonAsync(int id, PolygonDTO dto);
        Task<Response<PolygonA>> DeletePolygonAsync(int id);
        Task<Response<IntersectionResult>> CheckIntersectionAsync(string wkt);
    }
}