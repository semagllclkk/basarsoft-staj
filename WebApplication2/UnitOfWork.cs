using Microsoft.EntityFrameworkCore.Storage;
using WebApplication2.Data;
using WebApplication2.Models;
using WebApplication2.Repositories;

namespace WebApplication2
{
    public class UnitOfWork : IUnitOfWork, IDisposable
    {
        private readonly AppDbContext _context;
        private IDbContextTransaction? _transaction;

        public IPointRepository PointRepository { get; }
        public ILineRepository LineRepository { get; }
        public IPolygonRepository PolygonRepository { get; }
        public IGenericRepository<PointA> Points { get; }
        public IGenericRepository<LineA> Lines { get; }
        public IGenericRepository<PolygonA> Polygons { get; }

        public UnitOfWork(AppDbContext context,
            IPointRepository pointRepository,
            ILineRepository lineRepository,
            IPolygonRepository polygonRepository,
            IGenericRepository<PointA> points,
            IGenericRepository<LineA> lines,
            IGenericRepository<PolygonA> polygons)
        {
            _context = context;
            PointRepository = pointRepository;
            LineRepository = lineRepository;
            PolygonRepository = polygonRepository;
            Points = points;
            Lines = lines;
            Polygons = polygons;
        }

        public async Task BeginTransactionAsync()
        {
            _transaction = await _context.Database.BeginTransactionAsync();
        }

        public async Task CommitAsync()
        {
            if (_transaction != null)
                await _transaction.CommitAsync();
        }

        public async Task RollbackAsync()
        {
            if (_transaction != null)
                await _transaction.RollbackAsync();
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public void Dispose()
        {
            _transaction?.Dispose();
            _context.Dispose();
        }
    }
}