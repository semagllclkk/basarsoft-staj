using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.Models;

namespace WebApplication2.Repositories
{
    public class PolygonRepository : IPolygonRepository
    {
        private readonly AppDbContext _context;

        public PolygonRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PolygonA> AddPolygonAsync(PolygonA polygon)
        {
            await _context.Polygons.AddAsync(polygon);
            return polygon;
        }

        public async Task<bool> DeletePolygonAsync(int id)
        {
            var polygon = await _context.Polygons.FindAsync(id);
            if (polygon == null) return false;

            _context.Polygons.Remove(polygon);
            return true;
        }

        public async Task<List<PolygonA>> GetAllPolygonsAsync()
        {
            return await _context.Polygons.ToListAsync();
        }

        public async Task<PolygonA?> GetPolygonByIdAsync(int id)
        {
            return await _context.Polygons.FindAsync(id);
        }

        public Task<PolygonA> UpdatePolygonAsync(PolygonA polygon)
        {
            _context.Polygons.Update(polygon);
            return Task.FromResult(polygon);
        }
    }
}