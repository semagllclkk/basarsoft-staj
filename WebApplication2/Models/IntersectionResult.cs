namespace WebApplication2.Models
{
    public class IntersectionResult
    {
        public bool HasIntersection { get; set; }
        public int IntersectingCount { get; set; }
        public List<object> IntersectingPolygons { get; set; } = new List<object>();
    }
}