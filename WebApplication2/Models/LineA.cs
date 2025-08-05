using System.ComponentModel.DataAnnotations;
using NetTopologySuite.Geometries;
using System.Text.Json.Serialization;

namespace WebApplication2.Models
{
    public class LineA
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        public string WKT { get; set; }

        [JsonIgnore]
        public LineString Geometry { get; set; }

        public string? Type { get; set; }

        [JsonPropertyName("coordinates")]
        public string Coordinates => Geometry != null ? Geometry.ToString() : WKT;
    }
}