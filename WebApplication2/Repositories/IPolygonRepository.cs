using WebApplication2.Models;

namespace WebApplication2.Repositories
{
    public interface IPolygonRepository
    {
        Task<PolygonA> AddPolygonAsync(PolygonA polygon);
        Task<PolygonA?> GetPolygonByIdAsync(int id);
        Task<List<PolygonA>> GetAllPolygonsAsync();
        Task<PolygonA> UpdatePolygonAsync(PolygonA polygon);
        Task<bool> DeletePolygonAsync(int id);
    }
}