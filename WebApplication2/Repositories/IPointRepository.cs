using WebApplication2.Models;

public interface IPointRepository
{
    Task<List<PointA>> GetAllPointsAsync();
    Task<List<PointA>> GetPointsByTypeAsync(string type);
    Task<PointA?> GetPointByIdAsync(int id); 
    Task AddPointAsync(PointA point);
    Task UpdatePointAsync(PointA point); 
    Task<bool> DeletePointAsync(int id);
    Task<List<PointA>> GetByNameAsync(string name);
}
