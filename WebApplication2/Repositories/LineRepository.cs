using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.Models;

namespace WebApplication2.Repositories
{
    public class LineRepository : ILineRepository
    {
        private readonly AppDbContext _context;

        public LineRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddLineAsync(LineA line)
        {
            await _context.Lines.AddAsync(line);
        }

        public async Task<bool> DeleteLineAsync(int id)
        {
            var line = await _context.Lines.FindAsync(id);
            if (line == null) return false;

            _context.Lines.Remove(line);
            return true;
        }

        public async Task<List<LineA>> GetLinesByTypeAsync(string type)
        {
            return await _context.Lines
                .Where(l => l.Type == type)
                .ToListAsync();
        }

        public async Task<List<LineA>> GetAllLinesAsync()
        {
            return await _context.Lines.ToListAsync();
        }

        public async Task<LineA?> GetLineByIdAsync(int id)
        {
            return await _context.Lines.FindAsync(id);
        }

        public async Task UpdateLineAsync(LineA line)
        {
            _context.Lines.Update(line);
            await Task.CompletedTask;
        }
    }
}
