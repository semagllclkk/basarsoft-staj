using System.ComponentModel.DataAnnotations;
using NetTopologySuite.Geometries;
using System.Text.Json.Serialization;

namespace WebApplication2.Models
{
    public class PolygonA
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        public string WKT { get; set; }

        [JsonIgnore]
        public Polygon Geometry { get; set; }
        public string? Type { get; set; } = "A";

        [JsonPropertyName("coordinates")]
        public string Coordinates => Geometry != null ? Geometry.ToString() : WKT;
    }
}
