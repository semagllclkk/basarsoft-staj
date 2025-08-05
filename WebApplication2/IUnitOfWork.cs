using WebApplication2.Models;
using WebApplication2.Repositories;

namespace WebApplication2
{
    public interface IUnitOfWork
    {
        IPointRepository PointRepository { get; }
        ILineRepository LineRepository { get; }
        IPolygonRepository PolygonRepository { get; }
        IGenericRepository<PointA> Points { get; }
        IGenericRepository<LineA> Lines { get; }
        IGenericRepository<PolygonA> Polygons { get; }
        Task BeginTransactionAsync();
        Task CommitAsync();
        Task RollbackAsync();
        Task SaveChangesAsync();
    }
}