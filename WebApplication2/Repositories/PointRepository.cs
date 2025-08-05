using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.Models;

namespace WebApplication2.Repositories
{
    public class PointRepository : IPointRepository
    {
        private readonly AppDbContext _context;

        public PointRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddPointAsync(PointA point)
        {
            await _context.Points.AddAsync(point);
        }

        public async Task<bool> DeletePointAsync(int id)
        {
            var point = await _context.Points.FindAsync(id);
            if (point == null) return false;

            _context.Points.Remove(point);
            return true;
        }

        public async Task<List<PointA>> GetPointsByTypeAsync(string type)
        {
            return await _context.Points
                .Where(p => p.Type == type)
                .ToListAsync();
        }

        public async Task<List<PointA>> GetAllPointsAsync()
        {
            return await _context.Points.ToListAsync();
        }

        public async Task<PointA?> GetPointByIdAsync(int id)
        {
            return await _context.Points.FindAsync(id);
        }

        public async Task UpdatePointAsync(PointA point)
        {
            _context.Points.Update(point);
            await Task.CompletedTask;
        }

        public async Task<List<PointA>> GetByNameAsync(string name)
        {
            return await _context.Points
                .Where(p => p.Name.Contains(name))
                .ToListAsync();
        }
    }
}