using System.ComponentModel.DataAnnotations;
using NetTopologySuite.Geometries;
using System.Text.Json.Serialization;

namespace WebApplication2.Models
{
    public class PointA
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        public string WKT { get; set; }

        [JsonIgnore]
        public NetTopologySuite.Geometries.Point Geometry { get; set; }
        public string? Type { get; set; }

        [JsonPropertyName("x")]
        public double? X => Geometry != null &&
                           !double.IsNaN(Geometry.X) &&
                           !double.IsInfinity(Geometry.X) ? Geometry.X : null;

        [JsonPropertyName("y")]
        public double? Y => Geometry != null &&
                           !double.IsNaN(Geometry.Y) &&
                           !double.IsInfinity(Geometry.Y) ? Geometry.Y : null;

        [JsonPropertyName("coordinates")]
        public string Coordinates => X.HasValue && Y.HasValue ? $"POINT({X} {Y})" : WKT;
    }
}