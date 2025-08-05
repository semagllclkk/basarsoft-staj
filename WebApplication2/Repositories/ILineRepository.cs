using WebApplication2.Models;

public interface ILineRepository
{
    Task<List<LineA>> GetAllLinesAsync();
    Task<List<LineA>> GetLinesByTypeAsync(string type);
    Task<LineA?> GetLineByIdAsync(int id); 
    Task AddLineAsync(LineA line); 
    Task UpdateLineAsync(LineA line); 
    Task<bool> DeleteLineAsync(int id);

}