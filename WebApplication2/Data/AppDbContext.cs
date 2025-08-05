using Microsoft.EntityFrameworkCore;
using WebApplication2.Models;

namespace WebApplication2.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<PointA> Points { get; set; }
        public DbSet<LineA> Lines { get; set; }
        public DbSet<PolygonA> Polygons { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<PointA>()
                .Property(p => p.Geometry)
                .HasColumnType("geometry (Point, 4326)");

            modelBuilder.Entity<LineA>()
                .Property(l => l.Geometry)
                .HasColumnType("geometry (LineString, 4326)");

            modelBuilder.Entity<PolygonA>()
                .Property(p => p.Geometry)
                .HasColumnType("geometry (Polygon, 4326)");
        }
    }
}
