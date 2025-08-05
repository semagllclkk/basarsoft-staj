using NetTopologySuite.Geometries;
using NetTopologySuite.IO;
using WebApplication2.Dtos;
using WebApplication2.Resources;

namespace WebApplication2.Validations
{
    public static class Validation
    {
        public static bool IsValidName(string str, out string message)
        {
            if (string.IsNullOrWhiteSpace(str))
            {
                message = Resource.NameRequired; // "Şehir adı boş bırakılamaz."
                return false;
            }
            if (str.ToLower().StartsWith("ğ"))
            {
                message = Resource.NameCannotStartsWithGh; // "Şehir adı 'ğ' harfiyle başlayamaz."
                return false;
            }
            if (!char.IsUpper(str[0]))
            {
                message = Resource.NameMustStartWithUppercase; // "Şehir adı büyük harfle başlamalıdır."
                return false;
            }
            message = "";
            return true;
        }

        public static bool IsValidCoordinate(double coordinateX, double coordinateY, out string message)
        {
            if (coordinateX < -180 || coordinateX > 180)
            {
                message = Resource.LongitudeOutOfRange; // "Boylam değeri -180 ile 180 arasında olmalıdır."
                return false;
            }
            if (coordinateY < -90 || coordinateY > 90)
            {
                message = Resource.LatitudeOutOfRange; // "Enlem değeri -90 ile 90 arasında olmalıdır."
                return false;
            }
            message = "";
            return true;
        }

        // Point geometrisini kontrol eder
        public static bool IsValidGeometry(Point geometry, out string message)
        {
            if (geometry == null)
            {
                message = Resource.InvalidWktFormat; // "Geometrik veri okunamadı. WKT formatını kontrol edin."
                return false;
            }

            // NaN ve Infinity kontrolü
            if (double.IsNaN(geometry.X) || double.IsNaN(geometry.Y) ||
                double.IsInfinity(geometry.X) || double.IsInfinity(geometry.Y))
            {
                message = Resource.InvalidCoordinates; // "Geçersiz koordinat değerleri tespit edildi."
                return false;
            }

            // Koordinat aralığı kontrolü
            return IsValidCoordinate(geometry.X, geometry.Y, out message);
        }

        // LineString geometrisini kontrol eder
        public static bool IsValidGeometry(LineString geometry, out string message)
        {
            if (geometry == null)
            {
                message = Resource.InvalidWktFormat;
                return false;
            }

            // LineString en az 2 nokta içermeli
            if (geometry.Coordinates.Length < 2)
            {
                message = "LineString en az 2 nokta içermelidir.";
                return false;
            }

            // Her koordinatı kontrol et
            foreach (var coord in geometry.Coordinates)
            {
                if (double.IsNaN(coord.X) || double.IsNaN(coord.Y) ||
                    double.IsInfinity(coord.X) || double.IsInfinity(coord.Y))
                {
                    message = Resource.InvalidCoordinates;
                    return false;
                }

                if (!IsValidCoordinate(coord.X, coord.Y, out message))
                {
                    return false;
                }
            }

            message = "";
            return true;
        }

        // Polygon geometrisini kontrol eder
        public static bool IsValidGeometry(Polygon geometry, out string message)
        {
            if (geometry == null)
            {
                message = Resource.InvalidWktFormat;
                return false;
            }

            // Polygon en az 4 nokta içermeli (kapalı olması için)
            if (geometry.ExteriorRing.Coordinates.Length < 4)
            {
                message = "Polygon en az 4 nokta içermelidir.";
                return false;
            }

            // İlk ve son nokta aynı olmalı (kapalı olması için)
            var coords = geometry.ExteriorRing.Coordinates;
            if (!coords[0].Equals2D(coords[coords.Length - 1]))
            {
                message = "Polygon kapalı olmalıdır (ilk ve son nokta aynı olmalı).";
                return false;
            }

            // Her koordinatı kontrol et
            foreach (var coord in coords)
            {
                if (double.IsNaN(coord.X) || double.IsNaN(coord.Y) ||
                    double.IsInfinity(coord.X) || double.IsInfinity(coord.Y))
                {
                    message = Resource.InvalidCoordinates;
                    return false;
                }

                if (!IsValidCoordinate(coord.X, coord.Y, out message))
                {
                    return false;
                }
            }

            message = "";
            return true;
        }

        // WKT string'ini Point olarak kontrol eder
        public static bool IsValidWKT(string wkt, out string message, out Point geometry)
        {
            geometry = null;
            message = "";

            if (string.IsNullOrWhiteSpace(wkt))
            {
                message = Resource.InvalidWktFormat;
                return false;
            }

            try
            {
                var geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
                var wktReader = new WKTReader(geometryFactory);
                geometry = wktReader.Read(wkt) as Point;

                return IsValidGeometry(geometry, out message);
            }
            catch (Exception)
            {
                message = Resource.InvalidWktFormat;
                return false;
            }
        }

        // WKT string'ini LineString olarak kontrol eder
        public static bool IsValidWKT(string wkt, out string message, out LineString geometry)
        {
            geometry = null;
            message = "";

            if (string.IsNullOrWhiteSpace(wkt))
            {
                message = Resource.InvalidWktFormat;
                return false;
            }

            try
            {
                var geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
                var wktReader = new WKTReader(geometryFactory);
                geometry = wktReader.Read(wkt) as LineString;

                return IsValidGeometry(geometry, out message);
            }
            catch (Exception)
            {
                message = Resource.InvalidWktFormat;
                return false;
            }
        }

        // WKT string'ini Polygon olarak kontrol eder
        public static bool IsValidWKT(string wkt, out string message, out Polygon geometry)
        {
            geometry = null;
            message = "";

            if (string.IsNullOrWhiteSpace(wkt))
            {
                message = Resource.InvalidWktFormat;
                return false;
            }

            try
            {
                var geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
                var wktReader = new WKTReader(geometryFactory);
                geometry = wktReader.Read(wkt) as Polygon;

                return IsValidGeometry(geometry, out message);
            }
            catch (Exception)
            {
                message = Resource.InvalidWktFormat;
                return false;
            }
        }

        // DTO'yu komple kontrol eder
        public static bool IsValidPointDTO(PointDTO dto, out string message)
        {
            message = "";

            if (!IsValidName(dto.Name, out message))
            {
                return false;
            }

            if (!IsValidWKT(dto.WKT, out message, out Point geometry))
            {
                return false;
            }

            return true;
        }

        public static bool IsValidLineDTO(LineDTO dto, out string message)
        {
            message = "";

            if (!IsValidName(dto.Name, out message))
            {
                return false;
            }

            if (!IsValidWKT(dto.WKT, out message, out LineString geometry))
            {
                return false;
            }

            return true;
        }

        public static bool IsValidPolygonDTO(PolygonDTO dto, out string message)
        {
            message = "";

            if (!IsValidName(dto.Name, out message))
            {
                return false;
            }

            if (!IsValidWKT(dto.WKT, out message, out Polygon geometry))
            {
                return false;
            }

            return true;
        }

        public static T CleanGeometry<T>(T geometry) where T : Geometry
        {
            if (geometry == null) return null;

            if (geometry.Coordinates.Any(coord =>
                double.IsNaN(coord.X) || double.IsNaN(coord.Y) ||
                double.IsInfinity(coord.X) || double.IsInfinity(coord.Y)))
            {
                return null;
            }

            return geometry;
        }
    }
}